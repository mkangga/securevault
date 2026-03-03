import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export const onRequestPost = async (context) => {
  const { request, env } = context;
  
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: 'Username and password required' }), { status: 400 });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ success: false, message: 'Password must be at least 8 characters' }), { status: 400 });
    }

    const pool = new Pool({ connectionString: env.DATABASE_URL });
    
    // Check if user exists
    const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (rows.length > 0) {
      return new Response(JSON.stringify({ success: false, message: 'Username already taken' }), { status: 409 });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert user
    await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hash]);
    
    // Close connection (serverless)
    context.waitUntil(pool.end());

    return new Response(JSON.stringify({ success: true, message: 'Registration successful' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: 'Internal server error: ' + error.message }), { status: 500 });
  }
};
