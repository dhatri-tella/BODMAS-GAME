/**
 * UI Manager
 * Handles DOM manipulation, rendering, sound, and animations.
 */

const UI = (() => {
    // DOM Elements
    const elements = {
        app: document.getElementById('app'),
        screens: document.querySelectorAll('.screen'),
        expressionContainer: document.getElementById('expression-container'),
        progressBar: document.getElementById('game-progress-bar'),
        scoreDisplay: document.getElementById('current-score'),
        starsDisplay: document.getElementById('user-stars').querySelector('span'),
        themeToggle: document.getElementById('toggle-theme'),
        soundToggle: document.getElementById('toggle-sound'),
        solveModal: document.getElementById('solve-modal'),
        solveTitle: document.getElementById('solve-title'),
        solveInput: document.getElementById('solve-input'),
        solveSubmit: document.getElementById('solve-submit'),
        solveError: document.getElementById('solve-error'),
        hintDisplay: document.getElementById('game-hint'),
        
        // Auth elements
        authCard: document.querySelector('.auth-card'),
        authTabs: document.querySelectorAll('.auth-tab'),
        authForms: document.querySelectorAll('.auth-form'),
        authError: document.getElementById('auth-error'),
        loginSubmitBtn: document.getElementById('btn-login-submit'),
        signupSubmitBtn: document.getElementById('btn-signup-submit'),
        userProfileWidget: document.getElementById('user-profile-widget'),
        displayUsername: document.getElementById('display-username'),
        logoutBtn: document.getElementById('btn-logout')
    };

    let soundEnabled = true;

    // Initialize UI
    function init(onAuthAction) {
        elements.themeToggle.addEventListener('click', toggleTheme);
        if (elements.soundToggle) elements.soundToggle.addEventListener('click', toggleSound);

        // Auth Tabs logic
        elements.authTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target.dataset.tab;
                
                // Toggle tabs
                elements.authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Toggle forms
                elements.authForms.forEach(form => {
                    form.classList.remove('active');
                    if (form.id === `auth-${target}-form`) form.classList.add('active');
                });
                
                elements.authError.textContent = '';
            });
        });

        // Pre-fill fields for demo purposes
        document.getElementById('login-username').value = 'admin';
        document.getElementById('login-password').value = '1234';

        // Form Submissions
        elements.loginSubmitBtn.addEventListener('click', () => {
            const user = document.getElementById('login-username').value.trim();
            const pass = document.getElementById('login-password').value.trim();
            if (!user || !pass) {
                showAuthError("Please fill in all fields.");
                return;
            }
            onAuthAction('login', { user, pass });
        });

        elements.signupSubmitBtn.addEventListener('click', () => {
            const user = document.getElementById('signup-username').value.trim();
            const pass = document.getElementById('signup-password').value.trim();
            if (!user || user.length < 3) {
                showAuthError("Username must be at least 3 characters.");
                return;
            }
            if (!pass || pass.length < 4) {
                showAuthError("Password must be at least 4 characters.");
                return;
            }
            onAuthAction('signup', { user, pass });
        });

        elements.logoutBtn.addEventListener('click', () => onAuthAction('logout'));
    }

    function showAuthError(msg) {
        elements.authError.textContent = msg;
        elements.authCard.classList.add('shake');
        setTimeout(() => elements.authCard.classList.remove('shake'), 500);
        playSound('error');
    }

    function updateUserInfo(userData) {
        if (userData) {
            elements.userProfileWidget.style.display = 'flex';
            elements.displayUsername.textContent = userData.username;
            elements.starsDisplay.textContent = userData.stats.stars || 0;
            elements.userProfileWidget.classList.add('token-enter');
        } else {
            elements.userProfileWidget.style.display = 'none';
        }
    }

    // Screen Management
    function showScreen(screenId) {
        elements.screens.forEach(screen => {
            screen.classList.remove('active');
            if (screen.id === screenId) screen.classList.add('active');
        });
    }

    // Render Expression
    function renderExpression(tokens, onTokenClick) {
        elements.expressionContainer.innerHTML = '';
        
        tokens.forEach((token, index) => {
            const tokenEl = document.createElement('div');
            tokenEl.className = `expression-token ${token.type} ${token.class || ''}`;
            tokenEl.dataset.index = index;
            tokenEl.dataset.id = token.id;
            tokenEl.textContent = token.value;

            if (token.type === 'operator' || token.type === 'bracket') {
                tokenEl.style.cursor = 'pointer';
                tokenEl.addEventListener('click', () => onTokenClick(index));
            }

            elements.expressionContainer.appendChild(tokenEl);
        });
    }

    // Modal Interaction
    function openSolveModal(title, onSubmit) {
        elements.solveTitle.textContent = title;
        elements.solveInput.value = '';
        elements.solveError.textContent = '';
        elements.solveModal.classList.add('active');
        elements.solveInput.focus();

        const handleSubmit = () => {
            const val = elements.solveInput.value;
            if (val === '') return;
            onSubmit(val);
        };

        const handleEnter = (e) => {
            if (e.key === 'Enter') handleSubmit();
        };

        elements.solveSubmit.onclick = handleSubmit;
        elements.solveInput.onkeydown = handleEnter;
    }

    function closeSolveModal() {
        elements.solveModal.classList.remove('active');
    }

    function showError(msg) {
        elements.solveError.textContent = msg;
        elements.solveModal.classList.add('shake');
        setTimeout(() => elements.solveModal.classList.remove('shake'), 500);
        playSound('error');
    }

    // feedback & state
    function updateProgress(current, total) {
        const percent = (current / total) * 100;
        elements.progressBar.style.width = `${percent}%`;
    }

    function updateScore(score) {
        elements.scoreDisplay.textContent = score.toString().padStart(3, '0');
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        elements.themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        elements.soundToggle.innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
    }

    // Hint management
    function showHint(msg) {
        elements.hintDisplay.innerHTML = msg;
        elements.hintDisplay.classList.add('animate');
    }

    function highlightTokens(indices) {
        const tokens = elements.expressionContainer.querySelectorAll('.expression-token');
        indices.forEach(idx => {
            if (tokens[idx]) tokens[idx].classList.add('hint-highlight');
        });

        setTimeout(() => {
            indices.forEach(idx => {
                if (tokens[idx]) tokens[idx].classList.remove('hint-highlight');
            });
        }, 2000);
    }

    // Sound effects using Web Audio API
    function playSound(type) {
        if (!soundEnabled) return;
        
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'click') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.05);
            }
        } catch(e) { /* Audio context might be blocked */ }
    }

    function renderLeaderboard(scores) {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';
        if (scores.length === 0) {
            list.innerHTML = '<div class="loading">No scores yet. Be the first!</div>';
            return;
        }
        scores.forEach((entry, i) => {
            const item = document.createElement('div');
            item.className = 'leader-item';
            item.innerHTML = `
                <span>${i+1}. <span class="leader-name">${entry.name}</span></span>
                <span class="leader-score">${entry.score} pts</span>
            `;
            list.appendChild(item);
        });
    }
    
    return {
        init, showScreen, renderExpression, openSolveModal, closeSolveModal, showError, 
        updateProgress, updateScore, showHint, highlightTokens, playSound, renderLeaderboard,
        updateUserInfo, showAuthError
    };
})();
