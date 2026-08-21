(function () {
  'use strict';

  OS.registerApp({
    id: 'campominado',
    name: 'Campo Minado',
    icon: '💣',
    width: 340,
    height: 450,

    mount(body, win) {
      body.innerHTML = `
        <style>
          .mina-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            height: 100%;
            padding: 12px;
            box-sizing: border-box;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #f8fafc;
            background: rgba(15, 23, 42, 0.4);
            user-select: none;
          }

          .mina-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            max-width: 300px;
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            margin-bottom: 8px;
            box-sizing: border-box;
          }

          .mina-display {
            background: #090d16;
            color: #ef4444;
            font-family: 'Courier New', Courier, monospace;
            font-size: 20px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid rgba(239, 68, 68, 0.3);
            min-width: 54px;
            text-align: center;
            letter-spacing: 2px;
            box-shadow: inset 0 0 6px rgba(239, 68, 68, 0.2);
          }

          .mina-face-btn {
            width: 38px;
            height: 38px;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.15s ease, transform 0.1s ease;
          }

          .mina-face-btn:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          .mina-face-btn:active {
            transform: scale(0.92);
          }

          .mina-board {
            display: grid;
            grid-template-columns: repeat(9, 1fr);
            gap: 3px;
            width: 100%;
            max-width: 300px;
            aspect-ratio: 1;
            background: rgba(0, 0, 0, 0.35);
            padding: 6px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
            box-sizing: border-box;
          }

          .mina-cell {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 4px;
            cursor: pointer;
            user-select: none;
            transition: background 0.1s ease, border-color 0.1s ease, transform 0.05s ease;
            color: #f8fafc;
            padding: 0;
            outline: none;
          }

          .mina-cell:hover:not(.mina-cell-revealed) {
            background: rgba(255, 255, 255, 0.22);
            border-color: rgba(255, 255, 255, 0.25);
          }

          .mina-cell:active:not(.mina-cell-revealed) {
            transform: scale(0.94);
          }

          .mina-cell-revealed {
            background: rgba(0, 0, 0, 0.3) !important;
            border-color: rgba(255, 255, 255, 0.04) !important;
            cursor: default;
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
          }

          .mina-cell-mine {
            background: rgba(239, 68, 68, 0.25) !important;
          }

          .mina-cell-exploded {
            background: #ef4444 !important;
            color: #ffffff !important;
            border-color: #f87171 !important;
          }

          .mina-n1 { color: #38bdf8; }
          .mina-n2 { color: #4ade80; }
          .mina-n3 { color: #f87171; }
          .mina-n4 { color: #c084fc; }
          .mina-n5 { color: #fb923c; }
          .mina-n6 { color: #2dd4bf; }
          .mina-n7 { color: #f472b6; }
          .mina-n8 { color: #facc15; }

          .mina-footer {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            max-width: 300px;
            margin-top: 8px;
          }

          .mina-status {
            font-size: 13px;
            font-weight: 500;
            color: #94a3b8;
            text-align: center;
            min-height: 20px;
          }

          .mina-status-win {
            color: #4ade80;
            font-weight: 600;
          }

          .mina-status-lose {
            color: #f87171;
            font-weight: 600;
          }
        </style>
        <div class="mina-container" role="application" aria-label="Campo Minado">
          <div class="mina-header">
            <div class="mina-display mina-counter" aria-label="Minas restantes">010</div>
            <button type="button" class="mina-face-btn" aria-label="Novo Jogo">🙂</button>
            <div class="mina-display mina-timer" aria-label="Tempo corrido">000</div>
          </div>
          <div class="mina-board"></div>
          <div class="mina-footer">
            <div class="mina-status">Clique para jogar</div>
          </div>
        </div>
      `;

      const GRID_SIZE = 9;
      const TOTAL_MINES = 10;

      const counterDisplay = body.querySelector('.mina-counter');
      const timerDisplay = body.querySelector('.mina-timer');
      const faceBtn = body.querySelector('.mina-face-btn');
      const boardEl = body.querySelector('.mina-board');
      const statusEl = body.querySelector('.mina-status');

      let board = [];
      let gameStarted = false;
      let gameOver = false;
      let gameWon = false;
      let flagsCount = 0;
      let timerSeconds = 0;
      let timerInterval = null;
      let revealedCount = 0;

      function stopTimer() {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
      }

      function startTimer() {
        stopTimer();
        timerInterval = setInterval(() => {
          if (!body.isConnected) {
            stopTimer();
            return;
          }
          timerSeconds++;
          if (timerSeconds > 999) timerSeconds = 999;
          updateTimerDisplay();
        }, 1000);
      }

      function formatNumber(num) {
        if (num < 0) {
          const absVal = Math.abs(num);
          return '-' + String(absVal).padStart(2, '0');
        }
        return String(Math.min(999, num)).padStart(3, '0');
      }

      function updateCounterDisplay() {
        counterDisplay.textContent = formatNumber(TOTAL_MINES - flagsCount);
      }

      function updateTimerDisplay() {
        timerDisplay.textContent = formatNumber(timerSeconds);
      }

      function getNeighbors(r, c) {
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
              neighbors.push(board[nr][nc]);
            }
          }
        }
        return neighbors;
      }

      function placeMines(firstR, firstC) {
        let placed = 0;
        while (placed < TOTAL_MINES) {
          const r = Math.floor(Math.random() * GRID_SIZE);
          const c = Math.floor(Math.random() * GRID_SIZE);
          if ((r === firstR && c === firstC) || board[r][c].mine) {
            continue;
          }
          board[r][c].mine = true;
          placed++;
        }

        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (board[r][c].mine) continue;
            const neighbors = getNeighbors(r, c);
            board[r][c].count = neighbors.filter(n => n.mine).length;
          }
        }
      }

      function renderBoard() {
        boardEl.innerHTML = '';
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const cell = board[r][c];
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'mina-cell';
            btn.dataset.r = String(r);
            btn.dataset.c = String(c);

            if (cell.revealed) {
              btn.classList.add('mina-cell-revealed');
              if (cell.mine) {
                btn.classList.add('mina-cell-mine');
                if (cell.exploded) {
                  btn.classList.add('mina-cell-exploded');
                  btn.textContent = '💥';
                } else {
                  btn.textContent = '💣';
                }
              } else if (cell.count > 0) {
                btn.classList.add('mina-n' + cell.count);
                btn.textContent = String(cell.count);
              } else {
                btn.textContent = '';
              }
            } else if (cell.flagged) {
              btn.textContent = '🚩';
            } else {
              btn.textContent = '';
            }

            boardEl.appendChild(btn);
          }
        }
      }

      function initGame() {
        stopTimer();
        timerSeconds = 0;
        gameStarted = false;
        gameOver = false;
        gameWon = false;
        flagsCount = 0;
        revealedCount = 0;

        board = [];
        for (let r = 0; r < GRID_SIZE; r++) {
          const row = [];
          for (let c = 0; c < GRID_SIZE; c++) {
            row.push({
              r,
              c,
              mine: false,
              revealed: false,
              flagged: false,
              exploded: false,
              count: 0
            });
          }
          board.push(row);
        }

        if (win && win.setTitle) {
          win.setTitle('Campo Minado');
        }

        faceBtn.textContent = '🙂';
        statusEl.textContent = 'Clique para jogar';
        statusEl.className = 'mina-status';

        updateCounterDisplay();
        updateTimerDisplay();
        renderBoard();
      }

      function revealCell(r, c) {
        const cell = board[r][c];
        if (cell.revealed || cell.flagged || gameOver || gameWon) return;

        if (!gameStarted) {
          gameStarted = true;
          placeMines(r, c);
          startTimer();
          statusEl.textContent = 'Jogo em andamento...';
        }

        cell.revealed = true;
        revealedCount++;

        if (cell.mine) {
          cell.exploded = true;
          gameOver = true;
          stopTimer();
          faceBtn.textContent = '😵';
          statusEl.textContent = '💥 Fim de jogo!';
          statusEl.className = 'mina-status mina-status-lose';

          for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
              if (board[i][j].mine) {
                board[i][j].revealed = true;
              }
            }
          }
          renderBoard();
          if (OS.notify) {
            OS.notify('Fim de jogo! Você acertou uma mina.');
          }
          return;
        }

        if (cell.count === 0) {
          const queue = [[r, c]];
          while (queue.length > 0) {
            const [currR, currC] = queue.shift();
            const neighbors = getNeighbors(currR, currC);
            for (const n of neighbors) {
              if (!n.revealed && !n.flagged && !n.mine) {
                n.revealed = true;
                revealedCount++;
                if (n.count === 0) {
                  queue.push([n.r, n.c]);
                }
              }
            }
          }
        }

        const totalCells = GRID_SIZE * GRID_SIZE;
        if (revealedCount === totalCells - TOTAL_MINES) {
          gameWon = true;
          stopTimer();
          faceBtn.textContent = '😎';
          statusEl.textContent = '🎉 Você venceu!';
          statusEl.className = 'mina-status mina-status-win';

          for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
              if (board[i][j].mine) {
                board[i][j].flagged = true;
              }
            }
          }
          flagsCount = TOTAL_MINES;
          updateCounterDisplay();

          if (OS.notify) {
            OS.notify('Parabéns! Você venceu o Campo Minado!');
          }
        }

        renderBoard();
      }

      function toggleFlag(r, c) {
        if (gameOver || gameWon) return;
        const cell = board[r][c];
        if (cell.revealed) return;

        if (!gameStarted) {
          gameStarted = true;
          placeMines(r, c);
          startTimer();
          statusEl.textContent = 'Jogo em andamento...';
        }

        cell.flagged = !cell.flagged;
        flagsCount += cell.flagged ? 1 : -1;
        updateCounterDisplay();
        renderBoard();
      }

      function handleChording(r, c) {
        const cell = board[r][c];
        if (!cell.revealed || cell.count === 0 || gameOver || gameWon) return;

        const neighbors = getNeighbors(r, c);
        const flaggedCount = neighbors.filter(n => n.flagged).length;

        if (flaggedCount === cell.count) {
          neighbors.forEach(n => {
            if (!n.revealed && !n.flagged) {
              revealCell(n.r, n.c);
            }
          });
        }
      }

      boardEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.mina-cell');
        if (!btn || !boardEl.contains(btn)) return;

        const r = Number(btn.dataset.r);
        const c = Number(btn.dataset.c);

        if (board[r][c].revealed) {
          handleChording(r, c);
        } else {
          revealCell(r, c);
        }
      });

      boardEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const btn = e.target.closest('.mina-cell');
        if (!btn || !boardEl.contains(btn)) return;

        const r = Number(btn.dataset.r);
        const c = Number(btn.dataset.c);
        toggleFlag(r, c);
      });

      boardEl.addEventListener('mousedown', (e) => {
        if (gameOver || gameWon) return;
        const btn = e.target.closest('.mina-cell');
        if (btn && e.button === 0) {
          const r = Number(btn.dataset.r);
          const c = Number(btn.dataset.c);
          if (!board[r][c].revealed && !board[r][c].flagged) {
            faceBtn.textContent = '😮';
          }
        }
      });

      window.addEventListener('mouseup', () => {
        if (!gameOver && !gameWon) {
          faceBtn.textContent = '🙂';
        }
      });

      faceBtn.addEventListener('click', () => {
        initGame();
      });

      initGame();
    }
  });
})();
