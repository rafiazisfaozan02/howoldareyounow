const MESSAGES_SUBMIT_URL = 'https://script.google.com/macros/s/AKfycbxM0fStQREN8aVqqpJQYnhiisIeX6Q7O8cx6Y1F0nR8j3FtiDnwgS6YPuoO--Clwyn92w/exec';
const bgm = document.getElementById('bgm');
const musicToggle = document.getElementById('music-toggle');
const musicIcon = document.getElementById('music-icon');
let musicStarted = false;

function tryPlayMusic() {
  if (musicStarted) return;
  musicStarted = true;
  bgm.volume = 0.5;
  const playPromise = bgm.play();
  if (playPromise && playPromise.catch) {
    playPromise.then(() => {
      musicToggle.classList.add('is-playing');
    }).catch(() => {
      musicStarted = false;
      musicToggle.classList.remove('is-playing');
    });
  }
}
musicToggle.addEventListener('click', () => {
  if (bgm.paused) {
    tryPlayMusic();
    musicToggle.classList.remove('is-muted');
  } else {
    bgm.pause();
    musicToggle.classList.remove('is-playing');
    musicToggle.classList.add('is-muted');
  }
});
document.addEventListener('click', tryPlayMusic, { once: true });
// ============================================
// AMBIENT FLOATING HEARTS
// ============================================
const HEART_EMOJIS = ['💗'];

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
  heart.style.fontSize = (1 + Math.random() * 4) + 'rem';
  container.appendChild(heart);
  setTimeout(() => heart.remove(), duration * 1000 + 500);
}
setInterval(spawnAmbientHeart, 350);
for (let i = 0; i < 25; i++) setTimeout(spawnAmbientHeart, i * 300);

// ============================================
// FORM
// ============================================
const form         = document.getElementById('submit-form');
const namaInput    = document.getElementById('field-nama');
const pesanInput   = document.getElementById('field-pesan');
const charCountNum = document.getElementById('char-count-num');
const submitBtn    = document.getElementById('submit-btn');
const submitLabel  = document.getElementById('submit-btn-label');
const successBox   = document.getElementById('submit-success');
const errorBox     = document.getElementById('submit-error');
const sendAnotherBtn = document.getElementById('send-another');
const tryAgainBtn    = document.getElementById('try-again');

pesanInput.addEventListener('input', () => {
  charCountNum.textContent = String(pesanInput.value.length);
});

// ============================================
// FADE HELPERS 
// ============================================
const FADE_MS = 350;

function fadeOut(el) {
  return new Promise((resolve) => {
    if (el.classList.contains('hidden')) { resolve(); return; }
    el.classList.add('is-fading-out');
    setTimeout(() => {
      el.classList.add('hidden');
      el.classList.remove('is-fading-out');
      resolve();
    }, FADE_MS);
  });
}

function fadeIn(el) {
  el.classList.remove('hidden');
  el.classList.add('is-fading-out'); 
  void el.offsetWidth;               
  el.classList.remove('is-fading-out');
}

async function showForm() {
  await Promise.all([fadeOut(successBox), fadeOut(errorBox)]);
  fadeIn(form);
}

async function showSuccess() {
  await fadeOut(form);
  await fadeOut(errorBox);
  fadeIn(successBox);
}

async function showError() {
  await fadeOut(errorBox);
  fadeIn(errorBox);
}

function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  submitLabel.textContent = isSubmitting ? 'mengirim...' : 'kirim ucapan';
}
requestAnimationFrame(() => fadeIn(form));

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nama = namaInput.value.trim();
  const pesan = pesanInput.value.trim();
  if (!nama || !pesan) return;

  if (!MESSAGES_SUBMIT_URL) {
    alert('Fitur kirim ucapan belum di-setup pemilik web ini (MESSAGES_SUBMIT_URL kosong di kirim-ucapan.js).');
    return;
  }

  setSubmitting(true);
  errorBox.classList.add('hidden');

  try {
    const res = await fetch(MESSAGES_SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ nama, pesan }),
    });

    if (!res.ok) throw new Error('bad status');
    const data = await res.json().catch(() => ({ status: 'success' }));

    if (data.status === 'error') throw new Error(data.message || 'unknown error');

    await showSuccess();
    form.reset();
    charCountNum.textContent = '0';
  } catch (err) {
    showError();
  } finally {
    setSubmitting(false);
  }
});

sendAnotherBtn.addEventListener('click', showForm);
tryAgainBtn.addEventListener('click', () => {
  fadeOut(errorBox);
});