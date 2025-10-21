# Server-Side Dashboard URL Protection

## Overview

This application uses **Cloudflare Pages Functions** to protect Looker Studio dashboard URLs by storing them server-side and requiring authentication to access them.

## ⚠️ Important: Why We Don't Use Full Content Proxy

We initially tried to implement a full content proxy to completely hide URLs from the iframe src attribute. **This doesn't work** because:

1. **Looker Studio blocks proxied requests** - Google services detect and prevent proxy access
2. **Terms of Service violations** - Proxying Google services likely violates their ToS
3. **Technical complexity** - CORS, CSP, and JavaScript limitations make it unreliable
4. **Not necessary** - URL visibility in iframe src is **normal and acceptable** if you use Looker Studio's access controls

## Current Implementation: Server-Side URL Storage

This is the **practical, working solution** that balances security with functionality.

## How It Works

### Architecture

```
Client (Browser)
    ↓
    ↓ [1. Requests: /api/dashboard?session=token]
    ↓
Server-Side Function (/functions/api/dashboard.js)
    ↓
    ↓ [2. Validates session token]
    ↓ [3. Returns dashboard URL if authorized]
    ↓
Client receives dashboard URL
    ↓
    ↓ [4. Creates iframe with URL]
    ↓
Looker Studio Dashboard loads in iframe
```

### What This Achieves

✅ **Dashboard URLs stored server-side only** - Not in HTML/JavaScript source code
✅ **Authentication required** - Must be logged in to get the URL
✅ **Server-side validation** - Cannot be bypassed by client manipulation
✅ **Actually works** - Looker Studio dashboards load correctly

### What This Doesn't Hide

❌ **URL is visible in iframe src** - Once loaded, the URL appears in the DOM
❌ **URL is visible in Network tab** - Browser shows the request to Looker Studio

**This is normal and acceptable!** Most web applications work this way. The important security is in **Looker Studio's access controls**.

## What Users See in DevTools

When inspecting the iframe element, users will see:

```html
<iframe src="https://lookerstudio.google.com/embed/reporting/119d56c0-7d73-4bb0-8fb9-d67a5a41361c/page/ecoJD">
```

**However:**
- They cannot discover this URL without logging in first
- The URL is not in your HTML/JavaScript source code
- Looker Studio's access controls still protect the dashboard data

## Implementation Details

### Server-Side Functions

**File:** `/functions/api/dashboard.js`
- Stores dashboard URLs in server-side code only (never exposed to client)
- Validates session tokens before returning any data
- Returns dashboard URL only to authenticated users
- Returns 401 Unauthorized if session is invalid
- Returns 404 if user has no dashboard assigned

**File:** `/functions/api/dashboard-proxy.js` (Not Used - Kept for Reference)
- This was an attempt at full content proxying
- **Not used in the current implementation**
- Looker Studio blocks this approach
- Kept in codebase as documentation of what doesn't work

### Client-Side Integration

**File:** `dashboard.html`

- Calls `/api/dashboard?session=<token>` endpoint
- Receives dashboard URL from server (requires authentication)
- Creates iframe with the returned URL
- Looker Studio dashboard loads directly in iframe
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

## Security Recommendations

### Primary Security: Looker Studio Access Controls

**The most important security is configuring Looker Studio properly:**

1. **Set viewer restrictions** in Looker Studio settings
2. **Require viewer authentication** - Force users to log in with Google
3. **Whitelist specific domains** - Only allow embedding on your domain
4. **Share with specific emails** - Limit access to authorized Google accounts
5. **Set expiration dates** - For time-limited access

### This Application Provides

✅ **Login required** - Users must authenticate to see the dashboard
✅ **URLs not in source code** - Cannot be found by viewing HTML/JS files
✅ **Server-side URL storage** - Stored securely in Cloudflare Functions
✅ **Session validation** - Only authenticated users receive URLs
✅ **Per-user dashboards** - Different users see different dashboards

### What to Expect

**Normal behavior:**
- After login, dashboard loads correctly
- URL is visible in iframe src attribute when inspecting DOM
- URL is visible in browser Network tab
- Dashboard is fully functional with all features working

**This is standard for web applications** - the URL visibility is not a security vulnerability when combined with Looker Studio's access controls.

### Understanding the Security Model

Think of it like a house:
- **Your app's login** = The gate to your property (prevents random people from knowing the address)
- **Looker Studio's access controls** = The lock on your door (prevents unauthorized access even if they know the address)

Both layers work together to provide security.

## Recommended Looker Studio Settings

To maximize security, configure these settings in Looker Studio:

1. Go to Share → Manage access
2. Enable "Restrict who can view this report"
3. Set "Viewers need to authenticate with Google"
4. Add only authorized email addresses
5. Under Embed settings, restrict to your domain only
