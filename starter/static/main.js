// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const DIFFICULTY_TO_CLUES = {
  easy: 40,
  medium: 35,
  hard: 30,
};
const LEADERBOARD_STORAGE_KEY = 'sudokuLeaderboard';
const THEME_STORAGE_KEY = 'sudokuTheme';
let puzzle = [];
let selectedDifficulty = 'medium';
let timerInterval = null;
let elapsedSeconds = 0;
let hintsUsed = 0;
let currentGameSaved = false;
let currentTheme = 'light';

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const timer = document.getElementById('timer');
  if (timer) {
    timer.textContent = formatTime(elapsedSeconds);
  }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  stopTimer();
  elapsedSeconds = 0;
  updateTimerDisplay();
}

function loadLeaderboard() {
  try {
    const storedScores = JSON.parse(localStorage.getItem(LEADERBOARD_STORAGE_KEY) || '[]');
    return Array.isArray(storedScores) ? storedScores : [];
  } catch (error) {
    return [];
  }
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  currentTheme = theme;
  document.body.classList.toggle('dark-mode', isDark);

  const toggleButton = document.getElementById('theme-toggle');
  if (toggleButton) {
    toggleButton.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    toggleButton.setAttribute('aria-pressed', String(isDark));
    toggleButton.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function getSystemThemePreference() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function restoreThemePreference() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') {
    applyTheme(savedTheme);
    return;
  }

  applyTheme(getSystemThemePreference());
}

function toggleTheme() {
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
}

function renderLeaderboard() {
  const leaderboardList = document.getElementById('leaderboard-list');
  if (!leaderboardList) {
    return;
  }

  const scores = loadLeaderboard().sort((a, b) => a.time - b.time || a.hintsUsed - b.hintsUsed || String(a.playerName).localeCompare(String(b.playerName)));
  leaderboardList.innerHTML = '';

  if (!scores.length) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'No scores yet';
    leaderboardList.appendChild(emptyItem);
    return;
  }

  scores.slice(0, 10).forEach((score, index) => {
    const item = document.createElement('li');
    item.textContent = `${index + 1}. ${score.playerName} - ${formatTime(score.time)} - ${score.difficulty} - Hints: ${score.hintsUsed}`;
    leaderboardList.appendChild(item);
  });
}

function saveLeaderboardEntry(entry) {
  const scores = loadLeaderboard();
  scores.push(entry);
  const topScores = scores
    .sort((a, b) => a.time - b.time || a.hintsUsed - b.hintsUsed || String(a.playerName).localeCompare(String(b.playerName)))
    .slice(0, 10);
  localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(topScores));
  renderLeaderboard();
}

function startTimer() {
  stopTimer();
  elapsedSeconds = 0;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    elapsedSeconds += 1;
    updateTimerDisplay();
  }, 1000);
}

function getBoardFromDom() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

  for (let idx = 0; idx < inputs.length; idx++) {
    const input = inputs[idx];
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    const value = input.value.trim();
    board[row][col] = value ? parseInt(value, 10) : 0;
  }

  return board;
}

function getRegionClass(row, col) {
  return (Math.floor(row / 3) + Math.floor(col / 3)) % 2 === 0 ? 'sudoku-region-a' : 'sudoku-region-b';
}

function applyCellState(input, stateClass = '') {
  const row = Number(input.dataset.row);
  const col = Number(input.dataset.col);
  input.className = 'sudoku-cell';
  input.classList.add(getRegionClass(row, col));
  if (stateClass) {
    input.classList.add(stateClass);
  }
}

function getHintTarget() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');

  for (let idx = 0; idx < inputs.length; idx++) {
    const input = inputs[idx];
    const isActive = document.activeElement === input;
    const isEditable = !input.disabled && !input.classList.contains('prefilled');
    const isEmpty = !input.value.trim();
    if (isActive && isEditable && isEmpty) {
      return {
        row: Number(input.dataset.row),
        col: Number(input.dataset.col),
      };
    }
  }

  for (let idx = 0; idx < inputs.length; idx++) {
    const input = inputs[idx];
    const isEditable = !input.disabled && !input.classList.contains('prefilled');
    const isEmpty = !input.value.trim();
    if (isEditable && isEmpty) {
      return {
        row: Number(input.dataset.row),
        col: Number(input.dataset.col),
      };
    }
  }

  return null;
}

function isCellConflicting(board, row, col, value) {
  if (!value || value === 0) {
    return false;
  }

  for (let i = 0; i < SIZE; i++) {
    if (i !== col && board[row][i] === value) {
      return true;
    }
  }

  for (let i = 0; i < SIZE; i++) {
    if (i !== row && board[i][col] === value) {
      return true;
    }
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const nextRow = startRow + i;
      const nextCol = startCol + j;
      if ((nextRow !== row || nextCol !== col) && board[nextRow][nextCol] === value) {
        return true;
      }
    }
  }

  return false;
}

function updateBoardValidity() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = getBoardFromDom();

  for (let idx = 0; idx < inputs.length; idx++) {
    const input = inputs[idx];

    if (input.disabled) {
      input.classList.remove('invalid');
      continue;
    }

    const value = input.value.trim();
    if (!value) {
      input.classList.remove('invalid');
      continue;
    }

    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    const parsedValue = parseInt(value, 10);
    if (isCellConflicting(board, row, col, parsedValue)) {
      input.classList.add('invalid');
    } else {
      input.classList.remove('invalid');
    }
  }
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.classList.add(getRegionClass(i, j));
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        updateBoardValidity();
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = String(val);
        inp.disabled = true;
        applyCellState(inp, 'prefilled');
      } else {
        inp.value = '';
        inp.disabled = false;
        applyCellState(inp);
      }
    }
  }
}

async function newGame() {
  const clues = DIFFICULTY_TO_CLUES[selectedDifficulty];
  resetTimer();
  hintsUsed = 0;
  currentGameSaved = false;
  const res = await fetch(`/new?clues=${clues}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
  document.getElementById('message').innerText = '';
  startTimer();
}

function setDifficulty(difficulty) {
  selectedDifficulty = difficulty;
  document.querySelectorAll('.difficulty-btn').forEach((button) => {
    const isActive = button.dataset.difficulty === difficulty;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }

  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    applyCellState(inp);
    if (incorrect.has(idx)) {
      inp.classList.add('incorrect');
    }
  }

  if (data.solved) {
    stopTimer();

    if (!currentGameSaved) {
      const enteredName = window.prompt('Enter your name for the leaderboard', 'Player');
      const playerName = String(enteredName ?? '').trim() || 'Player';
      saveLeaderboardEntry({
        playerName,
        time: elapsedSeconds,
        difficulty: selectedDifficulty,
        hintsUsed,
      });
      currentGameSaved = true;
    }

    msg.style.color = '#388e3c';
    msg.innerText = 'Congratulations! You solved it!';
    for (let idx = 0; idx < inputs.length; idx++) {
      const inp = inputs[idx];
      if (!inp.disabled) {
        inp.disabled = true;
      }
    }
    return;
  }

  msg.style.color = '#d32f2f';
  msg.innerText = 'Some cells are incorrect.';
}

async function requestHint() {
  const target = getHintTarget();
  const msg = document.getElementById('message');

  if (!target) {
    msg.style.color = '#d32f2f';
    msg.innerText = 'No empty cells remain.';
    return;
  }

  const board = getBoardFromDom();
  const res = await fetch('/hint', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      board,
      row: target.row,
      col: target.col,
    }),
  });
  const data = await res.json();

  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }

  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const idx = target.row * SIZE + target.col;
  const input = inputs[idx];

  input.value = String(data.value);
  input.disabled = true;
  applyCellState(input, 'hinted');
  hintsUsed += 1;
  updateBoardValidity();

  msg.style.color = '#388e3c';
  msg.innerText = 'Hint applied.';
}

// Wire buttons
window.addEventListener('load', () => {
  restoreThemePreference();
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('hint-button').addEventListener('click', requestHint);
  document.querySelectorAll('.difficulty-btn').forEach((button) => {
    button.addEventListener('click', () => {
      setDifficulty(button.dataset.difficulty);
      newGame();
    });
  });
  setDifficulty(selectedDifficulty);
  // initialize
  newGame();
});