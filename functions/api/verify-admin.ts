export const onRequestPost = async (context) => {
  const { request, env } = context;
  
  try {
    const { admin_secret } = await request.json();
    const validSecret = env.ADMIN_SECRET || 'rahasia123';
    
    if (admin_secret === validSecret) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, message: 'Invalid Admin Secret' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: 'Error verifying admin' }), { status: 500 });
  }
};
