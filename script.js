// ============================================
// CONFIG
// ============================================
const GAME_DURATION = 30;   // seconds
const TARGET_SCORE  = 15;   // hearts needed to unlock the letter
const HEART_SPAWN_MS = 550; // ms between spawns
const HEART_EMOJIS = ['💗', '💖', '💕', '💜', '❤️'];
const MOBILE_BREAKPOINT = 820; // px — below this width, treat as "phone"

// PASTE the CSV link from your Google Sheet here (see README, bagian "Ucapan dari teman & keluarga").
// Contoh: 'https://docs.google.com/spreadsheets/d/XXXXXXXX/gviz/tq?tqx=out:csv&sheet=Form%20Responses%201'
const MESSAGES_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1Or2RCkF7vNmRz8d9r3m5m73TeLOiYvNsjozd4x_Sit0/gviz/tq?tqx=out:csv&sheet=Sheet1';

// ============================================
// DEVICE GATE — desktop only
// ============================================
function isMobileDevice() {
  const uaIsMobile = /Android|iPhone|iPad|iPod|Windows Phone|Mobi/i.test(navigator.userAgent);
  const narrowScreen = window.innerWidth < MOBILE_BREAKPOINT;
  // Treat as mobile if the user agent says so, or the viewport is phone/tablet-sized.
  return uaIsMobile || narrowScreen;
}

const isBlocked = isMobileDevice();
if (isBlocked) {
  document.getElementById('scene-gift').classList.remove('is-active');
  document.getElementById('scene-blocked').classList.add('is-active');
  document.getElementById('music-toggle').style.display = 'none';
}

// ============================================
// AMBIENT FLOATING HEARTS (background)
// ============================================
function spawnAmbientHeart() {
  const container = document.getElementById('floating-hearts');
  if (!container) return;
  const heart = document.createElement('span');
  heart.className = 'amb-heart';
  heart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
  const left = Math.random() * 100;
  const duration = 9 + Math.random() * 8;
  const drift = (Math.random() * 80 - 40) + 'px';
  heart.style.left = left + 'vw';
  heart.style.animationDuration = duration + 's';
  heart.style.setProperty('--drift', drift);
  heart.style.fontSize = (1 + Math.random() * 1.2) + 'rem';
  container.appendChild(heart);
  setTimeout(() => heart.remove(), duration * 1000 + 500);
}
if (!isBlocked) {
  setInterval(spawnAmbientHeart, 900);
  for (let i = 0; i < 6; i++) setTimeout(spawnAmbientHeart, i * 300);
}

// ============================================
// SCENE MANAGEMENT
// ============================================
const scenes = {
  gift: document.getElementById('scene-gift'),
  game: document.getElementById('scene-game'),
  letter: document.getElementById('scene-letter'),
  messages: document.getElementById('scene-messages'),
};

function goToScene(name) {
  Object.values(scenes).forEach(s => s.classList.remove('is-active'));
  scenes[name].classList.add('is-active');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

// ============================================
// MUSIC
// ============================================
const bgm = document.getElementById('bgm');
const musicToggle = document.getElementById('music-toggle');
const musicIcon = document.getElementById('music-icon');
let musicStarted = false;

function tryPlayMusic() {
  if (musicStarted) return;
  musicStarted = true;
  bgm.volume = 0.55;
  const playPromise = bgm.play();
  if (playPromise && playPromise.catch) {
    playPromise.then(() => {
      musicToggle.classList.add('is-playing');
      musicIcon.textContent = '♪';
    }).catch(() => {
      // Autoplay blocked or file missing — let the user start it manually.
      musicStarted = false;
      musicToggle.classList.remove('is-playing');
    });
  }
}

musicToggle.addEventListener('click', () => {
  if (bgm.paused) {
    tryPlayMusic();
  } else {
    bgm.pause();
    musicToggle.classList.remove('is-playing');
    musicToggle.classList.add('is-muted');
    musicIcon.textContent = '♪';
  }
  if (!bgm.paused) musicToggle.classList.remove('is-muted');
});

// ============================================
// SCENE 1 -> 2 : OPEN THE GIFT
// ============================================
document.getElementById('open-gift').addEventListener('click', () => {
  tryPlayMusic();
  scenes.gift.classList.add('is-opening');
  setTimeout(() => {
    scenes.gift.classList.remove('is-opening');
    goToScene('game');
  }, 550);
});

// ============================================
// SCENE 2 : CATCH THE HEARTS GAME
// ============================================
const gameArea      = document.getElementById('game-area');
const startHint      = document.getElementById('game-start-hint');
const scoreEl        = document.getElementById('score');
const timerEl        = document.getElementById('timer');
const targetEls      = [document.getElementById('target'), document.getElementById('target2')];
const resultBox       = document.getElementById('game-result');
const resultText       = document.getElementById('game-result-text');
const retryBtn         = document.getElementById('game-retry');
const continueBtn      = document.getElementById('game-continue');

targetEls.forEach(el => { if (el) el.textContent = TARGET_SCORE; });

let score = 0;
let timeLeft = GAME_DURATION;
let spawnInterval = null;
let timerInterval = null;
let gameActive = false;
let gameWon = false;

function resetGameState() {
  score = 0;
  timeLeft = GAME_DURATION;
  gameWon = false;
  scoreEl.textContent = '0';
  timerEl.textContent = String(GAME_DURATION);
  resultBox.classList.add('hidden');
  retryBtn.classList.add('hidden');
  continueBtn.classList.add('hidden');
  gameArea.querySelectorAll('.falling-heart, .plus-pop').forEach(n => n.remove());
}

function startGame() {
  if (gameActive) return;
  resetGameState();
  gameActive = true;
  startHint.classList.add('is-fading');

  spawnInterval = setInterval(spawnFallingHeart, HEART_SPAWN_MS);
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    timerEl.textContent = String(Math.max(timeLeft, 0));
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function spawnFallingHeart() {
  if (!gameActive) return;
  const areaWidth = gameArea.clientWidth;
  const areaHeight = gameArea.clientHeight;

  const btn = document.createElement('button');
  btn.className = 'falling-heart';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Tangkap hati');
  btn.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];

  const size = 1.4 + Math.random() * 1.2; // rem
  btn.style.fontSize = size + 'rem';

  const startX = Math.random() * Math.max(areaWidth - 50, 10);
  btn.style.left = startX + 'px';

  const fallDuration = 3200 + Math.random() * 2200; // ms
  gameArea.appendChild(btn);

  const startTime = performance.now();
  function animate(now) {
    if (!btn.isConnected) return;
    const elapsed = now - startTime;
    const progress = elapsed / fallDuration;
    if (progress >= 1) {
      btn.remove();
      return;
    }
    btn.style.top = (progress * (areaHeight + 60) - 60) + 'px';
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  btn.addEventListener('click', (e) => {
    if (!gameActive) return;
    catchHeart(btn, e);
  });
}

// ============================================
// CATCH SOUND EFFECT (synthesized, no audio file needed)
// ============================================
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playCatchSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.09);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (err) {
    // Web Audio not supported/blocked — fail silently, catching still works visually.
  }
}

function catchHeart(btn, evt) {
  score += 1;
  scoreEl.textContent = String(score);
  playCatchSound();

  const pop = document.createElement('span');
  pop.className = 'plus-pop';
  pop.textContent = '+1';
  pop.style.left = btn.style.left;
  pop.style.top = btn.style.top;
  gameArea.appendChild(pop);
  setTimeout(() => pop.remove(), 750);

  btn.remove();

  if (score >= TARGET_SCORE && gameActive) {
    gameWon = true;
    endGame();
  }
}

function endGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);

  const remainingHearts = gameArea.querySelectorAll('.falling-heart');
  remainingHearts.forEach(h => {
    h.classList.add('is-fading-out');
    h.style.pointerEvents = 'none';
  });
  setTimeout(() => {
    remainingHearts.forEach(h => h.remove());
  }, 500);

  resultBox.classList.remove('hidden');
  if (gameWon) {
    resultText.textContent = `Yeay! ${score} hati tertangkap 💗 kadonya siap dibuka.`;
    continueBtn.classList.remove('hidden');
    retryBtn.classList.add('hidden');
  } else {
    resultText.textContent = `Waktu habis, baru ${score} dari ${TARGET_SCORE} hati. Coba sekali lagi ya?`;
    retryBtn.classList.remove('hidden');
    continueBtn.classList.add('hidden');
  }
}

gameArea.addEventListener('click', () => {
  const hasNotPlayedYet = !gameActive && score === 0 && resultBox.classList.contains('hidden');
  if (hasNotPlayedYet) {
    startGame();
  }
});

retryBtn.addEventListener('click', startGame);

continueBtn.addEventListener('click', () => {
  goToScene('letter');
});

// ============================================
// SCENE 3 -> 4 : GO TO MESSAGES
// ============================================
const goToMessagesBtn = document.getElementById('go-to-messages');
if (goToMessagesBtn) {
  goToMessagesBtn.addEventListener('click', () => {
    goToScene('messages');
    loadMessages();
  });
}

// ============================================
// SCENE 4 : MESSAGES FROM FRIENDS & FAMILY
// ============================================
const messagesSub      = document.getElementById('messages-sub');
const messagesCarousel = document.getElementById('messages-carousel');
const messagesGrid     = document.getElementById('messages-grid');
const messagesEmpty    = document.getElementById('messages-empty');
const messagesError    = document.getElementById('messages-error');
const msgText          = document.getElementById('msg-text');
const msgAuthor        = document.getElementById('msg-author');
const msgPrevBtn       = document.getElementById('msg-prev');
const msgNextBtn       = document.getElementById('msg-next');
const dotsContainer    = document.getElementById('carousel-dots');
const refreshBtn       = document.getElementById('msg-refresh');
const viewToggleBtn    = document.getElementById('view-toggle');
const messagesInner    = document.querySelector('.messages-inner');

let messages = [];
let currentMsgIndex = 0;
let autoAdvanceTimer = null;
let messagesLoaded = false;
let isGridView = false;

// Very small CSV parser — handles quoted fields, commas inside quotes, and "" escaped quotes.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ',') { row.push(field); field = ''; }
      else if (char === '\r') { /* skip */ }
      else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else { field += char; }
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(cell => cell.trim() !== ''));
}

function findColumn(headers, candidates) {
  const lower = headers.map(h => h.trim().toLowerCase());
  for (const candidate of candidates) {
    const idx = lower.indexOf(candidate);
    if (idx !== -1) return idx;
  }
  return -1;
}

async function loadMessages() {
  if (messagesLoaded) return; // already fetched once this session

  messagesSub.textContent = 'memuat ucapan...';
  isGridView = false;
  messagesInner.classList.remove('is-grid-view');
  messagesGrid.classList.add('hidden');
  dotsContainer.classList.remove('hidden');
  messagesCarousel.classList.add('hidden');
  messagesEmpty.classList.add('hidden');
  messagesError.classList.add('hidden');
  dotsContainer.innerHTML = '';

  if (!MESSAGES_SHEET_CSV_URL) {
    messagesSub.textContent = '';
    messagesEmpty.classList.remove('hidden');
    return;
  }

  try {
    const res = await fetch(MESSAGES_SHEET_CSV_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('fetch failed');
    const csvText = await res.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      messagesSub.textContent = '';
      messagesEmpty.classList.remove('hidden');
      return;
    }

    const headers = rows[0];
    const nameIdx = findColumn(headers, ['nama', 'name']);
    const msgIdx  = findColumn(headers, ['pesan', 'ucapan', 'message']);

    messages = rows.slice(1)
      .map(r => ({
        author: (nameIdx !== -1 ? r[nameIdx] : '') || 'Seseorang',
        text: (msgIdx !== -1 ? r[msgIdx] : r[r.length - 1] || '').trim(),
      }))
      .filter(m => m.text.length > 0);

    messagesLoaded = true;

    if (messages.length === 0) {
      messagesSub.textContent = '';
      messagesEmpty.classList.remove('hidden');
      return;
    }

    messagesSub.textContent = `${messages.length} ucapan masuk untukmu 💌`;
    viewToggleBtn.classList.remove('hidden');
    viewToggleBtn.textContent = 'lihat semua sekaligus';
    messagesCarousel.classList.remove('hidden');
    buildDots();
    showMessage(0);
    startAutoAdvance();
  } catch (err) {
    messagesSub.textContent = '';
    messagesError.classList.remove('hidden');
  }
}

function buildDots() {
  dotsContainer.innerHTML = '';
  messages.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'carousel-dot';
    dot.addEventListener('click', () => { showMessage(i); restartAutoAdvance(); });
    dotsContainer.appendChild(dot);
  });
}

function showMessage(index) {
  if (!messages.length) return;
  currentMsgIndex = (index + messages.length) % messages.length;
  const m = messages[currentMsgIndex];
  msgText.textContent = m.text;
  msgAuthor.textContent = '— ' + m.author;
  [...dotsContainer.children].forEach((dot, i) => {
    dot.classList.toggle('is-active', i === currentMsgIndex);
  });
}

function startAutoAdvance() {
  clearInterval(autoAdvanceTimer);
  if (messages.length <= 1) return;
  autoAdvanceTimer = setInterval(() => showMessage(currentMsgIndex + 1), 6000);
}
function restartAutoAdvance() { startAutoAdvance(); }

if (msgPrevBtn) msgPrevBtn.addEventListener('click', () => { showMessage(currentMsgIndex - 1); restartAutoAdvance(); });
function renderGrid() {
  messagesGrid.innerHTML = '';
  messages.forEach((m) => {
    const card = document.createElement('div');
    card.className = 'message-card';

    const text = document.createElement('p');
    text.className = 'message-text';
    text.textContent = m.text;

    const author = document.createElement('p');
    author.className = 'message-author';
    author.textContent = '— ' + m.author;

    card.appendChild(text);
    card.appendChild(author);
    messagesGrid.appendChild(card);
  });
}

function setGridView(showGrid) {
  isGridView = showGrid;

  if (showGrid) {
    clearInterval(autoAdvanceTimer);
    renderGrid();
    messagesCarousel.classList.add('hidden');
    dotsContainer.classList.add('hidden');
    messagesGrid.classList.remove('hidden');
    messagesInner.classList.add('is-grid-view');
    viewToggleBtn.textContent = 'lihat satu-satu';
  } else {
    messagesGrid.classList.add('hidden');
    messagesInner.classList.remove('is-grid-view');
    messagesCarousel.classList.remove('hidden');
    dotsContainer.classList.remove('hidden');
    viewToggleBtn.textContent = 'lihat semua sekaligus';
    showMessage(currentMsgIndex);
    startAutoAdvance();
  }
}

if (viewToggleBtn) {
  viewToggleBtn.addEventListener('click', () => setGridView(!isGridView));
}

if (msgNextBtn) msgNextBtn.addEventListener('click', () => { showMessage(currentMsgIndex + 1); restartAutoAdvance(); });

if (refreshBtn) refreshBtn.addEventListener('click', () => {
  messagesLoaded = false;
  clearInterval(autoAdvanceTimer);
  loadMessages();
});