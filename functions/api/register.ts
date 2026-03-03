import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export const onRequestPost = async (context) => {
  const { request, env } = context;
  
  try {
    const { username, password, gift_link, admin_secret } = await request.json();

    // 1. SECURITY CHECK
    // Get secret from Env Var or use default 'rahasia123'
    const validSecret = env.ADMIN_SECRET || 'rahasia123';
    
    if (admin_secret !== validSecret) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized: Wrong Admin Secret' }), { status: 401 });
    }

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: 'Username and password required' }), { status: 400 });
    }

    if (password.length < 5) {
      return new Response(JSON.stringify({ success: false, message: 'Password too short' }), { status: 400 });
    }

    const pool = new Pool({ connectionString: env.DATABASE_URL });
    
    // Check if user exists
    const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (rows.length > 0) {
      return new Response(JSON.stringify({ success: false, message: 'Code/User already exists' }), { status: 409 });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert user with gift link and plain password (for admin reference)
    const link = gift_link || 'https://link.dana.id/kaget/default';
    
    // Try to insert with plain_password, fallback to old schema if column doesn't exist (though migration should be run)
    try {
      await pool.query('INSERT INTO users (username, password_hash, gift_link, plain_password) VALUES ($1, $2, $3, $4)', [username, hash, link, password]);
    } catch (err) {
      // Fallback for old schema if migration hasn't run yet
      if (err.message.includes('plain_password')) {
         await pool.query('INSERT INTO users (username, password_hash, gift_link) VALUES ($1, $2, $3)', [username, hash, link]);
      } else {
        throw err;
      }
    }
    
    // Close connection (serverless)
    context.waitUntil(pool.end());

    return new Response(JSON.stringify({ success: true, message: 'Gift created successfully' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: 'Internal server error: ' + error.message }), { status: 500 });
  }
};
