// Test endpoint to verify D1 database is accessible
export async function onRequest(context) {
    const { env } = context;

    // Check if DB binding exists
    if (!env.DB) {
        return new Response(JSON.stringify({
            error: 'D1 database binding not found',
            message: 'DB binding is not configured. Please add D1 binding in Cloudflare Pages settings.',
            binding_name_expected: 'DB',
            available_bindings: Object.keys(env)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Try to query the database
        const result = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
        const users = await env.DB.prepare('SELECT username, role FROM users LIMIT 5').all();

        return new Response(JSON.stringify({
            success: true,
            message: 'D1 database is connected and working!',
            user_count: result.count,
            sample_users: users.results,
            database_binding: 'DB'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Database query failed',
            message: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
