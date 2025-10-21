// Cloudflare Pages Function - Server-side Dashboard API with D1 Database
// This uses Cloudflare D1 database to store and retrieve user data

// Simple session token validation
async function validateSession(sessionToken, db) {
    if (!sessionToken) return null;

    try {
        // Decode the base64 session data
        const decoded = atob(sessionToken);
        const userData = JSON.parse(decoded);

        // Verify user exists in database
        const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1');
        const user = await stmt.bind(userData.username).first();

        if (user) {
            return {
                username: user.username,
                fullName: user.full_name,
                role: user.role
            };
        }
    } catch (e) {
        console.error('Session validation error:', e);
        return null;
    }

    return null;
}

// Update last login time
async function updateLastLogin(username, db) {
    try {
        const stmt = db.prepare(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = ?'
        );
        await stmt.bind(username).run();
    } catch (e) {
        console.error('Error updating last login:', e);
    }
}

// Main request handler
export async function onRequest(context) {
    const { request, env } = context;

    // Check if D1 database is available
    if (!env.DB) {
        return new Response(JSON.stringify({ error: 'Database not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Get session token from query parameter or header
    const url = new URL(request.url);
    const sessionToken = url.searchParams.get('session') || request.headers.get('X-Session-Token');

    // Validate session against database
    const user = await validateSession(sessionToken, env.DB);

    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Get user's dashboard URL from database
    const stmt = env.DB.prepare('SELECT dashboard_url FROM users WHERE username = ? AND is_active = 1');
    const result = await stmt.bind(user.username).first();

    if (!result || !result.dashboard_url) {
        return new Response(JSON.stringify({ error: 'No dashboard available for this user' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Update last login timestamp
    await updateLastLogin(user.username, env.DB);

    // Return the dashboard URL (only accessible to authenticated users)
    return new Response(JSON.stringify({
        dashboardUrl: result.dashboard_url,
        user: {
            username: user.username,
            fullName: user.fullName,
            role: user.role
        }
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, no-cache, no-store, must-revalidate'
        }
    });
}
