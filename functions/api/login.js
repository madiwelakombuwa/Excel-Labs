// Cloudflare Pages Function - Login API with D1 Database Authentication

// Main request handler
export async function onRequest(context) {
    const { request, env } = context;

    // Check if D1 database is available
    if (!env.DB) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Database not configured'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({
            success: false,
            error: 'Method not allowed'
        }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Username and password are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Query database for user
        const stmt = env.DB.prepare(
            'SELECT username, full_name, role, is_active FROM users WHERE username = ? AND password = ? AND is_active = 1'
        );
        const user = await stmt.bind(username, password).first();

        if (!user) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Invalid username or password'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update last login timestamp
        await env.DB.prepare(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = ?'
        ).bind(username).run();

        // Return user info (excluding password)
        return new Response(JSON.stringify({
            success: true,
            user: {
                username: user.username,
                fullName: user.full_name,
                role: user.role
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Login failed',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
