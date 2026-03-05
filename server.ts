import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Database Connection Pool
// We use a connection pool to manage multiple concurrent requests efficiently.
// The connection string comes from the environment variable DATABASE_URL.
let pool: Pool;

if (!process.env.DATABASE_URL) {
  console.error('CRITICAL: DATABASE_URL is missing! Database features will not work.');
  // Create a dummy pool that always fails gracefully
  pool = {
    query: async () => { throw new Error('Database not configured (missing DATABASE_URL)'); },
    connect: async () => { throw new Error('Database not configured (missing DATABASE_URL)'); },
  } as any;
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

// Create Users Table if it doesn't exist
const initDb = async () => {
  if (!process.env.DATABASE_URL) return;
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        gift_link TEXT,
        plain_password TEXT,
        message TEXT,
        theme_id TEXT DEFAULT 'default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add columns if they don't exist (migration)
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS message TEXT`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_id TEXT DEFAULT 'default'`);
    } catch (e) {
      console.log('Migration note: Columns might already exist');
    }
    
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
    if (!process.env.DATABASE_URL) {
      console.warn('WARNING: DATABASE_URL environment variable is not set. Database operations will fail.');
    }
  }
};

initDb();

// In-memory rate limiter
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const BLOCK_DURATION = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

// API Routes

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    db_connected: !!process.env.DATABASE_URL
  });
});

// Debug Endpoint (Admin Only)
app.post('/api/debug/status', async (req, res) => {
  const { admin_secret } = req.body;
  const validSecret = process.env.ADMIN_SECRET || 'rahasia123';
  
  if (admin_secret !== validSecret) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Check DB Connection Info
    const dbInfo = await pool.query('SELECT current_database(), inet_server_addr(), version()');
    
    // Check Table Schema
    const schemaInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);

    // Check Recent Data (Raw)
    const recentData = await pool.query('SELECT id, username, message, theme_id FROM users ORDER BY created_at DESC LIMIT 5');

    return res.json({
      success: true,
      database: dbInfo.rows[0],
      schema: schemaInfo.rows,
      recent_data: recentData.rows,
      env_check: {
        has_db_url: !!process.env.DATABASE_URL,
        node_env: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Manual Migration Endpoint (Admin Only)
app.post('/api/admin/migrate', async (req, res) => {
  const { admin_secret } = req.body;
  const validSecret = process.env.ADMIN_SECRET || 'rahasia123';
  
  if (admin_secret !== validSecret) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Force add columns
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS message TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_id TEXT DEFAULT 'default'`);
    
    // Check columns
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    return res.json({ 
      success: true, 
      message: 'Migration run successfully', 
      columns: result.rows.map(r => r.column_name) 
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return res.status(500).json({ success: false, message: 'Migration failed: ' + error.message });
  }
});

// Verify Admin Secret Endpoint
app.post('/api/verify-admin', (req, res) => {
  const { admin_secret } = req.body;
  const validSecret = process.env.ADMIN_SECRET || 'rahasia123';
  
  if (admin_secret === validSecret) {
    return res.json({ success: true });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid Admin Secret' });
  }
});

// Register Endpoint
app.post('/api/register', async (req, res) => {
  const { username, password, gift_link, admin_secret, message, theme_id } = req.body;
  console.log('Registering user:', { username, gift_link, message, theme_id }); // Debug log

  // 1. SECURITY CHECK
  // Default 'rahasia123' for local dev if env not set
  const validSecret = process.env.ADMIN_SECRET || 'rahasia123';
  
  if (admin_secret !== validSecret) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Wrong Admin Secret' });
  }

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }

  try {
    // Check if user exists
    const checkResult = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }

    // Hash password
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const link = gift_link || 'https://link.dana.id/kaget/default';
    const msg = message || '';
    const theme = theme_id || 'default';
    
    console.log('EXECUTING INSERT:', { username, link, msg, theme });

    // Explicitly listing columns to avoid ambiguity
    const queryText = `
      INSERT INTO users (username, password_hash, gift_link, plain_password, message, theme_id) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, message, theme_id
    `;
    
    const insertResult = await pool.query(queryText, [username, hash, link, password, msg, theme]);
    console.log('INSERT RESULT:', insertResult.rows[0]);

    // Artificial delay for security feel
    await new Promise(resolve => setTimeout(resolve, 800));

    return res.json({ 
      success: true, 
      message: `User created! Msg: ${msg.substring(0,5)}..., Theme: ${theme}`,
      debug_data: insertResult.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get All Users (Admin Only)
app.post('/api/admin/users', async (req, res) => {
  const { admin_secret } = req.body;
  const validSecret = process.env.ADMIN_SECRET || 'rahasia123';
  
  if (admin_secret !== validSecret) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const result = await pool.query('SELECT username, gift_link, plain_password as password, message, theme_id FROM users ORDER BY created_at DESC');
    return res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update User (Admin Only)
app.post('/api/admin/update-user', async (req, res) => {
  const { admin_secret, original_username, username, password, gift_link, message, theme_id } = req.body;
  console.log('Updating user:', { original_username, username, message, theme_id }); // Debug log

  const validSecret = process.env.ADMIN_SECRET || 'rahasia123';
  
  if (admin_secret !== validSecret) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Hash new password if provided
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    const msg = message || '';
    const theme = theme_id || 'default';

    console.log('EXECUTING UPDATE:', { original_username, username, msg, theme });

    const updateQuery = `
      UPDATE users 
      SET username = $1, password_hash = $2, plain_password = $3, gift_link = $4, message = $5, theme_id = $6 
      WHERE username = $7
      RETURNING id, username, message, theme_id
    `;

    const updateResult = await pool.query(updateQuery, [username, hash, password, gift_link, msg, theme, original_username]);
    console.log('UPDATE RESULT:', updateResult.rows[0]);

    return res.json({ success: true, message: 'User updated successfully', debug_data: updateResult.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete User (Admin Only)
app.post('/api/admin/delete-user', async (req, res) => {
  const { admin_secret, username } = req.body;
  const validSecret = process.env.ADMIN_SECRET || 'rahasia123';
  
  if (admin_secret !== validSecret) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    await pool.query('DELETE FROM users WHERE username = $1', [username]);
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || 'unknown';
  
  // Rate Limiting Logic
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };

  if (attempts.count >= MAX_ATTEMPTS) {
    if (now - attempts.lastAttempt < BLOCK_DURATION) {
      const remaining = Math.ceil((BLOCK_DURATION - (now - attempts.lastAttempt)) / 1000);
      return res.status(429).json({ 
        success: false, 
        message: `Too many attempts. Try again in ${remaining}s.` 
      });
    } else {
      attempts.count = 0;
    }
  }

  // Artificial delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      // Increment attempts
      attempts.count++;
      attempts.lastAttempt = now;
      loginAttempts.set(ip, attempts);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (match) {
      // Reset attempts on success
      loginAttempts.delete(ip);
      return res.json({ 
        success: true, 
        token: crypto.randomUUID(),
        username: user.username,
        gift_link: user.gift_link,
        message: user.message,
        theme_id: user.theme_id
      });
    } else {
      // Increment attempts
      attempts.count++;
      attempts.lastAttempt = now;
      loginAttempts.set(ip, attempts);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
