// DOM Elements
const calculator = {
    display: {
        expression: document.getElementById('expression'),
        result: document.getElementById('result')
    },
    buttons: {
        numbers: document.querySelectorAll('.number'),
        operators: document.querySelectorAll('.operator'),
        special: document.querySelectorAll('.special'),
        equal: document.querySelector('.equal')
    },
    history: {
        panel: document.getElementById('history-panel'),
        container: document.getElementById('history'),
        toggle: document.querySelector('[data-view="history"]'),
        close: document.querySelector('.close-panel')
    }
};

// Calculator State
let state = {
    currentExpression: '0',
    lastResult: '0',
    isNewCalculation: true,
    brackets: 0
};

// Event Listeners
function initializeCalculator() {
    // Number buttons
    calculator.buttons.numbers.forEach(button => {
        button.addEventListener('click', () => handleNumber(button.dataset.number));
    });

    // Operator buttons
    calculator.buttons.operators.forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.operator) {
                handleOperator(button.dataset.operator);
            } else if (button.dataset.bracket) {
                handleBrackets();
            }
        });
    });

    // Special buttons
    calculator.buttons.special.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            if (action === 'clear') clearCalculator();
            if (action === 'backspace') handleBackspace();
        });
    });

    // Equal button
    calculator.buttons.equal.addEventListener('click', calculate);

    // History panel
    calculator.history.toggle.addEventListener('click', toggleHistory);
    calculator.history.close.addEventListener('click', toggleHistory);
}

// Handler Functions
function handleNumber(num) {
    if (state.isNewCalculation) {
        state.currentExpression = '';
        state.isNewCalculation = false;
    }
    
    // Handle decimal point
    if (num === '.') {
        // Check if current number already has a decimal point
        const parts = state.currentExpression.split(/[\+\-\×\÷\s]/);
        const currentNumber = parts[parts.length - 1];
        
        if (currentNumber.includes('.')) {
            return; // Don't add another decimal point
        }
        
        // Add 0 before decimal if it's the first character
        if (state.currentExpression === '' || /[\+\-\×\÷\s]$/.test(state.currentExpression)) {
            state.currentExpression += '0';
        }
    }
    
    state.currentExpression += num;
    updateDisplay();
}

function handleOperator(operator) {
    state.isNewCalculation = false;
    state.currentExpression += ` ${operator} `;
    updateDisplay();
}

function handleBrackets() {
    if (state.brackets > 0) {
        state.currentExpression += ')';
        state.brackets--;
    } else {
        state.currentExpression += '(';
        state.brackets++;
    }
    updateDisplay();
}

function handleBackspace() {
    if (state.currentExpression.length <= 1) {
        state.currentExpression = '0';
    } else {
        state.currentExpression = state.currentExpression.slice(0, -1);
    }
    updateDisplay();
}

function clearCalculator() {
    state.currentExpression = '0';
    state.lastResult = '0';
    state.isNewCalculation = true;
    state.brackets = 0;
    updateDisplay();
}

function calculate() {
    try {
        let expression = state.currentExpression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-');

        const result = eval(expression);
        
        // Format decimal numbers
        state.lastResult = Number.isInteger(result) ? 
            result.toString() : 
            parseFloat(result.toFixed(8)).toString();
            
        addToHistory(state.currentExpression, state.lastResult);
        state.currentExpression = state.lastResult;
        state.isNewCalculation = true;
        updateDisplay();
    } catch (error) {
        state.lastResult = 'Error';
        updateDisplay();
    }
}

// UI Updates
function updateDisplay() {
    calculator.display.expression.textContent = state.currentExpression;
    calculator.display.result.textContent = state.lastResult;
}

function addToHistory(expression, result) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <div>${expression}</div>
        <div>= ${result}</div>
    `;
    calculator.history.container.insertBefore(historyItem, calculator.history.container.firstChild);
}

function toggleHistory() {
    calculator.history.panel.parentElement.classList.toggle('active');
}

// Initialize
initializeCalculator();
