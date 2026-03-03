import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export const onRequestPost = async (context) => {
  const { request, env } = context;
  
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: 'Username and password required' }), { status: 400 });
    }

    const pool = new Pool({ connectionString: env.DATABASE_URL });
    
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = rows[0];

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid code or password' }), { status: 401 });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (match) {
      // Close connection
      context.waitUntil(pool.end());
      
      return new Response(JSON.stringify({ 
        success: true, 
        username: user.username,
        gift_link: user.gift_link // Return the gift link
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, message: 'Invalid code or password' }), { status: 401 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: 'Internal server error: ' + error.message }), { status: 500 });
  }
};
