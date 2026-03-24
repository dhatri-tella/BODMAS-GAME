/**
 * BODMAS Engine
 * Handles expression parsing, solving logic, and generation.
 */

const Engine = (() => {
    // Operation Precedence (BODMAS)
    // Brackets > Orders > Division/Multiplication > Addition/Subtraction
    // Left-to-right for same precedence
    const PRECEDENCE = {
        '(': 0,
        ')': 0,
        '^': 1, // Orders
        '/': 2, // Division
        '*': 2, // Multiplication
        '+': 3, // Addition
        '-': 3  // Subtraction
    };

    const DIV_OP = '÷';
    const MUL_OP = '×';
    const SUB_OP = '-';
    const ADD_OP = '+';

    /**
     * Expression structure: Array of tokens
     * Token: { type: 'number'|'operator'|'bracket', value: string, id: unique_id, class: string }
     */

    /**
     * Generate an expression for a specific level
     * @param {number} levelIndex 
     */
    function generateLevel(levelIndex) {
        // Difficulty scaling
        let expressionTokens = [];
        let scoreReward = 100 + (levelIndex * 50);

        if (levelIndex === 1) {
            // Level 1: Very basic addition
            const n1 = Math.floor(Math.random() * 10) + 1;
            const n2 = Math.floor(Math.random() * 10) + 1;
            expressionTokens = createBasicExpression([n1, ADD_OP, n2]);
        }
        else if (levelIndex === 2) {
            // Level 2: Multiple +/-
            const n1 = Math.floor(Math.random() * 20) + 10;
            const n2 = Math.floor(Math.random() * 10) + 1;
            const n3 = Math.floor(Math.random() * 5) + 1;
            expressionTokens = createBasicExpression([n1, SUB_OP, n2, ADD_OP, n3]);
        } 
        else if (levelIndex === 3) {
            // Level 3: Simple Multipication
            const n1 = Math.floor(Math.random() * 10) + 2;
            const n2 = Math.floor(Math.random() * 5) + 2;
            const n3 = Math.floor(Math.random() * 10) + 1;
            expressionTokens = createBasicExpression([n1, MUL_OP, n2, SUB_OP, n3]);
        }
        else if (levelIndex === 4) {
            // Level 4: Multiplication priority
            const n1 = Math.floor(Math.random() * 10) + 1;
            const n2 = Math.floor(Math.random() * 5) + 2;
            const n3 = Math.floor(Math.random() * 5) + 2;
            // n1 + n2 * n3
            expressionTokens = createBasicExpression([n1, ADD_OP, n2, MUL_OP, n3]);
        }
        else if (levelIndex === 5) {
            // Level 5: Division priority
            const d = Math.floor(Math.random() * 5) + 2;
            const n2 = Math.floor(Math.random() * 5) + 2;
            const n1 = n2 * d; // guaranteed integer result
            const n3 = Math.floor(Math.random() * 10) + 1;
            // n3 - n1 / n2
            expressionTokens = createBasicExpression([n3, SUB_OP, n1, DIV_OP, n2]);
        }
        else if (levelIndex === 6) {
            // Level 6: Basic Brackets
            const n1 = Math.floor(Math.random() * 5) + 1;
            const n2 = Math.floor(Math.random() * 5) + 1;
            const n3 = Math.floor(Math.random() * 5) + 2;
            // (n1 + n2) * n3
            expressionTokens = createBasicExpression(['(', n1, ADD_OP, n2, ')', MUL_OP, n3]);
        }
        else {
            // Challenge: Combined Brackets and Div/Mul
            const n1 = Math.floor(Math.random() * 3) + 2;
            const n2 = Math.floor(Math.random() * 3) + 2;
            const b1 = Math.floor(Math.random() * 10) + 5;
            const b2 = Math.floor(Math.random() * 4) + 1;
            // (b1 - b2) + n1 * n2
            expressionTokens = createBasicExpression(['(', b1, SUB_OP, b2, ')', ADD_OP, n1, MUL_OP, n2]);
        }

        return {
            tokens: expressionTokens,
            scoreReward: scoreReward,
            difficulty: levelIndex
        };
    }

    function createBasicExpression(values) {
        return values.map((v, i) => {
            let type = 'number';
            if (typeof v === 'string') {
                if (v === '(' || v === ')') type = 'bracket';
                else type = 'operator';
            }
            return {
                id: Math.random().toString(36).substr(2, 9),
                type: type,
                value: v.toString(),
                class: getStyleClass(v)
            };
        });
    }

    function getStyleClass(val) {
        switch(val) {
            case '(':
            case ')': return 'bracket';
            case '^': return 'order';
            case DIV_OP: return 'divide';
            case MUL_OP: return 'multiply';
            case ADD_OP: return 'add';
            case SUB_OP: return 'subtract';
            default: return 'number';
        }
    }

    /**
     * Find the index of the operator that should be solved NEXT according to BODMAS
     * @param {Array} tokens 
     */
    function findNextStep(tokens) {
        // 1. Check for Brackets
        // Find the deepest inner-most brackets
        let bracketStart = -1;
        let bracketEnd = -1;
        let depth = 0;
        let maxDepth = 0;

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].value === '(') {
                depth++;
                if (depth > maxDepth) {
                    maxDepth = depth;
                    bracketStart = i;
                }
            } else if (tokens[i].value === ')') {
                if (depth === maxDepth && bracketStart !== -1) {
                    bracketEnd = i;
                    break; 
                }
                depth--;
            }
        }

        let rangeStart = 0;
        let rangeEnd = tokens.length - 1;

        if (bracketStart !== -1 && bracketEnd !== -1) {
            rangeStart = bracketStart + 1;
            rangeEnd = bracketEnd - 1;
        }

        // Within the range (bracketed or full), find the highest priority operator
        // Priority: Order (^) > Div/Mul (/ or *) > Add/Sub (+ or -)
        const activeTokens = tokens.slice(rangeStart, rangeEnd + 1);
        
        // Orders
        let bestIndex = -1;
        
        // Division & Multiplication (Left to Right)
        if (bestIndex === -1) {
            for (let i = rangeStart; i <= rangeEnd; i++) {
                if (tokens[i].value === DIV_OP || tokens[i].value === MUL_OP) {
                    bestIndex = i;
                    break;
                }
            }
        }

        // Addition & Subtraction (Left to Right)
        if (bestIndex === -1) {
            for (let i = rangeStart; i <= rangeEnd; i++) {
                if (tokens[i].value === ADD_OP || tokens[i].value === SUB_OP) {
                    bestIndex = i;
                    break;
                }
            }
        }

        // Special case: Only numbers or bracket with one number
        if (bestIndex === -1 && bracketStart !== -1) {
            // Check if there's exactly one number inside
            const inside = tokens.slice(bracketStart + 1, bracketEnd);
            if (inside.length === 1 && inside[0].type === 'number') {
                return {
                    type: 'bracket_cleanup',
                    startIndex: bracketStart,
                    endIndex: bracketEnd,
                    operatorIndex: bracketStart // For highlighting
                };
            }
        }

        if (bestIndex === -1) return null; // Fully solved

        return {
            type: 'operator',
            operatorIndex: bestIndex,
            leftOperandIndex: bestIndex - 1,
            rightOperandIndex: bestIndex + 1,
            symbol: tokens[bestIndex].value
        };
    }

    /**
     * Solve a specific step
     */
    function solveStep(tokens, step, userResult) {
        if (step.type === 'bracket_cleanup') {
            const newTokens = [...tokens];
            newTokens.splice(step.endIndex, 1);
            newTokens.splice(step.startIndex, 1);
            return { success: true, tokens: newTokens, result: null };
        }

        const leftVal = parseFloat(tokens[step.leftOperandIndex].value);
        const rightVal = parseFloat(tokens[step.rightOperandIndex].value);
        let correctResult;

        switch(step.symbol) {
            case ADD_OP: correctResult = leftVal + rightVal; break;
            case SUB_OP: correctResult = leftVal - rightVal; break;
            case MUL_OP: correctResult = leftVal * rightVal; break;
            case DIV_OP: correctResult = leftVal / rightVal; break;
            default: return { success: false, msg: "Unknown operation" };
        }

        if (parseFloat(userResult) === correctResult) {
            // Create new token list
            const newTokens = [...tokens];
            const resultToken = {
                id: 'res-' + Math.random().toString(36).substr(2, 5),
                type: 'number',
                value: correctResult.toString(),
                class: 'number'
            };
            
            // Replace the 3 tokens (L, Op, R) with the result
            newTokens.splice(step.leftOperandIndex, 3, resultToken);

            // Automatic bracket cleanup if needed
            // e.g. ( 8 ) -> 8
            cleanBrackets(newTokens);

            return { success: true, tokens: newTokens, result: correctResult };
        } else {
            return { success: false, msg: `Check your math! ${leftVal} ${step.symbol} ${rightVal} is not ${userResult}.` };
        }
    }

    function cleanBrackets(tokens) {
        for (let i = 0; i < tokens.length - 2; i++) {
            if (tokens[i].value === '(' && tokens[i+1].type === 'number' && tokens[i+2].value === ')') {
                tokens.splice(i + 2, 1); // remove )
                tokens.splice(i, 1);     // remove (
            }
        }
    }

    function getHint(tokens, step) {
        if (!step) return "The expression is finished!";
        
        const hasBrackets = tokens.some(t => t.value === '(');
        
        if (step.type === 'bracket_cleanup') {
            return "Inside the brackets is finished! Remove them to continue.";
        }

        if (hasBrackets) {
            // Check if step is inside brackets
            const openIdx = tokens.slice(0, step.operatorIndex).reverse().findIndex(t => t.value === '(');
            if (openIdx !== -1) {
                return `BODMAS says solve <strong>Brackets</strong> first! Let's solve the operations inside them.`;
            }
        }

        if (step.symbol === DIV_OP || step.symbol === MUL_OP) {
            return `After brackets and orders, solve <strong>Division</strong> and <strong>Multiplication</strong> from left to right.`;
        }
        
        if (step.symbol === ADD_OP || step.symbol === SUB_OP) {
            return `Finally, solve <strong>Addition</strong> and <strong>Subtraction</strong> from left to right.`;
        }

        return "Think about the BODMAS rules!";
    }

    return {
        generateLevel,
        findNextStep,
        solveStep,
        getHint,
        symbols: { DIV: DIV_OP, MUL: MUL_OP, ADD: ADD_OP, SUB: SUB_OP }
    };
})();
