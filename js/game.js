/**
 * Main Game Controller
 * Manages game state, logic flow, and events.
 */

const Game = (() => {
    // Game State
    let state = {
        levelIndex: 1,
        score: 0,
        stars: 0,
        totalLevels: 5,
        currentTokens: [],
        currentNextStep: null,
        mode: 'learning', // 'learning' or 'challenge'
        levelCompleted: 0
    };

    // Initialize Game
    function init() {
        Auth.init();
        UI.init(handleAuthAction);
        setupEventListeners();

        const user = Auth.getCurrentUser();
        if (user) {
            UI.updateUserInfo(user);
            UI.showScreen('screen-home');
        } else {
            UI.showScreen('screen-auth');
        }
    }

    function handleAuthAction(action, data) {
        try {
            let user;
            if (action === 'login') {
                user = Auth.login(data.user, data.pass);
            } else if (action === 'signup') {
                user = Auth.signup(data.user, data.pass);
            } else if (action === 'logout') {
                Auth.logout();
                UI.updateUserInfo(null);
                UI.showScreen('screen-auth');
                return;
            }

            if (user) {
                UI.updateUserInfo(user);
                UI.showScreen('screen-home');
                UI.playSound('success');
            }
        } catch (error) {
            UI.showAuthError(error.message);
        }
    }

    function setupEventListeners() {
        // Mode Selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active', 'btn-primary'));
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.add('btn-secondary'));
                target.classList.add('active', 'btn-primary');
                target.classList.remove('btn-secondary');
                state.mode = target.dataset.mode;
                UI.playSound('click');
            });
        });

        // Navigation
        document.getElementById('btn-play').addEventListener('click', startNewGame);
        document.getElementById('btn-leaderboard').addEventListener('click', showLeaderboard);
        document.getElementById('btn-quit').addEventListener('click', () => UI.showScreen('screen-home'));
        document.getElementById('btn-restart').addEventListener('click', startNewGame);
        document.getElementById('btn-home-from-result').addEventListener('click', () => UI.showScreen('screen-home'));
        document.getElementById('btn-home-from-leaderboard').addEventListener('click', () => UI.showScreen('screen-home'));
        document.getElementById('btn-show-hint').addEventListener('click', showHintTrigger);
    }

    function showLeaderboard() {
        UI.showScreen('screen-leaderboard');
        fetch('api/leaderboard.php')
            .then(res => res.json())
            .then(data => UI.renderLeaderboard(data))
            .catch(() => {
                // FALLBACK: Use local storage if no server/PHP
                console.log("PHP backend not reached. Using localStorage fallback.");
                const localScores = JSON.parse(localStorage.getItem('bodmas_scores') || '[]');
                UI.renderLeaderboard(localScores);
            });
    }

    function submitScore(name, score) {
        const user = Auth.getCurrentUser();
        const finalName = user ? user.username : name;
        const payload = { name: finalName, score, date: new Date().toISOString() };
        
        // Try PHP first
        fetch('api/leaderboard.php', {
            method: 'POST',
            body: JSON.stringify(payload)
        }).catch(() => {
            // FALLBACK: Store locally
            const localScores = JSON.parse(localStorage.getItem('bodmas_scores') || '[]');
            localScores.push(payload);
            localScores.sort((a,b) => b.score - a.score);
            localStorage.setItem('bodmas_scores', JSON.stringify(localScores.slice(0, 10)));
        });
    }

    function startNewGame() {
        state.levelIndex = 1;
        state.score = 0;
        state.levelCompleted = 0;
        UI.updateScore(state.score);
        loadLevel();
        UI.showScreen('screen-game');
    }

    function loadLevel() {
        const levelData = Engine.generateLevel(state.levelIndex);
        state.currentTokens = levelData.tokens;
        state.levelCompleted = 0;
        
        document.getElementById('label-level').textContent = `Level ${state.levelIndex}: ${getLevelName(state.levelIndex)}`;
        document.getElementById('label-progress').textContent = `${state.levelIndex}/${state.totalLevels}`;
        UI.updateProgress(state.levelIndex - 1, state.totalLevels);
        
        renderCurrentExpression();
        analyzeNextStep();
    }

    function getLevelName(level) {
        if (level < 3) return "Basic Ops";
        if (level < 6) return "Multiplication & Division";
        if (level < 9) return "Brackets Mastery";
        return "The Ultimate Test";
    }

    function renderCurrentExpression() {
        UI.renderExpression(state.currentTokens, onOperatorClicked);
    }

    function analyzeNextStep() {
        state.currentNextStep = Engine.findNextStep(state.currentTokens);
        
        if (!state.currentNextStep) {
            // Expression fully solved
            finishLevel();
        } else {
            // Provide initial guidance
            UI.showHint("Select an operation to solve!");
        }
    }

    function onOperatorClicked(index) {
        UI.playSound('click');
        
        const step = state.currentNextStep;
        
        if (step.type === 'operator' && step.operatorIndex === index) {
            promptForSolve(step);
        } 
        else if (step.type === 'bracket_cleanup' && (index === step.startIndex || index === step.endIndex)) {
            // Just perform the cleanup immediately or confirm
            const result = Engine.solveStep(state.currentTokens, step, null);
            UI.playSound('success');
            state.currentTokens = result.tokens;
            renderCurrentExpression();
            analyzeNextStep();
        }
        else {
            // Wrong step!
            UI.playSound('error');
            
            if (state.mode === 'learning') {
                const correctHint = Engine.getHint(state.currentTokens, step);
                UI.showHint(`<span class='shake'>Wrong step!</span> ${correctHint}`);
                UI.highlightTokens([step.operatorIndex, step.leftOperandIndex, step.rightOperandIndex].filter(i => i !== undefined));
            } else {
                UI.showHint("<span class='shake'>Mistake!</span> Look closely at the precedence.");
                // Penalize score in challenge mode
                state.score = Math.max(0, state.score - 5);
                UI.updateScore(state.score);
            }
        }
    }

    function promptForSolve(step) {
        const left = state.currentTokens[step.leftOperandIndex].value;
        const op = state.currentTokens[step.operatorIndex].value;
        const right = state.currentTokens[step.rightOperandIndex].value;
        
        const title = `What is ${left} ${op} ${right}?`;
        
        UI.openSolveModal(title, (userInput) => {
            const result = Engine.solveStep(state.currentTokens, step, userInput);
            
            if (result.success) {
                // Correct calculation!
                UI.playSound('success');
                state.score += 10;
                UI.updateScore(state.score);
                UI.closeSolveModal();
                state.currentTokens = result.tokens;
                renderCurrentExpression();
                analyzeNextStep();
            } else {
                // Calculation error
                UI.showError(result.msg);
            }
        });
    }

    function showHintTrigger() {
        if (state.mode === 'challenge') {
            UI.showHint("No hints in Challenge Mode!");
            return;
        }
        const step = state.currentNextStep;
        if (step) {
            UI.showHint(Engine.getHint(state.currentTokens, step));
            UI.highlightTokens([step.operatorIndex, step.leftOperandIndex, step.rightOperandIndex].filter(i => i !== undefined));
        }
    }

    function finishLevel() {
        if (state.levelIndex >= state.totalLevels) {
            showFinalResults();
        } else {
            // Auto progression? No, show success then next level
            state.levelIndex++;
            loadLevel();
        }
    }

    function showFinalResults() {
        document.getElementById('final-score').textContent = state.score;
        // Calculate stars based on score vs max possible
        const maxScore = state.totalLevels * 50; 
        const stars = Math.min(3, Math.ceil((state.score / maxScore) * 3));
        
        const starsEl = document.getElementById('final-stars');
        starsEl.innerHTML = '';
        for (let i = 1; i <= 3; i++) {
            starsEl.innerHTML += i <= stars ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
        }
        
        UI.showScreen('screen-result');

        // Update Auth stats
        Auth.updateProgress(stars, state.score, state.levelIndex);
        
        // Update UI info
        UI.updateUserInfo(Auth.getCurrentUser());

        // Optional name submission to leaderboard
        setTimeout(() => {
            submitScore(null, state.score);
        }, 1000);
    }

    function nextLevel() {
        if (state.levelIndex > state.totalLevels) {
            // Reset to 1 or higher levels?
            state.levelIndex = 1;
            state.score = 0;
            startNewGame();
        } else {
            loadLevel();
            UI.showScreen('screen-game');
        }
    }

    return { init };
})();

// Start everything when DOM loaded
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
