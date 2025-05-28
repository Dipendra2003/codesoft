// Grab elements
const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const buttons = document.querySelectorAll('button');
const historyEl = document.createElement('div');
historyEl.id = 'history';
document.body.appendChild(historyEl);

const themeToggleBtn = document.createElement('button');
themeToggleBtn.id = 'theme-toggle';
themeToggleBtn.innerHTML = '🌙';
document.body.insertBefore(themeToggleBtn, document.body.firstChild);

const voiceBtn = document.createElement('button');
voiceBtn.id = 'voice-input';
voiceBtn.innerHTML = '🎤';
document.body.insertBefore(voiceBtn, document.body.firstChild);

let expression = '';
let lastInput = '';
let memory = 0;
let history = [];
let isDarkMode = localStorage.getItem('darkMode') === 'true';

const MAX_HISTORY_ITEMS = 10;
let calculationHistory = JSON.parse(localStorage.getItem('calcHistory')) || [];

// Conversion handlers
const converterTabs = document.querySelectorAll('.converter-tabs .tab');
const converterSections = document.querySelectorAll('.converter-section');
const convertButtons = document.querySelectorAll('.convert-btn');

// Conversion factors
const conversions = {
    // Length
    'km-mi': 0.621371,
    'km-m': 1000,
    'km-ft': 3280.84,
    'm-km': 0.001,
    'm-mi': 0.000621371,
    'm-ft': 3.28084,
    'mi-km': 1.60934,
    'mi-m': 1609.34,
    'mi-ft': 5280,
    'ft-km': 0.0003048,
    'ft-m': 0.3048,
    'ft-mi': 0.000189394,
    
    // Temperature
    'c-f': temp => (temp * 9/5) + 32,
    'c-k': temp => temp + 273.15,
    'f-c': temp => (temp - 32) * 5/9,
    'f-k': temp => (temp - 32) * 5/9 + 273.15,
    'k-c': temp => temp - 273.15,
    'k-f': temp => (temp - 273.15) * 9/5 + 32
};

function isOperator(char) {
  return ['+', '−', '×', '÷', '%'].includes(char);
}

function formatNumber(num) {
  // Format large/small numbers properly
  if (Math.abs(num) < 0.000001 || Math.abs(num) > 999999999) {
    return num.toExponential(6);
  }
  return Number(num.toPrecision(10)).toString();
}

function replaceSymbols(expr) {
  // Replace custom operators with JS operators
  return expr
    .replace(/÷/g, '/')
    .replace(/×/g, '*')
    .replace(/−/g, '-')
    .replace(/%/g, '*0.01');
}

function validateExpression(expr) {
  // Check for incomplete expressions
  const openBrackets = (expr.match(/\(/g) || []).length;
  const closeBrackets = (expr.match(/\)/g) || []).length;
  if (openBrackets !== closeBrackets) return false;
  if (isOperator(expr[expr.length - 1])) return false;
  return true;
}

function safeEval(expr) {
  if (!validateExpression(expr)) return 'Error';
  
  try {
    // Evaluate scientific functions by replacing sin, cos, etc. first
    const replacedExpr = expr
      .replace(/π/g, `Math.PI`)
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/log\(/g, 'Math.log10('); // log base 10

    const jsExpr = replaceSymbols(replacedExpr);

    // eslint-disable-next-line no-new-func
    const fn = new Function(`return ${jsExpr}`);
    const val = fn();
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      return formatNumber(val);
    }
    return 'Error';
  } catch {
    return 'Error';
  }
}

function addToHistory(expression, result) {
    if (!expression || expression === '0' || result === 'Error') return;

    const historyItem = {
        expression: expression,
        result: result,
        timestamp: new Date().toISOString()
    };

    calculationHistory.unshift(historyItem);
    if (calculationHistory.length > MAX_HISTORY_ITEMS) {
        calculationHistory.pop();
    }

    localStorage.setItem('calcHistory', JSON.stringify(calculationHistory));
    updateHistoryDisplay();
}

// Add function to update history display
function updateHistoryDisplay() {
    const historyContainer = document.getElementById('history');
    if (!historyContainer) return;

    if (calculationHistory.length === 0) {
        historyContainer.innerHTML = `
            <div class="history-empty">
                <span class="material-icons">history</span>
                <p>No calculation history</p>
            </div>`;
        return;
    }

    historyContainer.innerHTML = `
        ${calculationHistory.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-content">
                    <div class="history-expression">${item.expression}</div>
                    <div class="history-result">
                        <span class="equals">=</span>
                        <span class="value">${item.result}</span>
                    </div>
                </div>
                <div class="history-time">${formatTime(new Date(item.timestamp))}</div>
            </div>
        `).join('')}
        <button class="clear-history">
            <span class="material-icons">delete</span>
            Clear History
        </button>`;

    attachHistoryListeners();
}

// Add helper function for formatting time
function formatTime(date) {
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Add function to attach history item listeners
function attachHistoryListeners() {
    const historyContainer = document.getElementById('history');
    
    // Add click handlers for history items
    const historyItems = historyContainer.querySelectorAll('.history-item');
    historyItems.forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            const historyItem = calculationHistory[index];
            expression = historyItem.expression;
            updateDisplay();
        });
    });

    // Add clear history button handler
    const clearBtn = historyContainer.querySelector('.clear-history');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            calculationHistory = [];
            localStorage.removeItem('calcHistory');
            updateHistoryDisplay();
        });
    }
}

function handleKeyPress(e) {
  const key = e.key;
  if (/[\d.]/.test(key)) {
    handleInput(key, 'number');
  } else if (['+', '-', '*', '/', '%'].includes(key)) {
    handleInput(key.replace('*', '×').replace('/', '÷'), 'operator');
  } else if (key === 'Enter') {
    handleInput('=', 'action');
  } else if (key === 'Escape') {
    handleInput('clear', 'action');
  } else if (key === 'Backspace') {
    handleBackspace();
  }
}

function handleMemory(action) {
  switch(action) {
    case 'MS':
      memory = Number(resultEl.textContent);
      break;
    case 'MR':
      expression = memory.toString();
      lastInput = 'number';
      break;
    case 'M+':
      memory += Number(resultEl.textContent);
      break;
    case 'MC':
      memory = 0;
      break;
  }
  updateDisplay();
}

function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  themeToggleBtn.innerHTML = isDarkMode ? '☀️' : '🌙';
  localStorage.setItem('darkMode', isDarkMode);
}

function updateDisplay() {
  expressionEl.textContent = expression || '0';
  const res = safeEval(expression);
  resultEl.textContent = res;
  if (res !== 'Error') {
    addToHistory(expression, res);
  }
}

function convert(value, from, to) {
  const key = `${from}-${to}`;
  const converter = conversions[key];
  
  if (typeof converter === 'function') {
    return converter(value);
  } else if (converter) {
    return value * converter;
  }
  return 'Invalid conversion';
}

// Currency conversion using API
async function convertCurrency(amount, fromCurrency, toCurrency) {
    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        const data = await response.json();
        const rate = data.rates[toCurrency];
        return amount * rate;
    } catch (error) {
        console.error('Currency conversion error:', error);
        return 'Error fetching rates';
    }
}

// Add keyboard support
document.addEventListener('keydown', handleKeyPress);

// Button click handler with memory support
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const memory = button.getAttribute('data-memory');
    if (memory) {
      handleMemory(memory);
      return;
    }
    
    const number = button.getAttribute('data-number');
    const decimal = button.getAttribute('data-decimal');
    const operator = button.getAttribute('data-operator');
    const func = button.getAttribute('data-function');
    const action = button.getAttribute('data-action');
    const bracket = button.getAttribute('data-bracket');

    if (number !== null) {
      // Append number or π constant
      if (expression === '0' && number !== 'π') {
        expression = number; // Replace leading zero
      } else {
        expression += number;
      }
      lastInput = 'number';
    } else if (decimal !== null) {
      // Append decimal point if last input wasn't decimal
      if (!expression || lastInput === 'operator' || lastInput === 'function') {
        expression += '0.';
      } else if (!expression.endsWith('.')) {
        expression += '.';
      }
      lastInput = 'decimal';
    } else if (operator !== null) {
      // Handle brackets
      if (bracket === '()') {
        // Toggle brackets intelligently
        const openBrackets = (expression.match(/\(/g) || []).length;
        const closeBrackets = (expression.match(/\)/g) || []).length;
        if (openBrackets === closeBrackets || expression.endsWith('(')) {
          expression += '(';
        } else if (openBrackets > closeBrackets && !expression.endsWith('(')) {
          expression += ')';
        }
      } else if (operator) {
        // Append operator only if last input is number or closing bracket
        if (lastInput === 'number' || expression.endsWith(')')) {
          expression += operator;
          lastInput = 'operator';
        }
      }
    } else if (func !== null) {
      // Append function with opening bracket (e.g. sin(
      expression += func + '(';
      lastInput = 'function';
    } else if (action !== null) {
      if (action === 'clear') {
        expression = '';
        lastInput = '';
        resultEl.textContent = '0';
      } else if (action === 'calculate') {
        const val = safeEval(expression);
        expression = val === 'Error' ? '' : val.toString();
        lastInput = 'number';
        resultEl.textContent = val;
      } else if (action === 'percent') {
        // Append percent operator
        if (lastInput === 'number') {
          expression += '%';
          lastInput = 'operator';
        }
      } else if (action.startsWith('convert')) {
        // Handle unit conversions
        const [from, to] = action.split('-').slice(1);
        const value = parseFloat(resultEl.textContent);
        if (!isNaN(value)) {
          const converted = convert(value, from, to);
          expression = `${value} ${from} = ${converted} ${to}`;
          lastInput = 'number';
        }
      } else if (action === 'backspace') {
        handleBackspace();
        return;
      }
    }
    updateDisplay();
  });
});

themeToggleBtn.addEventListener('click', toggleTheme);

// Initialize theme
document.body.classList.toggle('dark-mode', isDarkMode);

updateDisplay();

// Add voice input handling
function handleVoiceInput() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    // Convert words to mathematical expression
    const expr = transcript
      .replace(/plus/gi, '+')
      .replace(/minus/gi, '-')
      .replace(/times|multiplied by/gi, '×')
      .replace(/divided by/gi, '÷');
    
    expression = expr;
    updateDisplay();
  };

  recognition.start();
}

// Add voice output function
function speakResult(result) {
  const speech = new SpeechSynthesisUtterance(result);
  window.speechSynthesis.speak(speech);
}

voiceBtn.addEventListener('click', handleVoiceInput);

class Matrix {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.data = Array(rows).fill().map(() => Array(cols).fill(0));
  }

  static add(a, b) {
    if (a.rows !== b.rows || a.cols !== b.cols) return null;
    const result = new Matrix(a.rows, a.cols);
    for (let i = 0; i < a.rows; i++) {
      for (let j = 0; j < a.cols; j++) {
        result.data[i][j] = a.data[i][j] + b.data[i][j];
      }
    }
    return result;
  }

  static multiply(a, b) {
    if (a.cols !== b.rows) return null;
    const result = new Matrix(a.rows, b.cols);
    for (let i = 0; i < a.rows; i++) {
      for (let j = 0; j < b.cols; j++) {
        let sum = 0;
        for (let k = 0; k < a.cols; k++) {
          sum += a.data[i][k] * b.data[k][j];
        }
        result.data[i][j] = sum;
      }
    }
    return result;
  }
}

// Add navigation and panel handling
const navItems = document.querySelectorAll('.nav-item');
const featurePanels = document.querySelector('.feature-panels');
const panels = document.querySelectorAll('.panel');
const closePanelBtns = document.querySelectorAll('.close-panel');

// Handle navigation clicks
navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Update active nav item
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        const view = item.dataset.view;
        if (view === 'calculator') {
            featurePanels.classList.remove('show');
        } else {
            showPanel(view);
        }
    });
});

// Update the navigation click handler
function handleNavClick(navItem) {
    const view = navItem.dataset.view;
    
    // Hide history when not in history panel
    const historyEl = document.getElementById('history');
    if (view === 'history') {
        historyEl.style.display = 'block';
        updateHistoryDisplay(); // Refresh history content
    } else {
        historyEl.style.display = 'none';
    }
}

// Update panel visibility handler
function showPanel(panelId) {
    panels.forEach(panel => {
        panel.classList.remove('active');
        // Hide history when switching panels
        if (panel.id === 'history-panel') {
            document.getElementById('history').style.display = 'none';
        }
    });
    
    const targetPanel = document.getElementById(`${panelId}-panel`);
    if (targetPanel) {
        targetPanel.classList.add('active');
        featurePanels.classList.add('show');
        
        // Show history only in history panel
        if (panelId === 'history') {
            document.getElementById('history').style.display = 'block';
            updateHistoryDisplay();
        }
    }
}

// Remove any standalone history element if it exists
document.addEventListener('DOMContentLoaded', () => {
    const standaloneHistory = document.querySelector('body > #history');
    if (standaloneHistory) {
        standaloneHistory.remove();
    }
});

// Show specific panel
function showPanel(panelId) {
    panels.forEach(panel => panel.classList.remove('active'));
    featurePanels.classList.add('show');
    const targetPanel = document.getElementById(`${panelId}-panel`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

// Handle panel close buttons
closePanelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        featurePanels.classList.remove('show');
        navItems[0].click(); // Return to calculator
    });
});

// Handle converter tabs
converterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Update active tab
        converterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show corresponding section
        const type = tab.dataset.converter;
        converterSections.forEach(section => {
            section.style.display = section.dataset.section === type ? 'block' : 'none';
        });
    });
});

// Handle conversions
function setupConversion(type) {
    const fromInput = document.getElementById(`${type}-from`);
    const toInput = document.getElementById(`${type}-to`);
    const fromUnit = document.getElementById(`${type}-from-unit`);
    const toUnit = document.getElementById(`${type}-to-unit`);
    const convertBtn = fromInput.closest('.converter-section').querySelector('.convert-btn');

    convertBtn.addEventListener('click', async () => {
        const value = parseFloat(fromInput.value);
        if (isNaN(value)) return;

        const from = fromUnit.value;
        const to = toUnit.value;

        if (type === 'currency') {
            // Handle currency conversion
            const result = await convertCurrency(value, from, to);
            toInput.value = typeof result === 'number' ? result.toFixed(2) : result;
        } else {
            // Handle other conversions
            const result = convert(value, from, to);
            toInput.value = typeof result === 'number' ? result.toFixed(2) : result;
        }
    });

    // Add currency swap functionality
    if (type === 'currency') {
        const swapIcon = fromInput.closest('.converter-section').querySelector('.material-icons');
        swapIcon.style.cursor = 'pointer';
        swapIcon.addEventListener('click', () => {
            // Swap currency units
            const tempUnit = fromUnit.value;
            fromUnit.value = toUnit.value;
            toUnit.value = tempUnit;

            // Swap values if they exist
            if (fromInput.value && toInput.value) {
                const tempValue = fromInput.value;
                fromInput.value = toInput.value;
                toInput.value = tempValue;
            }
        });
    }
}

// Setup conversion listeners
setupConversion('length');
setupConversion('temp');
setupConversion('currency');

// Handle tool items
const toolItems = document.querySelectorAll('.tool-item');
toolItems.forEach(item => {
    item.addEventListener('click', () => {
        const tool = item.dataset.tool;
        switch(tool) {
            case 'matrix':
                showMatrixTool();
                break;
            case 'interest':
                showInterestCalculator();
                break;
            case 'age':
                showAgeCalculator();
                break;
            case 'bmi':
                showBMICalculator();
                break;
        }
    });
});

// Tool Implementation Functions
function showMatrixTool() {
    const toolContent = `
        <div class="matrix-tool">
            <div class="matrix-inputs">
                <div class="matrix-grid">
                    <h4>Matrix A</h4>
                    <div class="matrix">
                        <input type="number" data-row="0" data-col="0">
                        <input type="number" data-row="0" data-col="1">
                        <input type="number" data-row="1" data-col="0">
                        <input type="number" data-row="1" data-col="1">
                    </div>
                    <h4>Matrix B</h4>
                    <div class="matrix">
                        <input type="number" data-row="0" data-col="0">
                        <input type="number" data-row="0" data-col="1">
                        <input type="number" data-row="1" data-col="0">
                        <input type="number" data-row="1" data-col="1">
                    </div>
                </div>
                <div class="matrix-operations">
                    <button class="operation-btn" data-op="add">Add</button>
                    <button class="operation-btn" data-op="multiply">Multiply</button>
                </div>
                <div class="matrix-result"></div>
            </div>
        </div>`;
    updateToolPanel('Matrix Calculator', toolContent);
}

function showInterestCalculator() {
    const toolContent = `
        <div class="interest-tool">
            <div class="input-group">
                <label for="principal">Principal Amount</label>
                <input type="number" id="principal" placeholder="Enter principal amount">
            </div>
            <div class="input-group">
                <label for="rate">Interest Rate (%)</label>
                <input type="number" id="rate" placeholder="Enter interest rate">
            </div>
            <div class="input-group">
                <label for="time">Time (Years)</label>
                <input type="number" id="time" placeholder="Enter time period">
            </div>
            <div class="input-group">
                <label for="interest-type">Interest Type</label>
                <select id="interest-type">
                    <option value="simple">Simple Interest</option>
                    <option value="compound">Compound Interest</option>
                </select>
            </div>
            <button class="calculate-btn">Calculate Interest</button>
            <div class="interest-result"></div>
        </div>`;
    updateToolPanel('Interest Calculator', toolContent);
}

function showAgeCalculator() {
    const toolContent = `
        <div class="age-tool">
            <div class="input-group">
                <label for="birthdate">Date of Birth</label>
                <input type="date" id="birthdate">
            </div>
            <button class="calculate-btn">Calculate Age</button>
            <div class="age-result"></div>
        </div>`;
    updateToolPanel('Age Calculator', toolContent);
}

function showBMICalculator() {
    const toolContent = `
        <div class="bmi-tool">
            <div class="input-group">
                <label for="weight">Weight (kg)</label>
                <input type="number" id="weight" placeholder="Enter weight">
            </div>
            <div class="input-group">
                <label for="height">Height (cm)</label>
                <input type="number" id="height" placeholder="Enter height">
            </div>
            <button class="calculate-btn">Calculate BMI</button>
            <div class="bmi-result"></div>
        </div>`;
    updateToolPanel('BMI Calculator', toolContent);
}

function updateToolPanel(title, content) {
    const panel = document.getElementById('tools-panel');
    panel.querySelector('h3').textContent = title;
    
    // Remove existing tool content if any
    const existingContent = panel.querySelector('.tool-content');
    if (existingContent) {
        existingContent.remove();
    }
    
    // Create and add new tool content
    const toolContent = document.createElement('div');
    toolContent.className = 'tool-content';
    toolContent.innerHTML = content;
    panel.appendChild(toolContent);
    
    // Add event listeners for the new tool
    setupToolEventListeners(title.toLowerCase());
}

function setupToolEventListeners(toolType) {
    switch(toolType) {
        case 'matrix calculator':
            setupMatrixCalculator();
            break;
        case 'interest calculator':
            setupInterestCalculator();
            break;
        case 'age calculator':
            setupAgeCalculator();
            break;
        case 'bmi calculator':
            setupBMICalculator();
            break;
    }
}

// Tool-specific setup functions
function setupMatrixCalculator() {
    const operationBtns = document.querySelectorAll('.operation-btn');
    operationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const matrices = getMatrixInputs();
            const operation = btn.dataset.op;
            const result = operation === 'add' ? addMatrices(matrices.a, matrices.b) : multiplyMatrices(matrices.a, matrices.b);
            displayMatrixResult(result);
        });
    });
}

function setupInterestCalculator() {
    const calculateBtn = document.querySelector('.calculate-btn');
    calculateBtn.addEventListener('click', () => {
        const principal = parseFloat(document.getElementById('principal').value);
        const rate = parseFloat(document.getElementById('rate').value) / 100;
        const time = parseFloat(document.getElementById('time').value);
        const type = document.getElementById('interest-type').value;
        
        const result = type === 'simple' 
            ? principal * (1 + rate * time)
            : principal * Math.pow(1 + rate, time);
            
        document.querySelector('.interest-result').innerHTML = `
            <p>Final Amount: $${result.toFixed(2)}</p>
            <p>Interest: $${(result - principal).toFixed(2)}</p>`;
    });
}

function setupAgeCalculator() {
    const calculateBtn = document.querySelector('.calculate-btn');
    calculateBtn.addEventListener('click', () => {
        const birthDate = new Date(document.getElementById('birthdate').value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        let finalAge = age;
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            finalAge--;
        }
        
        document.querySelector('.age-result').innerHTML = `
            <p>Your age is: ${finalAge} years</p>`;
    });
}

function setupBMICalculator() {
    const calculateBtn = document.querySelector('.calculate-btn');
    calculateBtn.addEventListener('click', () => {
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value) / 100; // convert to meters
        const bmi = weight / (height * height);
        
        let category;
        if (bmi < 18.5) category = 'Underweight';
        else if (bmi < 25) category = 'Normal weight';
        else if (bmi < 30) category = 'Overweight';
        else category = 'Obese';
        
        document.querySelector('.bmi-result').innerHTML = `
            <p>Your BMI: ${bmi.toFixed(1)}</p>
            <p>Category: ${category}</p>`;
    });
}

// Add this to your handleInput or button click handler
function handleBackspace() {
    if (expression.length > 0) {
        expression = expression.slice(0, -1);
        if (expression === '') {
            expression = '0';
        }
        updateDisplay();
    }
}

// Initialize the calculator in calculator view
document.addEventListener('DOMContentLoaded', () => {
    // Hide all panels initially
    panels.forEach(panel => panel.classList.remove('active'));
    featurePanels.classList.remove('show');
    
    // Set calculator as active
    navItems[0].classList.add('active');
});
