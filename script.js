// script.js — globální JavaScript aplikace

document.addEventListener('DOMContentLoaded', () => {
  /* ═══ DOM reference ═══ */
  const root = document.documentElement;
  const body = document.body;
  const sheetSystem = document.getElementById('sheetSystem');
  const sheets = [...document.querySelectorAll('[data-sheet]')];
  const historyList = document.getElementById('historyList');
  const calcOperation = document.getElementById('calcOperation');
  const calcResult = document.getElementById('calcResult');
  const buttonRadiusSlider = document.getElementById('buttonRadiusSlider');
  const buttonRadiusValue = document.getElementById('buttonRadiusValue');
  const textSizeSlider = document.getElementById('textSizeSlider');
  const textSizeValue = document.getElementById('textSizeValue');
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  /* ═══ Stav ═══ */
  const sheetStack = [];

  const calcState = {
    current: calcResult.textContent.trim() || '0',
    acc: null,
    op: null,
    overwrite: true,
  };

  const recentHistory = [
    ['1 238 + 56 × 3', '1 406'],
    ['2 560 ÷ 8', '320'],
    ['98,5 × 7', '689,5'],
    ['7 123 − 45', '7 078'],
    ['(12 + 8) × 3', '60'],
    ['1 200 ÷ 30 + 15', '55'],
    ['5 % z 850', '42,5'],
    ['9² + 6²', '117'],
  ];

  const titles = {
    menu: 'Menu',
    history: 'Historie',
    settings: 'Nastavení',
    appearance: 'Vzhled',
    typography: 'Typografie',
    about: 'O aplikaci',
  };

  /* ═══ LocalStorage utility ═══ */
  const storage = {
    get(key, defaultValue) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('LocalStorage unavailable:', e);
      }
    },
  };

  /* ═══ Inicializace uložených nastavení ═══ */
  const savedTheme = storage.get('theme', 'light');
  const savedColor = storage.get('color', 'orange');
  const savedRadius = storage.get('buttonRadius', 50);
  const savedFont = storage.get('font', 'Inter');
  const savedTextSize = storage.get('textSize', 16);
  const savedHistory = storage.get('history', recentHistory);

  /* ═══ Aplikace nastavení ═══ */
  function applyTheme(theme) {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      metaTheme?.setAttribute('content', prefersDark ? '#111319' : '#eef1f5');
    } else {
      body.setAttribute('data-theme', theme);
      metaTheme?.setAttribute('content', theme === 'dark' ? '#111319' : '#eef1f5');
    }
    storage.set('theme', theme);
  }

  function applyColor(color) {
    const colorMap = {
      orange: '#ff6723',
      blue: '#2275ff',
      purple: '#8616ff',
      green: '#37c224',
      pink: '#ff1673',
      cyan: '#2bc4e8',
    };
    root.style.setProperty('--color-primary', colorMap[color] || colorMap.orange);
    storage.set('color', color);
  }

  function applyButtonRadius(radius) {
    root.style.setProperty('--radius-btn', radius + '%');
    buttonRadiusValue.textContent = radius + ' %';
    storage.set('buttonRadius', radius);
  }

  function applyFont(font) {
    root.style.setProperty('--font-family-base', `'${font}', sans-serif`);
    storage.set('font', font);
  }

  function applyTextSize(size) {
    const scale = size / 16;
    root.style.setProperty('--font-scale', scale);
    textSizeValue.textContent = size + ' px';
    storage.set('textSize', size);
  }

  // Aplikace uložených nastavení
  applyTheme(savedTheme);
  applyColor(savedColor);
  applyButtonRadius(savedRadius);
  applyFont(savedFont);
  applyTextSize(savedTextSize);

  /* ═══ Formátování čísel ═══ */
  function formatNumber(numStr) {
    if (!numStr) return '0';
    const parts = numStr.split(',');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.length > 1 ? intPart + ',' + parts[1] : intPart;
  }

  /* ═══ Animovaný výstup ═══ */
  function updateDisplay(value) {
    calcState.current = value;
    const formatted = formatNumber(value);
    calcResult.innerHTML = '';
    for (const char of formatted) {
      const span = document.createElement('span');
      span.className = 'drive-char';
      span.textContent = char;
      calcResult.appendChild(span);
    }
  }

  /* ═══ Kalkulátor logika ═══ */
  function calculate(a, op, b) {
    a = parseFloat(a.replace(/\s/g, '').replace(',', '.'));
    b = parseFloat(b.replace(/\s/g, '').replace(',', '.'));
    
    if (isNaN(a) || isNaN(b)) return null;

    let result;
    switch (op) {
      case '+': result = a + b; break;
      case '−': result = a - b; break;
      case '×': result = a * b; break;
      case '÷': result = b === 0 ? null : a / b; break;
      case '%': result = a % b; break;
      default: return null;
    }

    if (result === null || !isFinite(result)) return null;
    
    return Math.round(result * 1e10) / 1e10; // Eliminace Float chyb
  }

  /* ═══ Tlačítka kalkulačky ═══ */
  document.querySelectorAll('.calc-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      const action = btn.dataset.action;

      if (action === 'clear') {
        calcState.current = '0';
        calcState.acc = null;
        calcState.op = null;
        calcState.overwrite = true;
        calcOperation.textContent = '';
        updateDisplay('0');
      } else if (action === 'sign') {
        const num = parseFloat(calcState.current.replace(/\s/g, '').replace(',', '.'));
        calcState.current = String(num * -1).replace('.', ',');
        updateDisplay(calcState.current);
      } else if (action === 'percent') {
        const num = parseFloat(calcState.current.replace(/\s/g, '').replace(',', '.'));
        calcState.current = String(num / 100).replace('.', ',');
        updateDisplay(calcState.current);
      } else if (action === 'equals') {
        if (calcState.op && calcState.acc !== null) {
          const result = calculate(calcState.acc, calcState.op, calcState.current);
          if (result !== null) {
            const resultStr = String(result).replace('.', ',');
            storage.set('history', [
              [calcOperation.textContent, resultStr],
              ...storage.get('history', []).slice(0, 9),
            ]);
            calcState.current = resultStr;
            calcState.acc = null;
            calcState.op = null;
            calcState.overwrite = true;
            calcOperation.textContent = '';
            updateDisplay(resultStr);
          }
        }
      } else if (['+', '−', '×', '÷'].includes(value)) {
        if (calcState.op && calcState.acc !== null && !calcState.overwrite) {
          const result = calculate(calcState.acc, calcState.op, calcState.current);
          if (result !== null) {
            calcState.current = String(result).replace('.', ',');
          }
        }
        calcState.acc = calcState.current;
        calcState.op = value;
        calcState.overwrite = true;
        calcOperation.textContent = `${formatNumber(calcState.acc)} ${value}`;
      } else if (value) {
        if (calcState.overwrite) {
          calcState.current = value === ',' ? '0,' : value;
          calcState.overwrite = false;
        } else {
          if (value === ',' && calcState.current.includes(',')) return;
          calcState.current += value;
        }
        updateDisplay(calcState.current);
      }
    });
  });

  /* ═══ Bottom-sheet systém ═══ */
  function openSheet(sheetName) {
    const sheet = document.querySelector(`[data-sheet="${sheetName}"]`);
    if (!sheet) return;

    if (sheetStack.length > 0) {
      const current = sheetStack[sheetStack.length - 1];
      current.classList.remove('is-current');
      current.style.setProperty('--sheet-depth', sheetStack.length);
    }

    sheet.classList.add('is-open', 'is-current');
    sheetStack.push(sheet);
    sheetSystem.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeSheet() {
    if (sheetStack.length === 0) return;

    const current = sheetStack.pop();
    current.classList.remove('is-open', 'is-current');

    if (sheetStack.length > 0) {
      const prev = sheetStack[sheetStack.length - 1];
      prev.classList.add('is-current');
      prev.style.setProperty('--sheet-depth', sheetStack.length - 1);
    } else {
      sheetSystem.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  /* ═══ Sheet event listeners ═══ */
  document.querySelectorAll('[data-sheet-open]').forEach((btn) => {
    btn.addEventListener('click', () => openSheet(btn.dataset.sheetOpen));
  });

  document.querySelectorAll('[data-sheet-dismiss]').forEach((el) => {
    el.addEventListener('click', closeSheet);
  });

  document.querySelectorAll('[data-sheet-back]').forEach((btn) => {
    btn.addEventListener('click', closeSheet);
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheetStack.length > 0) closeSheet();
  });

  /* ═══ Nastavení — Vzhled ═══ */
  document.querySelectorAll('[data-theme]').forEach((btn) => {
    if (btn.dataset.theme === savedTheme) btn.classList.add('active');
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-theme]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyTheme(btn.dataset.theme);
    });
  });

  document.querySelectorAll('[data-color]').forEach((btn) => {
    if (btn.dataset.color === savedColor) btn.classList.add('active');
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-color]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyColor(btn.dataset.color);
    });
  });

  buttonRadiusSlider.addEventListener('input', (e) => {
    applyButtonRadius(e.target.value);
  });

  /* ═══ Nastavení — Typografie ═══ */
  document.querySelectorAll('[data-font]').forEach((btn) => {
    if (btn.dataset.font === savedFont) btn.classList.add('active');
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-font]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyFont(btn.dataset.font);
    });
  });

  textSizeSlider.addEventListener('input', (e) => {
    applyTextSize(e.target.value);
  });

  /* ═══ Historie ═══ */
  function renderHistory() {
    const history = storage.get('history', recentHistory);
    historyList.innerHTML = history.length ? history.map((item) => `
      <button class="history-item" type="button" data-calc="${item[0]}">
        <span class="recent-calculation">${item[0]}</span>
        <span class="recent-result">${item[1]}</span>
      </button>
    `).join('') : '<div class="empty-state">Žádné výpočty.</div>';

    historyList.querySelectorAll('.history-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        calcState.current = btn.dataset.calc.split(' ').filter(x => ['+', '−', '×', '÷'].includes(x)).length > 0 
          ? btn.dataset.calc.split(' ').pop() 
          : btn.dataset.calc;
        updateDisplay(calcState.current);
        closeSheet();
      });
    });
  }

  renderHistory();

  document.getElementById('clearHistory')?.addEventListener('click', () => {
    storage.set('history', []);
    renderHistory();
  });

  // Render historie při otevření sheetu
  document.querySelector('[data-sheet="history"]')?.addEventListener('click', () => {
    setTimeout(renderHistory, 100);
  });
});
