// Dummy users for authentication
const dummyUsers = [
    {
        username: 'admin',
        password: 'admin123',
        fullName: 'Administrator',
        role: 'Admin'
    },
    {
        username: 'user1',
        password: 'password1',
        fullName: 'John Doe',
        role: 'User'
    },
    {
        username: 'user2',
        password: 'password2',
        fullName: 'Jane Smith',
        role: 'User'
    },
    {
        username: 'marketing',
        password: 'marketing123',
        fullName: 'Marketing Manager',
        role: 'Marketing'
    },
    {
        username: 'Accounting',
        password: 'password123',
        fullName: 'Accounting Manager',
        role: 'Accounting'
    }
];

// Check if user is already logged in
function checkAuth() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (loggedInUser && window.location.pathname.includes('login.html')) {
        window.location.href = 'dashboard.html';
    }
    return loggedInUser;
}

// Authenticate user
function authenticateUser(username, password) {
    const user = dummyUsers.find(
        u => u.username === username && u.password === password
    );

    if (user) {
        // Store user info (excluding password) in session storage
        const userInfo = {
            username: user.username,
            fullName: user.fullName,
            role: user.role
        };
        sessionStorage.setItem('loggedInUser', JSON.stringify(userInfo));
        return { success: true, user: userInfo };
    }

    return { success: false, message: 'Invalid username or password' };
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
