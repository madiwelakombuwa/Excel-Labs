// Cloudflare Pages Function - Server-side Dashboard Proxy
// This keeps the actual Looker Studio URLs hidden from the client

// Secure dashboard URLs stored on server-side only
const DASHBOARD_URLS = {
    'user1': 'https://lookerstudio.google.com/embed/reporting/119d56c0-7d73-4bb0-8fb9-d67a5a41361c/page/ecoJD',
    'user2': 'https://lookerstudio.google.com/embed/reporting/e8a53377-0277-49c2-adb0-f6529163757b/page/gZbyC',
    'Accounting': 'https://docs.google.com/spreadsheets/d/1MOi94WoHSk5N0ooItm4aWQ8-3vfRiLi5HG4_fdCzl7s/template/preview'
};

// Dummy users database (in production, this would be in a real database)
const USERS = {
    'admin': { password: 'admin123', fullName: 'Administrator', role: 'Admin' },
    'user1': { password: 'password1', fullName: 'John Doe', role: 'User' },
    'user2': { password: 'password2', fullName: 'Jane Smith', role: 'User' },
    'Accounting': { password: 'password123', fullName: 'Accounting Manager', role: 'Accounting' }
};

// Simple session token validation
function validateSession(sessionToken) {
    if (!sessionToken) return null;

    try {
        // In a real app, you'd validate JWT or check against a session store
        // For this demo, we decode the base64 session data
        const decoded = atob(sessionToken);
        const userData = JSON.parse(decoded);

        // Verify user exists
        if (USERS[userData.username]) {
            return userData;
        }
    } catch (e) {
        return null;
    }

    return null;
}

// Main request handler
export async function onRequest(context) {
    const { request } = context;

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

    // Validate session
    const user = validateSession(sessionToken);

    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Get dashboard URL for this user
    const dashboardUrl = DASHBOARD_URLS[user.username];

    if (!dashboardUrl) {
        return new Response(JSON.stringify({ error: 'No dashboard available for this user' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Return the dashboard URL (only accessible to authenticated users)
    return new Response(JSON.stringify({
        dashboardUrl: dashboardUrl,
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
