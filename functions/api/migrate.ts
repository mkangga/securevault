import { Pool } from '@neondatabase/serverless';

export const onRequestGet = async (context) => {
  const { env } = context;
  
  try {
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    
    // Add plain_password column if it doesn't exist
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS plain_password TEXT;');
    
    // Close connection
    context.waitUntil(pool.end());

    return new Response("Migration successful: Added plain_password column", { status: 200 });
  } catch (error) {
    return new Response("Migration failed: " + error.message, { status: 500 });
  }
};
