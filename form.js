// PASTE the Apps Script "Web app" URL here (see README, bagian "Ucapan dari teman & keluarga").
// Contoh: 'https://script.google.com/macros/s/XXXXXXXXXXXX/exec'
const MESSAGES_SUBMIT_URL = '';

// ============================================
// AMBIENT FLOATING HEARTS (same visual as main site)
// ============================================
const HEART_EMOJIS = ['💗', '💖', '💕', '💜', '❤️'];

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
setInterval(spawnAmbientHeart, 900);
for (let i = 0; i < 6; i++) setTimeout(spawnAmbientHeart, i * 300);

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

function showForm() {
  form.classList.remove('hidden');
  successBox.classList.add('hidden');
  errorBox.classList.add('hidden');
}

function showSuccess() {
  form.classList.add('hidden');
  successBox.classList.remove('hidden');
  errorBox.classList.add('hidden');
}

function showError() {
  errorBox.classList.remove('hidden');
}

function setSubmitting(isSubmitting) {
  submitBtn.disabled = isSubmitting;
  submitLabel.textContent = isSubmitting ? 'mengirim...' : 'kirim ucapan';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nama = namaInput.value.trim();
  const pesan = pesanInput.value.trim();
  if (!nama || !pesan) return;

  if (!MESSAGES_SUBMIT_URL) {
    // Not configured yet — tell the site owner, not the guest, what's wrong.
    alert('Fitur kirim ucapan belum di-setup pemilik web ini (MESSAGES_SUBMIT_URL kosong di kirim-ucapan.js).');
    return;
  }

  setSubmitting(true);
  errorBox.classList.add('hidden');

  try {
    // text/plain content-type avoids a CORS preflight that Apps Script can't handle,
    // so we can read the actual JSON response back.
    const res = await fetch(MESSAGES_SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ nama, pesan }),
    });

    if (!res.ok) throw new Error('bad status');
    const data = await res.json().catch(() => ({ status: 'success' }));

    if (data.status === 'error') throw new Error(data.message || 'unknown error');

    showSuccess();
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
  errorBox.classList.add('hidden');
});