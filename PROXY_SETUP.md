# Server-Side Proxy Setup for Dashboard URLs

## Overview

This application uses **Cloudflare Pages Functions** to implement a **full content proxy** that completely hides Looker Studio dashboard URLs from client-side code by proxying all dashboard content through the server.

## How It Works

### Architecture - Full Content Proxy

```
Client (Browser)
    ↓
    ↓ [Requests: /api/dashboard-proxy?session=token]
    ↓
Server-Side Function (/functions/api/dashboard-proxy.js)
    ↓
    ↓ [1. Validates session token]
    ↓ [2. Fetches content from Looker Studio]
    ↓ [3. Rewrites URLs in HTML to point back to proxy]
    ↓ [4. Returns proxied content]
    ↓
Client displays content in iframe
    (Looker Studio URL NEVER exposed to client)
```

### Two Proxy Endpoints

1. **/api/dashboard.js** - Returns dashboard metadata (for access checks)
2. **/api/dashboard-proxy.js** - Proxies actual Looker Studio content

### Security Benefits

1. **Dashboard URLs are stored server-side only** - Never exposed in client-side code
2. **URLs never appear in iframe src** - iframe points to `/api/dashboard-proxy`, not Looker Studio
3. **Authentication validation on server** - Cannot be bypassed by client manipulation
4. **No URL in browser DevTools** - URLs are not visible anywhere in the client
5. **Session-based access control** - Only authenticated users can access proxied content
6. **Content rewriting** - All Looker Studio resources are proxied through our server

## What Users See in DevTools

When inspecting the iframe element, users will see:

```html
<iframe src="/api/dashboard-proxy?session=eyJ1c2VybmFtZSI6InVzZXIxIn0=">
```

**NOT this:**
```html
<iframe src="https://lookerstudio.google.com/embed/reporting/119d56c0...">
```

The Looker Studio URL is **completely hidden** from the client.

## Implementation Details

### Server-Side Functions

**File:** `/functions/api/dashboard.js`
- Stores dashboard URLs in server-side code only
- Validates session tokens
- Returns metadata about dashboard access (for access checks)
- Returns 401 Unauthorized if session is invalid
- Returns 404 if user has no dashboard assigned

**File:** `/functions/api/dashboard-proxy.js` (Main Proxy)
- Validates session tokens on every request
- Fetches actual content from Looker Studio
- Rewrites HTML to proxy all resources through our server
- Returns proxied content to client
- Handles all subsequent resource requests (CSS, JS, images, etc.)

### Client-Side Integration

**File:** `dashboard.html`

- Checks dashboard access via `/api/dashboard?session=<token>`
- Creates iframe pointing to `/api/dashboard-proxy?session=<token>`
- **Never receives or knows the actual Looker Studio URL**
- Falls back to default content if no dashboard available

### Authentication Flow

1. User logs in via `login.html`
2. Session data stored in sessionStorage
3. Session token generated (base64 encoded user data)
4. Token sent to server with dashboard requests
5. Server validates token and returns appropriate dashboard URL

## Production Considerations

### Current Implementation (Demo)

- Session tokens are simple base64 encoded JSON
- User database is hardcoded in the function
- No token expiration or refresh mechanism

### Recommended Production Improvements

1. **Use JWT tokens** instead of base64 encoding
   - Sign tokens with a secret key
   - Add expiration times
   - Include CSRF protection

2. **External authentication**
   - Integrate with OAuth providers (Google, Microsoft, etc.)
   - Use Cloudflare Access for enterprise SSO

3. **Database integration**
   - Store users in a real database (Cloudflare D1, PostgreSQL, etc.)
   - Store sessions in KV or Durable Objects
   - Implement proper session management

4. **Rate limiting**
   - Add rate limiting to prevent abuse
   - Use Cloudflare Workers Rate Limiting

5. **Audit logging**
   - Log dashboard access attempts
   - Track failed authentication attempts

## Dashboard URL Management

To add or update dashboard URLs, edit `/functions/api/dashboard.js`:

```javascript
const DASHBOARD_URLS = {
    'user1': 'https://lookerstudio.google.com/embed/reporting/...',
    'user2': 'https://lookerstudio.google.com/embed/reporting/...',
    // Add more users as needed
};
```

## Testing Locally

Cloudflare Pages Functions can be tested locally using Wrangler:

```bash
npm install -g wrangler
wrangler pages dev .
```

This will start a local development server with Functions support.

## Deployment

Cloudflare Pages automatically deploys Functions when:
- Files are placed in the `/functions` directory
- Changes are pushed to the connected Git repository

No additional configuration needed - Functions are deployed automatically with your site.

## API Endpoint

**URL:** `/api/dashboard`

**Method:** `GET`

**Query Parameters:**
- `session` (required) - Base64 encoded session token

**Response (Success - 200):**
```json
{
  "dashboardUrl": "https://lookerstudio.google.com/embed/...",
  "user": {
    "username": "user1",
    "fullName": "John Doe",
    "role": "User"
  }
}
```

**Response (Unauthorized - 401):**
```json
{
  "error": "Unauthorized"
}
```

**Response (No Dashboard - 404):**
```json
{
  "error": "No dashboard available for this user"
}
```

## Important Limitations & Warnings

### Potential Issues with Full Content Proxy

⚠️ **This approach may have limitations:**

1. **Looker Studio may block proxied requests** - Some services detect and block proxy access
2. **Terms of Service** - This may violate Looker Studio's terms of service
3. **CORS and CSP issues** - Content Security Policy headers may prevent embedding
4. **JavaScript limitations** - Complex client-side JavaScript may not work correctly through proxy
5. **Authentication challenges** - Looker Studio may require Google authentication
6. **Performance overhead** - All content goes through your server, adding latency
7. **Resource rewriting complexity** - Not all URLs may be rewritten correctly

### Testing Required

This implementation needs extensive testing to ensure:
- Looker Studio dashboards load correctly through the proxy
- All interactive features work (filters, date pickers, etc.)
- Resources (images, fonts, scripts) load properly
- No authentication errors from Google

### Alternative Recommendation

If the full content proxy doesn't work reliably, consider these alternatives:

1. **Use Looker Studio's built-in access controls**
   - Set up viewer restrictions in Looker Studio
   - Require Google account authentication
   - Share only with specific email addresses/domains

2. **Accept the URL visibility**
   - URLs will be visible in Network tab regardless
   - Focus security on Looker Studio's access controls
   - The server-side approach still prevents URL discovery

3. **Backend API integration**
   - Use Looker Studio API to fetch data
   - Build custom visualization in your app
   - Complete control over data access

## Security Notice

The full content proxy provides maximum URL hiding:

✅ **Dashboard URLs never appear in client-side code**
✅ **iframe src points to your domain, not Looker Studio**
✅ **URLs not discoverable through source code inspection**
✅ **Server-side authentication required for all requests**

However, remember:
- This approach is complex and may have compatibility issues
- Always configure Looker Studio's built-in access controls as primary security
- Test thoroughly before deploying to production
