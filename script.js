
const audio = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, dur, type) {
  if (audio.state === 'suspended') audio.resume();
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.025, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}
function playSlide() {
  if (audio.state === 'suspended') audio.resume();
  const now = audio.currentTime;
  const len = audio.sampleRate * 0.45;
  const buffer = audio.createBuffer(1, len, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.exponentialRampToValueAtTime(1400, now + 0.16);
  filter.frequency.exponentialRampToValueAtTime(280, now + 0.42);
  filter.Q.value = 0.7;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.055, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  noise.start(now);
  noise.stop(now + 0.45);
}
function playBlink() {
  playTone(880, 0.05);
  setTimeout(() => playTone(520, 0.08), 70);
}
function playIntroSounds() {
  playTone(392, 0.28);
  setTimeout(() => playTone(523, 0.28), 700);
  setTimeout(() => playSlide(), 1700);
  setTimeout(playBlink, 3200);
}
document.addEventListener('pointerdown', () => {
  if (audio.state === 'suspended') audio.resume();
}, { once: true });
document.addEventListener('click', (event) => {
  const hit = event.target.closest('button, a, .card');
  if (hit) playTone(540, 0.06);
});
const intro = document.getElementById('intro');
const introName = document.getElementById('intro-name');
const grid = document.getElementById('grid');
const count = document.getElementById('count');

function playIntro() {
  const brand = document.querySelector('.brand');
  const box = brand.getBoundingClientRect();
  introName.style.setProperty('--brand-x', box.left + 'px');
  introName.style.setProperty('--brand-y', box.top + 'px');
  setTimeout(() => { intro.classList.add('move'); introName.classList.add('go'); }, 1700);
  setTimeout(() => {
    document.body.classList.remove('booting');
    document.body.classList.add('ready');
    intro.classList.add('hide');
  }, 2500);
  setTimeout(() => introName.style.display = 'none', 3200);
}
playIntro();
playIntroSounds();

function fileUrl(item) {
  if (!item.file) return '';
  if (item.file.startsWith('http')) return item.file;
  return new URL(item.file, location.href).href;
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).catch(() => copyWithBox(text));
  }
  return copyWithBox(text);
}
function copyWithBox(text) {
  const box = document.createElement('textarea');
  box.value = text;
  box.setAttribute('readonly', '');
  box.style.position = 'fixed';
  box.style.left = '-9999px';
  document.body.appendChild(box);
  box.select();
  const ok = document.execCommand('copy');
  box.remove();
  if (!ok) throw new Error('copy failed');
}
async function copyFile(item, button) {
  button.textContent = 'Copying...';
  try {
    const name = decodeURIComponent(String(item.file || item.name).split('/').pop());
    const res = await fetch('/api/raw?name=' + encodeURIComponent(name) + '&ts=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('read failed');
    await copyText(await res.text());
    button.textContent = 'Copied';
  } catch {
    button.textContent = 'Copy failed';
  }
  setTimeout(() => { button.textContent = 'Copy'; }, 1200);
}

async function deleteFile(item) {
  const key = prompt('Enter the upload key to delete this file');
  if (!key) return;
  const res = await fetch('/api/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, name: item.name, file: item.file })
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) return alert(data.error || 'Delete failed');
  if (Array.isArray(data.files)) return renderFiles(data.files);
  loadFiles();
}

function renderFiles(items) {
    count.textContent = items.length + (items.length === 1 ? ' file' : ' files');
    if (!items.length) {
      grid.innerHTML = '<p class="empty">No files yet.</p>';
      return;
    }
    const wait = document.body.classList.contains('booting') ? 2500 : 0;
    grid.innerHTML = items.map((item, i) => `
      <article class="card ${i % 2 ? 'from-right' : 'from-left'}" style="animation-delay:${wait + i * 180}ms">
        <div class="type">${item.type || 'file'}</div>
        <h3>${item.name}</h3>
        <p>${item.note || 'Click copy'}</p>
        <div class="actions">
          <button type="button" data-copy="${i}">Copy</button>
          <button type="button" class="danger" data-del="${i}">Delete</button>
        </div>
      </article>
    `).join('');
    grid.querySelectorAll('[data-copy]').forEach(button => {
      button.onclick = () => copyFile(items[button.dataset.copy], button);
    });
    grid.querySelectorAll('[data-del]').forEach(button => {
      button.onclick = () => deleteFile(items[button.dataset.del]);
    });
    items.forEach((_, i) => setTimeout(playSlide, wait + i * 180));
}

async function loadFiles() {
  try {
    const res = await fetch('/api/files?ts=' + Date.now(), { cache: 'no-store' });
    renderFiles(await res.json());
  } catch {
    count.textContent = 'Could not load files';
    grid.innerHTML = '<p class="empty">Could not load files.</p>';
  }
}

loadFiles();

document.getElementById('form').onsubmit = async (e) => {
  e.preventDefault();
  const msg = document.getElementById('msg');
  msg.textContent = 'Uploading...';
  const res = await fetch('/api/upload', { method: 'POST', body: new FormData(e.target) });
  const data = await res.json().catch(() => ({}));
  msg.textContent = data.ok ? 'Uploaded.' : 'Failed: ' + (data.error || res.status) + (data.github ? ' | ' + data.github : '');
  if (data.ok) { e.target.reset(); loadFiles(); }
};

document.getElementById('close-pop').onclick = () => {
  document.getElementById('discord-pop').classList.add('hidden');
};

const menu = document.getElementById('menu');
const panel = document.getElementById('panel');
const menuBtn = document.getElementById('menu-btn');
menuBtn.onclick = () => {
  const open = menu.classList.toggle('open');
  menuBtn.classList.toggle('open', open);
  if (!open) panel.classList.remove('open');
};
document.querySelectorAll('.menu-item').forEach(button => {
  button.onclick = () => {
    document.querySelectorAll('.panel-page').forEach(page => page.classList.remove('active'));
    document.getElementById(button.dataset.panel).classList.add('active');
    menu.classList.remove('open');
    menuBtn.classList.remove('open');
    panel.classList.remove('open');
    requestAnimationFrame(() => panel.classList.add('open'));
  };
});
document.getElementById('panel-close').onclick = () => panel.classList.remove('open');

let installEvent = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installEvent = event;
  document.getElementById('install-msg').textContent = 'Ready to install.';
});
document.getElementById('install-app').onclick = async () => {
  playTone(660, 0.08);
  const msg = document.getElementById('install-msg');
  if (!installEvent) {
    msg.textContent = 'Chrome menu, then Install app or Add to Home screen.';
    return;
  }
  installEvent.prompt();
  const choice = await installEvent.userChoice;
  installEvent = null;
  msg.textContent = choice.outcome === 'accepted' ? 'Installed.' : 'Install cancelled.';
};

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

document.addEventListener('wheel', (event) => {
  if (event.ctrlKey) event.preventDefault();
}, { passive: false });
document.addEventListener('gesturestart', (event) => event.preventDefault());

let spam = 0;
let spamTimer;
document.querySelector('.brand').addEventListener('click', (event) => {
  event.preventDefault();
  spam += 1;
  clearTimeout(spamTimer);
  spamTimer = setTimeout(() => { spam = 0; }, 1500);
  if (spam < 8) return;
  spam = 0;
  const scare = document.getElementById('scare');
  scare.classList.add('show');
  playTone(90, 0.18, 'sawtooth');
  setTimeout(() => playTone(180, 0.12, 'square'), 80);
  setTimeout(() => scare.classList.remove('show'), 900);
});
