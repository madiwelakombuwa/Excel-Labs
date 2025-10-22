// Cloudflare Pages Function - User Management API (Admin Only)
// CRUD operations for managing users in D1 database

import { updateGoogleSheet } from '../lib/google-sheets.js';

// Validate session and check if user is admin
async function validateAdminSession(sessionToken, db) {
    if (!sessionToken) return null;

    try {
        const decoded = atob(sessionToken);
        const userData = JSON.parse(decoded);

        // Verify user exists and is admin
        const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1');
        const user = await stmt.bind(userData.username).first();

        if (user && user.role === 'Admin') {
            return user;
        }
    } catch (e) {
        console.error('Session validation error:', e);
        return null;
    }

    return null;
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

    // Get session token from query parameter or header
    const url = new URL(request.url);
    const sessionToken = url.searchParams.get('session') || request.headers.get('X-Session-Token');

    // Validate admin session
    const admin = await validateAdminSession(sessionToken, env.DB);

    if (!admin) {
        return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const method = request.method;
    const action = url.searchParams.get('action');

    try {
        if (method === 'GET' && action === 'list') {
            // List all users
            const users = await env.DB.prepare(
                'SELECT id, username, full_name, role, dashboard_url, last_login, last_logout, is_active, created_at FROM users ORDER BY created_at DESC'
            ).all();

            return new Response(JSON.stringify({
                success: true,
                users: users.results
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (method === 'GET' && action === 'get') {
            // Get single user
            const username = url.searchParams.get('username');

            const user = await env.DB.prepare(
                'SELECT * FROM users WHERE username = ?'
            ).bind(username).first();

            if (!user) {
                return new Response(JSON.stringify({ error: 'User not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({
                success: true,
                user: user
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (method === 'POST' && action === 'add') {
            // Add new user
            const data = await request.json();

            const stmt = env.DB.prepare(
                'INSERT INTO users (username, password, full_name, role, dashboard_url, is_active) VALUES (?, ?, ?, ?, ?, ?)'
            );

            await stmt.bind(
                data.username,
                data.password,
                data.full_name || data.username,
                data.role || 'User',
                data.dashboard_url || null,
                data.is_active !== undefined ? data.is_active : 1
            ).run();

            // Update Google Sheet with new username
            await updateGoogleSheet(data.username, env);

            return new Response(JSON.stringify({
                success: true,
                message: 'User created successfully',
                username: data.username
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (method === 'PUT' && action === 'update') {
            // Update user
            const data = await request.json();
            const username = url.searchParams.get('username');

            let updateFields = [];
            let values = [];

            if (data.password !== undefined) {
                updateFields.push('password = ?');
                values.push(data.password);
            }
            if (data.full_name !== undefined) {
                updateFields.push('full_name = ?');
                values.push(data.full_name);
            }
            if (data.role !== undefined) {
                updateFields.push('role = ?');
                values.push(data.role);
            }
            if (data.dashboard_url !== undefined) {
                updateFields.push('dashboard_url = ?');
                values.push(data.dashboard_url);
            }
            if (data.is_active !== undefined) {
                updateFields.push('is_active = ?');
                values.push(data.is_active);
            }

            if (updateFields.length === 0) {
                return new Response(JSON.stringify({ error: 'No fields to update' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(username);

            const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE username = ?`;
            await env.DB.prepare(sql).bind(...values).run();

            return new Response(JSON.stringify({
                success: true,
                message: 'User updated successfully',
                username: username
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (method === 'DELETE' && action === 'delete') {
            // Delete user (soft delete by setting is_active = 0)
            const username = url.searchParams.get('username');

            // Don't allow admin to delete themselves
            if (username === admin.username) {
                return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            await env.DB.prepare(
                'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE username = ?'
            ).bind(username).run();

            return new Response(JSON.stringify({
                success: true,
                message: 'User deactivated successfully',
                username: username
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('User management error:', error);
        return new Response(JSON.stringify({
            error: 'Operation failed',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
