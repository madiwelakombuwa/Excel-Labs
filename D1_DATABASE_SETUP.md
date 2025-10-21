# Cloudflare D1 Database Setup Guide

This guide will help you set up the Cloudflare D1 database for storing user details.

## Prerequisites

- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)
- Authenticated with Cloudflare (`wrangler login`)

## Database Schema

The database includes the following fields:
- `username` - Unique username for login
- `password` - User password (should be hashed in production)
- `full_name` - User's full name
- `role` - User role (Admin, User, Accounting, etc.)
- `dashboard_url` - URL to user's dashboard
- `last_login` - Timestamp of last login
- `last_logout` - Timestamp of last logout
- `html_code` - Custom HTML code for the user
- `custom_field_1` through `custom_field_10` - Additional custom fields
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `is_active` - Account status (1 = active, 0 = inactive)

## Setup Steps

### 1. Create the D1 Database

```bash
wrangler d1 create excel-labs-users
```

This will output a database ID. Copy this ID.

### 2. Update wrangler.toml

Open `wrangler.toml` and replace `placeholder-run-wrangler-d1-create` with your actual database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "excel-labs-users"
database_id = "your-actual-database-id-here"
```

### 3. Run Database Migrations

Execute the schema migration to create the users table:

```bash
wrangler d1 execute excel-labs-users --file=./migrations/0001_create_users_table.sql
```

### 4. Seed Initial Data

Load the initial users into the database:

```bash
wrangler d1 execute excel-labs-users --file=./migrations/0002_seed_users.sql
```

### 5. Bind D1 to Cloudflare Pages

Go to your Cloudflare Pages dashboard:

1. Navigate to **Settings** → **Functions** → **D1 database bindings**
2. Click **Add binding**
3. Variable name: `DB`
4. Select your database: `excel-labs-users`
5. Click **Save**

### 6. Deploy to Cloudflare Pages

Push your changes to GitHub. Cloudflare Pages will automatically deploy with D1 database access.

## Local Development

To test locally with D1:

```bash
# Run local development server with D1
wrangler pages dev . --d1=DB=excel-labs-users
```

## Database Operations

### Query Users (Local)

```bash
wrangler d1 execute excel-labs-users --command="SELECT * FROM users"
```

### Add a New User

```bash
wrangler d1 execute excel-labs-users --command="
INSERT INTO users (username, password, full_name, role, dashboard_url, is_active)
VALUES ('newuser', 'password123', 'New User', 'User', 'https://dashboard-url.com', 1)
"
```

### Update User Dashboard URL

```bash
wrangler d1 execute excel-labs-users --command="
UPDATE users
SET dashboard_url = 'https://new-dashboard-url.com'
WHERE username = 'Accounting'
"
```

### Update Custom Fields

```bash
wrangler d1 execute excel-labs-users --command="
UPDATE users
SET custom_field_1 = 'value1',
    custom_field_2 = 'value2'
WHERE username = 'admin'
"
```

### Deactivate a User

```bash
wrangler d1 execute excel-labs-users --command="
UPDATE users SET is_active = 0 WHERE username = 'olduser'
"
```

### View Last Login/Logout

```bash
wrangler d1 execute excel-labs-users --command="
SELECT username, last_login, last_logout FROM users ORDER BY last_login DESC
"
```

## Production vs Local Database

**Important:** Cloudflare D1 has separate databases for:
- **Local development** - Data stored locally for testing
- **Production** - Data stored in Cloudflare's edge network

Migrations need to be run separately for each environment:

**Local:**
```bash
wrangler d1 execute excel-labs-users --local --file=./migrations/0001_create_users_table.sql
wrangler d1 execute excel-labs-users --local --file=./migrations/0002_seed_users.sql
```

**Production:**
```bash
wrangler d1 execute excel-labs-users --file=./migrations/0001_create_users_table.sql
wrangler d1 execute excel-labs-users --file=./migrations/0002_seed_users.sql
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Password Hashing**: The current implementation stores passwords in plain text. For production, implement password hashing (bcrypt, argon2, etc.)

2. **Update auth.js**: You'll need to update the client-side authentication to also query the D1 database

3. **API Authentication**: Consider implementing JWT tokens instead of base64 session tokens

4. **Rate Limiting**: Add rate limiting to prevent brute force attacks

## Custom Fields Usage Examples

The 10 custom fields can be used for various purposes:

- `custom_field_1`: Department
- `custom_field_2`: Employee ID
- `custom_field_3`: Phone Number
- `custom_field_4`: Email
- `custom_field_5`: Access Level
- `custom_field_6`: Region
- `custom_field_7`: Manager Name
- `custom_field_8`: Cost Center
- `custom_field_9`: Start Date
- `custom_field_10`: Notes

## Troubleshooting

### Error: "Database not configured"
- Ensure D1 binding is set up in Cloudflare Pages settings
- Verify the binding variable name is `DB`

### Error: "Table doesn't exist"
- Run the migration: `wrangler d1 execute excel-labs-users --file=./migrations/0001_create_users_table.sql`

### Changes not reflecting
- For local dev: Restart the wrangler dev server
- For production: Ensure changes are pushed to GitHub and deployed

## Next Steps

After setup, you may want to:

1. Create an admin panel to manage users via UI
2. Implement password hashing
3. Add API endpoints for CRUD operations on users
4. Create user registration functionality
5. Add audit logging for user activities
