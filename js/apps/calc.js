(function () {
  'use strict';

  OS.registerApp({
    id: 'calc',
    name: 'Calculadora',
    icon: '🧮',
    width: 320,
    height: 430,

    mount(body) {
      body.innerHTML = `
        <div class="calc" role="application" aria-label="Calculadora">
          <output class="calc-display" aria-live="polite" aria-atomic="true">0</output>
          <div class="calc-grid">
            <button type="button" class="calc-key calc-key-wide danger" data-action="clear">C</button>
            <button type="button" class="calc-key" data-action="erase" aria-label="Apagar último dígito">⌫</button>
            <button type="button" class="calc-key operator" data-action="operator" data-value="/" aria-label="Dividir">÷</button>

            <button type="button" class="calc-key" data-action="digit" data-value="7">7</button>
            <button type="button" class="calc-key" data-action="digit" data-value="8">8</button>
            <button type="button" class="calc-key" data-action="digit" data-value="9">9</button>
            <button type="button" class="calc-key operator" data-action="operator" data-value="*" aria-label="Multiplicar">×</button>

            <button type="button" class="calc-key" data-action="digit" data-value="4">4</button>
            <button type="button" class="calc-key" data-action="digit" data-value="5">5</button>
            <button type="button" class="calc-key" data-action="digit" data-value="6">6</button>
            <button type="button" class="calc-key operator" data-action="operator" data-value="-" aria-label="Subtrair">−</button>

            <button type="button" class="calc-key" data-action="digit" data-value="1">1</button>
            <button type="button" class="calc-key" data-action="digit" data-value="2">2</button>
            <button type="button" class="calc-key" data-action="digit" data-value="3">3</button>
            <button type="button" class="calc-key operator" data-action="operator" data-value="+" aria-label="Somar">+</button>

            <button type="button" class="calc-key calc-key-wide" data-action="digit" data-value="0">0</button>
            <button type="button" class="calc-key" data-action="decimal" aria-label="Vírgula decimal">,</button>
            <button type="button" class="calc-key equals" data-action="equals" aria-label="Calcular">=</button>
          </div>
        </div>
      `;

      const display = body.querySelector('.calc-display');
      const keypad = body.querySelector('.calc-grid');
      const maxDigits = 15;

      let displayValue = '0';
      let storedValue = null;
      let pendingOperator = null;
      let replaceDisplay = false;
      let afterEquals = false;
      let repeatOperator = null;
      let repeatValue = null;
      let hasError = false;

      function updateDisplay() {
        display.textContent = displayValue;
      }

      function clear() {
        displayValue = '0';
        storedValue = null;
        pendingOperator = null;
        replaceDisplay = false;
        afterEquals = false;
        repeatOperator = null;
        repeatValue = null;
        hasError = false;
        updateDisplay();
      }

      function showError() {
        displayValue = 'Erro';
        storedValue = null;
        pendingOperator = null;
        replaceDisplay = true;
        afterEquals = false;
        repeatOperator = null;
        repeatValue = null;
        hasError = true;
        updateDisplay();
      }

      function parseDisplay() {
        return Number(displayValue.replace(',', '.'));
      }

      function formatNumber(value) {
        if (!Number.isFinite(value)) return null;

        const normalized = Object.is(value, -0) ? 0 : value;
        const rounded = Number.parseFloat(normalized.toPrecision(12));
        return String(rounded).replace('.', ',');
      }

      function calculate(left, operator, right) {
        switch (operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': return right === 0 ? null : left / right;
          default: return right;
        }
      }

      function resetForInput() {
        if (hasError) clear();

        if (afterEquals && pendingOperator === null) {
          storedValue = null;
          repeatOperator = null;
          repeatValue = null;
          afterEquals = false;
        }
      }

      function inputDigit(digit) {
        resetForInput();

        if (replaceDisplay || displayValue === '0') {
          displayValue = digit;
          replaceDisplay = false;
        } else {
          const digitCount = displayValue.replace(/\D/g, '').length;
          if (digitCount >= maxDigits) return;
          displayValue += digit;
        }

        updateDisplay();
      }

      function inputDecimal() {
        resetForInput();

        if (replaceDisplay) {
          displayValue = '0,';
          replaceDisplay = false;
        } else if (!displayValue.includes(',')) {
          displayValue += ',';
        }

        updateDisplay();
      }

      function erase() {
        if (hasError) {
          clear();
          return;
        }

        if (replaceDisplay) replaceDisplay = false;
        if (afterEquals) {
          storedValue = null;
          repeatOperator = null;
          repeatValue = null;
          afterEquals = false;
        }

        displayValue = displayValue.length > 1 ? displayValue.slice(0, -1) : '0';
        if (displayValue === '-' || displayValue === '') displayValue = '0';
        updateDisplay();
      }

      function applyOperation(left, operator, right) {
        const result = calculate(left, operator, right);
        const formatted = result === null ? null : formatNumber(result);

        if (formatted === null) {
          showError();
          return null;
        }

        displayValue = formatted;
        updateDisplay();
        return result;
      }

      function chooseOperator(operator) {
        if (hasError) return;

        const currentValue = parseDisplay();

        if (storedValue === null) {
          storedValue = currentValue;
        } else if (pendingOperator !== null && !replaceDisplay) {
          const result = applyOperation(storedValue, pendingOperator, currentValue);
          if (result === null) return;
          storedValue = result;
        }

        pendingOperator = operator;
        replaceDisplay = true;
        afterEquals = false;
        repeatOperator = null;
        repeatValue = null;
      }

      function equals() {
        if (hasError) return;

        if (pendingOperator !== null && storedValue !== null) {
          const rightValue = replaceDisplay ? storedValue : parseDisplay();
          const operator = pendingOperator;
          const result = applyOperation(storedValue, operator, rightValue);
          if (result === null) return;

          repeatOperator = operator;
          repeatValue = rightValue;
          storedValue = result;
          pendingOperator = null;
        } else if (repeatOperator !== null && repeatValue !== null) {
          const result = applyOperation(parseDisplay(), repeatOperator, repeatValue);
          if (result === null) return;
          storedValue = result;
        } else {
          return;
        }

        replaceDisplay = true;
        afterEquals = true;
      }

      function runAction(action, value) {
        switch (action) {
          case 'digit': inputDigit(value); break;
          case 'decimal': inputDecimal(); break;
          case 'operator': chooseOperator(value); break;
          case 'equals': equals(); break;
          case 'erase': erase(); break;
          case 'clear': clear(); break;
        }
      }

      keypad.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button || !keypad.contains(button)) return;
        runAction(button.dataset.action, button.dataset.value);
      });

      function onKeyDown(event) {
        if (!body.isConnected) {
          document.removeEventListener('keydown', onKeyDown);
          return;
        }

        const windowElement = body.closest('.window');
        if (windowElement && !windowElement.classList.contains('focused')) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;

        let action = null;
        let value;

        if (/^[0-9]$/.test(event.key)) {
          action = 'digit';
          value = event.key;
        } else if (event.key === ',' || event.key === '.') {
          action = 'decimal';
        } else if (['+', '-', '*', '/'].includes(event.key)) {
          action = 'operator';
          value = event.key;
        } else if (event.key === 'Enter' || event.key === '=') {
          action = 'equals';
        } else if (event.key === 'Backspace') {
          action = 'erase';
        } else if (event.key === 'Escape' || event.key === 'Delete') {
          action = 'clear';
        }

        if (action === null) return;
        event.preventDefault();
        runAction(action, value);
      }

      document.addEventListener('keydown', onKeyDown);
      updateDisplay();
    }
  });
})();
