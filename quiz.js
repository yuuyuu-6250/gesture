// ===== JSON データ読み込み =====
let themes = [];
let bonus3 = [];
let bonus2 = [];

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    themes = data.themes;
    bonus3 = data.bonus3;
    bonus2 = data.bonus2;
  });

// ====== 状態・要素参照 ======
let remainingThemes = [];
let correctCount = 0;
let timeLeft = 120;
let timerInterval = null;
let currentTheme = "";

const themeEl      = document.getElementById("theme");
const timerEl      = document.getElementById("timer");
const resultEl     = document.getElementById("result");
const passInfoEl   = document.getElementById("passInfo");
const errorEl      = document.getElementById("error");
const startBtn     = document.getElementById("startBtn");
const correctBtn   = document.getElementById("correctBtn");
const passBtn      = document.getElementById("passBtn");

// ===== パスのクールダウン =====
const PASS_COOLDOWN = 5; // 秒
let passReady = true;
let passCooldownInterval = null;
let passCooldownRemaining = 0;

function startPassCooldown() {
  passReady = false;
  passBtn.disabled = true;
  passCooldownRemaining = PASS_COOLDOWN;
  updatePassUI();
  passBtn.textContent = `パス（${passCooldownRemaining}）`;
  if (passCooldownInterval) clearInterval(passCooldownInterval);

  passCooldownInterval = setInterval(() => {
    passCooldownRemaining--;
    if (passCooldownRemaining <= 0) {
      clearInterval(passCooldownInterval);
      passCooldownInterval = null;
      passReady = true;
      passBtn.disabled = false;
      passBtn.textContent = "パス";
      passInfoEl.textContent = "";
    } else {
      updatePassUI();
      passBtn.textContent = `パス（${passCooldownRemaining}）`;
    }
  }, 1000);
}
function resetPassCooldown() {
  if (passCooldownInterval) { clearInterval(passCooldownInterval); passCooldownInterval = null; }
  passReady = true; passBtn.disabled = false; passBtn.textContent = "パス"; passInfoEl.textContent = "";
}
function updatePassUI() {
  passInfoEl.textContent = `⏳ 次のパスまで ${passCooldownRemaining}秒`;
}

// ===== 正解のクールダウン（1秒・非表示）=====
const CORRECT_COOLDOWN_MS = 1000;
let correctReady = true;
let correctCooldownTimer = null;

function startCorrectCooldown() {
  correctReady = false;
  correctBtn.disabled = true;
  if (correctCooldownTimer) clearTimeout(correctCooldownTimer);
  correctCooldownTimer = setTimeout(() => {
    correctReady = true;
    correctBtn.disabled = false;
    correctCooldownTimer = null;
  }, CORRECT_COOLDOWN_MS);
}
function resetCorrectCooldown() {
  if (correctCooldownTimer) { clearTimeout(correctCooldownTimer); correctCooldownTimer = null; }
  correctReady = true; correctBtn.disabled = false;
}

// エラー表示
window.onerror = function(msg, src, line, col) {
  errorEl.textContent = `エラー: ${msg} @${line}:${col}`;
};

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerEl.textContent = `残り時間: ${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function startGame() {
  try {
    correctCount = 0;
    timeLeft = 120;
    remainingThemes = [...themes];
    resultEl.textContent = "";
    errorEl.textContent  = "";
    startBtn.disabled = true;
    resetPassCooldown();
    resetCorrectCooldown();
    nextTheme();
    updateTimer();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimer();
      if (timeLeft <= 0) { clearInterval(timerInterval); endGame(); }
    }, 1000);
  } catch (e) { errorEl.textContent = `エラー: ${e.message}`; }
}

function nextTheme() {
  if (remainingThemes.length === 0) {
    themeEl.classList.remove("bonus3","bonus2");
    themeEl.textContent = "🎉 全てのお題を出し切りました！";
    return;
  }
  const index = Math.floor(Math.random() * remainingThemes.length);
  currentTheme = remainingThemes.splice(index, 1)[0];
  themeEl.classList.remove("bonus3","bonus2");

  if (bonus3.includes(currentTheme)) {
    themeEl.textContent = currentTheme + " 🎁 ボーナス問題！（3点）";
    themeEl.classList.add("bonus3");
  } else if (bonus2.includes(currentTheme)) {
    themeEl.textContent = currentTheme + " 🎁 ボーナス問題！（2点）";
    themeEl.classList.add("bonus2");
  } else {
    themeEl.textContent = currentTheme;
  }
  correctBtn.disabled = !correctReady;
  passBtn.disabled = !passReady;
}

function correctAnswer() {
  if (!correctReady) return;

  // 得点加算
  if (bonus3.includes(currentTheme)) correctCount += 3;
  else if (bonus2.includes(currentTheme)) correctCount += 2;
  else correctCount += 1;

  startCorrectCooldown(); // 連打防止

  // --- カウントダウン中は操作禁止 ---
  correctBtn.disabled = true;
  passBtn.disabled = true;

  let countdown = 3;
  themeEl.classList.remove("bonus3", "bonus2");
  themeEl.textContent = `✅ 正解！ 次のお題まで ${countdown}秒`;

  let countdownInterval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      themeEl.textContent = `✅ 正解！ 次のお題まで ${countdown}秒`;
    } else {
      clearInterval(countdownInterval);
      nextTheme();
      // --- 次のお題を出したあと操作可能に戻す ---
      correctBtn.disabled = !correctReady;
      passBtn.disabled = !passReady;
    }
  }, 1000);
}


function passTheme() {
  if (!passReady) return;
  nextTheme();
  startPassCooldown();
}

function endGame() {
  themeEl.classList.remove("bonus3","bonus2");
  themeEl.textContent = "タイムアップ！";
  resultEl.textContent = `✅ 得点: ${correctCount}点`;
  startBtn.disabled = false;
  correctBtn.disabled = true;
  passBtn.disabled = true;
  resetPassCooldown();
  resetCorrectCooldown();
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

// イベント登録
startBtn.addEventListener("click", startGame);
correctBtn.addEventListener("click", correctAnswer);
passBtn.addEventListener("click", passTheme);
