# Server-Side Proxy Setup for Dashboard URLs

## Overview

This application uses **Cloudflare Pages Functions** to implement a server-side proxy that keeps Looker Studio dashboard URLs secure and hidden from client-side code.

## How It Works

### Architecture

```
Client (Browser)
    ↓
    ↓ [Requests dashboard with session token]
    ↓
Server-Side Function (/functions/api/dashboard.js)
    ↓
    ↓ [Validates session]
    ↓ [Returns dashboard URL only if authorized]
    ↓
Client receives URL and loads iframe
    ↓
Looker Studio Dashboard
```

### Security Benefits

1. **Dashboard URLs are stored server-side only** - Never exposed in client-side code
2. **Authentication validation on server** - Cannot be bypassed by client manipulation
3. **No URL in browser DevTools** - URLs are not visible in the HTML source or JavaScript
4. **Session-based access control** - Only authenticated users receive dashboard URLs

## Implementation Details

### Server-Side Function

**File:** `/functions/api/dashboard.js`

- Stores dashboard URLs in server-side code only
- Validates session tokens before returning URLs
- Returns 401 Unauthorized if session is invalid
- Returns 404 if user has no dashboard assigned

### Client-Side Integration

**File:** `dashboard.html`

- Calls `/api/dashboard?session=<token>` endpoint
- Receives dashboard URL from server response
- Creates iframe dynamically with the returned URL
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

## Security Notice

While this implementation significantly improves security by hiding URLs from client-side code:

- Users can still see the URL once the iframe loads (in Network tab)
- The dashboard URL is visible in browser network requests
- For complete security, also configure Looker Studio's built-in access controls
- Consider implementing IP allowlisting or additional authentication layers

The primary benefit is that dashboard URLs are not discoverable without proper authentication.
