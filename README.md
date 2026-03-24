# MathMaster - BODMAS Adventure 🎓

A highly interactive, visually engaging educational game designed to teach the **BODMAS** (Order of Operations) rules to students aged 8–14.

![Game Screen Mockup](assets/badge.png)

## 🌟 Features

- **Step-by-Step Solving**: Learn math by solving expressions one operation at a time.
- **Modern UI/UX**: Colorful, mobile-game inspired design with smooth animations.
- **BODMAS Color Coding**: Highlighting operations to match the rules:
    - 🔵 **Brackets**
    - 🟣 **Orders** (Powers)
    - 🟠 **Division**
    - 🟡 **Multiplication**
    - 🟢 **Addition**
    - 🔴 **Subtraction**
- **Two Game Modes**:
    - **Discovery (Learning)**: Interactive hints and guided step-by-step assistance.
    - **Elite (Challenge)**: Test your skills without hints and compete for the leaderboard!
- **Feedback & Micro-interactions**: Smooth green animations for correct steps, shake animations for mistakes, and responsive sound effects.
- **Leaderboard**: Compete with others and see your name in the hall of fame (powered by PHP/JSON).
- **Responsive Design**: Play on Desktop, Tablet, or Mobile.

## 🚀 Getting Started

### Prerequisites
- A local web server with PHP support (like XAMPP, WAMP, or MAMP) if you want the leaderboard to work.
- Any modern web browser.

### Installation
1. Clone or download this project to your web server's root directory.
2. Ensure the `api/scores.json` file has write permissions for the PHP process.
3. Open the project URL (e.g., `http://localhost/bodmas-game/`) in your browser.

## 🛠️ Technology Stack
- **Frontend**: HTML5, Vanilla CSS3 (Modern design tokens), Vanilla JavaScript (ES6+).
- **Backend**: PHP (Minimal implementation for score persistence).
- **Sound**: Web Audio API.

## 📁 Project Structure
- `index.html`: Main game structure and screens.
- `css/style.css`: Core design system, tokens, and animations.
- `js/engine.js`: The BODMAS logic, expression generator, and solver.
- `js/ui.js`: UI management, state rendering, and sound system.
- `js/game.js`: Game loop, state management, and event handling.
- `api/leaderboard.php`: Simple API to fetch and save scores.

## 📜 Educational Goal
The game aims to transform a "boring" math topic into a fun puzzle experience. By requiring students to select the *correct* operator first, it reinforces the concept of precedence before they even start the calculation.

---
Built with ❤️ for young learners.
