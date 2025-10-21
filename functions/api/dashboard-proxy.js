// Full Content Proxy - Proxies actual Looker Studio content
// This completely hides the Looker Studio URL from the client

// Dashboard URL mapping (stored server-side only)
const DASHBOARD_URLS = {
    'user1': 'https://lookerstudio.google.com/embed/reporting/119d56c0-7d73-4bb0-8fb9-d67a5a41361c/page/ecoJD',
    'user2': 'https://lookerstudio.google.com/embed/reporting/e8a53377-0277-49c2-adb0-f6529163757b/page/gZbyC'
};

const USERS = {
    'admin': { password: 'admin123', fullName: 'Administrator', role: 'Admin' },
    'user1': { password: 'password1', fullName: 'John Doe', role: 'User' },
    'user2': { password: 'password2', fullName: 'Jane Smith', role: 'User' }
};

function validateSession(sessionToken) {
    if (!sessionToken) return null;
    try {
        const decoded = atob(sessionToken);
        const userData = JSON.parse(decoded);
        if (USERS[userData.username]) {
            return userData;
        }
    } catch (e) {
        return null;
    }
    return null;
}

export async function onRequest(context) {
    const { request } = context;

    // Get session token from cookie or query parameter
    const url = new URL(request.url);
    const sessionToken = url.searchParams.get('session') || request.headers.get('X-Session-Token');

    // Validate session
    const user = validateSession(sessionToken);

    if (!user) {
        return new Response('Unauthorized', {
            status: 401,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    // Get dashboard URL for this user
    const dashboardUrl = DASHBOARD_URLS[user.username];

    if (!dashboardUrl) {
        return new Response('No dashboard available', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    // Get the path to proxy (everything after /api/dashboard-proxy/)
    const pathToProxy = url.pathname.replace('/api/dashboard-proxy', '') || '';
    const searchParams = new URLSearchParams(url.search);
    searchParams.delete('session'); // Remove session param before proxying

    // Construct the target URL
    let targetUrl = dashboardUrl;
    if (pathToProxy && pathToProxy !== '/') {
        // For additional resources (CSS, JS, images, etc.)
        targetUrl = `https://lookerstudio.google.com${pathToProxy}`;
    }
    if (searchParams.toString()) {
        targetUrl += '?' + searchParams.toString();
    }

    try {
        // Fetch from Looker Studio
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: {
                'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
                'Accept': request.headers.get('Accept') || '*/*',
                'Accept-Language': request.headers.get('Accept-Language') || 'en-US,en;q=0.9',
                'Referer': 'https://lookerstudio.google.com/',
            }
        });

        // Get response body
        let body = await response.arrayBuffer();
        const contentType = response.headers.get('Content-Type') || '';

        // Rewrite HTML to proxy all resources through our endpoint
        if (contentType.includes('text/html')) {
            let html = new TextDecoder().decode(body);

            // Rewrite absolute URLs to go through our proxy
            html = html.replace(
                /https:\/\/lookerstudio\.google\.com/g,
                `/api/dashboard-proxy?session=${encodeURIComponent(sessionToken)}`
            );

            body = new TextEncoder().encode(html);
        }

        // Create response with proxied content
        const headers = new Headers();
        headers.set('Content-Type', contentType);

        // Important: Set CORS headers to allow embedding
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('X-Frame-Options', 'ALLOWALL');

        // Cache control
        const cacheControl = response.headers.get('Cache-Control');
        if (cacheControl) {
            headers.set('Cache-Control', cacheControl);
        }

        return new Response(body, {
            status: response.status,
            headers: headers
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return new Response('Error proxying dashboard content', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}
