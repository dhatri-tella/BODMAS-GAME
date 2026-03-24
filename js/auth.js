/**
 * Auth Manager
 * Handles user sessions, progress tracking, and persistence.
 */

const Auth = (() => {
    const STORAGE_KEY = 'mathmaster_users';
    const SESSION_KEY = 'mathmaster_current_user';

    let currentUser = null;

    // Initialize Auth
    function init() {
        // Pre-fill mock user for testing if empty
        const users = getUsers();
        if (Object.keys(users).length === 0) {
            users['admin'] = {
                username: 'admin',
                password: '1234',
                stats: {
                    stars: 5,
                    levelsUnlocked: 3,
                    totalScore: 500,
                    lastPlayed: new Date().toISOString()
                }
            };
            saveUsers(users);
        }

        const storedUser = localStorage.getItem(SESSION_KEY);
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            return currentUser;
        }
        return null;
    }

    // Get all users
    function getUsers() {
        const users = localStorage.getItem(STORAGE_KEY);
        return users ? JSON.parse(users) : {};
    }

    // Save users
    function saveUsers(users) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }

    // Sign Up
    function signup(username, password) {
        const users = getUsers();
        if (users[username]) {
            throw new Error('Username already exists!');
        }

        const newUser = {
            username,
            password, // In a real app, this would be hashed
            stats: {
                stars: 0,
                levelsUnlocked: 1,
                totalScore: 0,
                lastPlayed: new RegExp().toString()
            }
        };

        users[username] = newUser;
        saveUsers(users);
        return login(username, password);
    }

    // Login
    function login(username, password) {
        const users = getUsers();
        const user = users[username];

        if (!user || user.password !== password) {
            throw new Error('Invalid username or password');
        }

        currentUser = {
            username: user.username,
            stats: user.stats
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
        return currentUser;
    }

    // Logout
    function logout() {
        currentUser = null;
        localStorage.removeItem(SESSION_KEY);
    }

    // Update Progress
    function updateProgress(starsToAdd, scoreToAdd, levelReached) {
        if (!currentUser) return;

        const users = getUsers();
        const user = users[currentUser.username];

        if (user) {
            user.stats.stars += starsToAdd;
            user.stats.totalScore += scoreToAdd;
            if (levelReached > user.stats.levelsUnlocked) {
                user.stats.levelsUnlocked = levelReached;
            }
            user.stats.lastPlayed = new Date().toISOString();

            // Persist
            users[currentUser.username] = user;
            saveUsers(users);

            // Update session
            currentUser.stats = user.stats;
            localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
        }
    }

    function getCurrentUser() {
        return currentUser;
    }

    return {
        init, signup, login, logout, updateProgress, getCurrentUser
    };
})();
