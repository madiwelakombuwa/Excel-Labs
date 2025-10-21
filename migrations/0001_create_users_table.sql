-- Create users table with all requested fields
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT,
    role TEXT,
    dashboard_url TEXT,
    last_login DATETIME,
    last_logout DATETIME,
    html_code TEXT,
    custom_field_1 TEXT,
    custom_field_2 TEXT,
    custom_field_3 TEXT,
    custom_field_4 TEXT,
    custom_field_5 TEXT,
    custom_field_6 TEXT,
    custom_field_7 TEXT,
    custom_field_8 TEXT,
    custom_field_9 TEXT,
    custom_field_10 TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_username ON users(username);

-- Create index on is_active for filtering active users
CREATE INDEX IF NOT EXISTS idx_is_active ON users(is_active);
