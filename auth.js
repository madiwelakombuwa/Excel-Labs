// Authentication now uses D1 database via /api/login endpoint
// All users are stored in the Cloudflare D1 database

// Check if user is already logged in
function checkAuth() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (loggedInUser && window.location.pathname.includes('login.html')) {
        window.location.href = 'dashboard.html';
    }
    return loggedInUser;
}

// Authenticate user against D1 database
async function authenticateUser(username, password) {
    try {
        // Call login API
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success && data.user) {
            // Store user info (excluding password) in session storage
            const userInfo = {
                username: data.user.username,
                fullName: data.user.fullName,
                role: data.user.role
            };
            sessionStorage.setItem('loggedInUser', JSON.stringify(userInfo));
            return { success: true, user: userInfo };
        } else {
            return { success: false, message: data.message || 'Invalid username or password' };
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return { success: false, message: 'Authentication failed. Please try again.' };
    }
}

// Logout user
function logout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}

// Get current user
function getCurrentUser() {
    const userJson = sessionStorage.getItem('loggedInUser');
    return userJson ? JSON.parse(userJson) : null;
}

// Get session token for server-side validation
function getSessionToken() {
    const userJson = sessionStorage.getItem('loggedInUser');
    if (!userJson) return null;

    // Create a base64 encoded session token
    // In production, this would be a signed JWT
    return btoa(userJson);
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    if (loginForm) {
        // Check if already logged in
        checkAuth();

        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            // Clear previous error
            errorMessage.classList.remove('show');
            errorMessage.textContent = '';

            // Authenticate
            const result = authenticateUser(username, password);

            if (result.success) {
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                // Show error message
                errorMessage.textContent = result.message;
                errorMessage.classList.add('show');

                // Clear password field
                document.getElementById('password').value = '';
            }
        });
    }
});
