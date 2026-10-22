
const audio = new (window.AudioContext || window.webkitAudioContext)();
const settings = JSON.parse(localStorage.getItem('mdc-settings') || '{"fx":true,"sound":true,"theme":"dark"}');
function saveSettings() { localStorage.setItem('mdc-settings', JSON.stringify(settings)); }
function applySettings() {
  document.body.classList.toggle('no-fx', !settings.fx);
  document.body.dataset.theme = settings.theme || 'dark';
}
applySettings();
const themeSounds = {
  dark: { wave: 'sine', click: 540, intro: [392, 523], slide: 1 },
  ios: { wave: 'sine', click: 660, intro: [523, 784], slide: 0.6 },
  light: { wave: 'sine', click: 620, intro: [440, 554], slide: 0.7 },
  blue: { wave: 'triangle', click: 500, intro: [349, 466], slide: 1 },
  minecraft: { wave: 'square', click: 392, intro: [349, 440], slide: 0.6 },
  roblox: { wave: 'square', click: 330, intro: [262, 330], slide: 0.8 },
  mario: { wave: 'square', click: 988, intro: [660, 880], slide: 0.5 },
  sonic: { wave: 'square', click: 1175, intro: [784, 1047], slide: 0.7 },
  pokemon: { wave: 'triangle', click: 740, intro: [523, 659], slide: 0.8 },
  fortnite: { wave: 'sawtooth', click: 220, intro: [196, 247], slide: 1.1 },
  amongus: { wave: 'sine', click: 466, intro: [392, 494], slide: 0.9 },
  zelda: { wave: 'triangle', click: 784, intro: [523, 659], slide: 0.7 },
  geometry: { wave: 'square', click: 880, intro: [440, 880], slide: 1.3 },
  brawl: { wave: 'triangle', click: 698, intro: [523, 784], slide: 0.8 },
  glitch: { wave: 'sawtooth', click: 140, intro: [90, 880], slide: 1.6 }
};
function soundPack() { return themeSounds[settings.theme] || themeSounds.dark; }
function playTone(freq, dur, type) {
  if (!settings.sound) return;
  if (audio.state === 'suspended') audio.resume();
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type || soundPack().wave;
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
  if (!settings.sound) return;
  if (audio.state === 'suspended') audio.resume();
  const pack = soundPack();
  const now = audio.currentTime;
  const len = audio.sampleRate * 0.45;
  const buffer = audio.createBuffer(1, len, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(280 * pack.slide, now);
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
  const introPack = soundPack();
  playTone(introPack.intro[0], 0.28);
  setTimeout(() => playTone(introPack.intro[1], 0.28), 700);
  setTimeout(() => playSlide(), 1700);
  setTimeout(playBlink, 3200);
}
document.addEventListener('pointerdown', () => {
  if (audio.state === 'suspended') audio.resume();
}, { once: true });
function note(freq, at, dur, type) {
  if (!settings.sound) return;
  if (audio.state === 'suspended') audio.resume();
  const now = audio.currentTime + at;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}
function creak() {
  if (!settings.sound) return;
  const now = audio.currentTime;
  const len = audio.sampleRate * 0.35;
  const buffer = audio.createBuffer(1, len, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(180, now);
  filter.frequency.exponentialRampToValueAtTime(900, now + 0.22);
  filter.Q.value = 4;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  src.start(now);
  src.stop(now + 0.35);
}
function playThemeOpen() {
  const theme = settings.theme || 'dark';
  if (theme === 'minecraft') { creak(); note(196, 0, 0.12, 'square'); return; }
  if (theme === 'roblox') { note(240, 0, 0.08, 'sawtooth'); note(160, 0.08, 0.14, 'sawtooth'); return; }
  if (theme === 'mario') { note(988, 0, 0.08, 'square'); note(1319, 0.08, 0.16, 'square'); return; }
  if (theme === 'sonic') { note(1175, 0, 0.1, 'sine'); note(1568, 0.08, 0.14, 'sine'); return; }
  if (theme === 'pokemon') { note(523, 0, 0.08, 'triangle'); note(659, 0.08, 0.08, 'triangle'); note(784, 0.16, 0.12, 'triangle'); return; }
  if (theme === 'fortnite') { creak(); note(880, 0.05, 0.12, 'sine'); return; }
  if (theme === 'amongus') { note(466, 0, 0.1, 'sine'); note(587, 0.1, 0.12, 'sine'); return; }
  if (theme === 'zelda') { note(523, 0, 0.1, 'triangle'); note(659, 0.1, 0.1, 'triangle'); note(784, 0.2, 0.1, 'triangle'); note(1046, 0.3, 0.18, 'triangle'); return; }
  if (theme === 'geometry') { note(880, 0, 0.05, 'square'); note(440, 0.05, 0.08, 'square'); return; }
  if (theme === 'brawl') { note(698, 0, 0.08, 'triangle'); note(880, 0.07, 0.1, 'triangle'); return; }
  if (theme === 'glitch') { note(90, 0, 0.08, 'sawtooth'); note(700, 0.06, 0.05, 'square'); return; }
  playTone(soundPack().click, 0.08);
}
function playThemeClick() {
  const theme = settings.theme || 'dark';
  if (theme === 'minecraft') { note(349, 0, 0.06, 'square'); return; }
  if (theme === 'roblox') { note(330, 0, 0.06, 'square'); return; }
  if (theme === 'mario') { note(784, 0, 0.05, 'square'); return; }
  if (theme === 'sonic') { note(1047, 0, 0.05, 'sine'); return; }
  if (theme === 'pokemon') { note(659, 0, 0.06, 'triangle'); return; }
  if (theme === 'fortnite') { note(520, 0, 0.05, 'sine'); return; }
  if (theme === 'amongus') { note(494, 0, 0.06, 'sine'); return; }
  if (theme === 'zelda') { note(784, 0, 0.06, 'triangle'); return; }
  if (theme === 'geometry') { note(880, 0, 0.04, 'square'); return; }
  if (theme === 'brawl') { note(740, 0, 0.05, 'triangle'); return; }
  playTone(soundPack().click, 0.06);
}
document.addEventListener('click', (event) => {
  const hit = event.target.closest('button, a, .card');
  if (!hit || hit.id === 'menu-btn') return;
  playThemeClick();
});
const intro = document.getElementById('intro');
const introName = document.getElementById('intro-name');
const grid = document.getElementById('grid');
const count = document.getElementById('count');

function playIntro() {
  if (!settings.fx) {
    document.body.classList.remove('booting');
    document.body.classList.add('ready');
    intro.classList.add('hide');
    introName.style.display = 'none';
    return;
  }
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

function esc(value) {
  return String(value || '').replace(/[&<>"']/g, (s) => ({
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#39;'
  }[s]));
}
function renderFiles(items) {
    window.mdcFiles = items;
    count.textContent = items.length + (items.length === 1 ? ' file' : ' files');
    if (!items.length) {
      grid.innerHTML = '<p class="empty">No files yet.</p>';
      return;
    }
    grid.innerHTML = items.map((item, i) => `
      <article class="card">
        <div class="type">${item.type || 'file'}</div>
        <h3>${item.name}</h3>
        <p>${item.note || 'Click copy'}</p>
        <div class="actions">
          <button type="button" data-copy="${i}">Copy</button>
          <button type="button" class="danger" data-del="${i}">Delete</button>
        </div>
        <div class="react">
          <button type="button" class="like ${(item.likedBy || []).includes(window.mdcUser && window.mdcUser.id) ? 'on' : ''}" data-like="${i}">${(item.likedBy || []).includes(window.mdcUser && window.mdcUser.id) ? 'Unlike' : 'Like'} ${item.likes || 0}</button>
          <button type="button" data-comments="${i}">Comments ${(item.comments || []).length}</button>
        </div>
      </article>
    `).join('');
    grid.querySelectorAll('[data-copy]').forEach(button => {
      button.onclick = () => copyFile(items[button.dataset.copy], button);
    });
    grid.querySelectorAll('[data-del]').forEach(button => {
      button.onclick = () => deleteFile(items[button.dataset.del]);
    });
    grid.querySelectorAll('[data-like]').forEach(button => {
      button.onclick = () => likeFile(items[button.dataset.like], button);
    });
    grid.querySelectorAll('[data-comments]').forEach(button => {
      button.onclick = () => openComments(items[button.dataset.comments]);
    });
}
let commentItem = null;
function openComments(item) {
  commentItem = item;
  document.getElementById('comment-title').textContent = item.name;
  const list = document.getElementById('comment-list');
  const comments = item.comments || [];
  list.innerHTML = comments.length ? comments.map(c => '<div class="comment"><strong>' + esc(c.name) + '</strong><span>' + esc(c.text) + '</span></div>').join('') : '<p>No comments yet.</p>';
  document.querySelectorAll('.panel-page').forEach(page => page.classList.remove('active'));
  document.getElementById('comments').classList.add('active');
  menu.classList.remove('open');
  menuBtn.classList.remove('open');
  panel.classList.add('open');
}
async function likeFile(item, button) {
  if (!window.mdcUser) return alert('Login with Discord first.');
  const res = await fetch('/api/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: item.name }) });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) return alert(data.error || 'Like failed');
  button.classList.toggle('on', data.on);
  button.textContent = (data.on ? 'Unlike ' : 'Like ') + data.likes;
}
document.getElementById('comment-form').onsubmit = async (event) => {
  event.preventDefault();
  if (!window.mdcUser) return alert('Login with Discord first.');
  if (!commentItem) return;
  const form = event.target;
  const res = await fetch('/api/comment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: commentItem.name, text: form.text.value }) });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) return alert(data.error || 'Comment failed');
  form.reset();
  const name = commentItem.name;
  await loadFiles();
  const fresh = (window.mdcFiles || []).find(item => item.name === name);
  if (fresh) openComments(fresh);
};

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
  if (open) playThemeOpen();
  if (!open) panel.classList.remove('open');
};
document.querySelectorAll('.menu-item').forEach(button => {
  button.onclick = () => {
    document.querySelectorAll('.panel-page').forEach(page => page.classList.remove('active'));
    document.getElementById(button.dataset.panel).classList.add('active');
    if (button.dataset.panel === 'status') loadStatus();
    menu.classList.remove('open');
    menuBtn.classList.remove('open');
    panel.classList.remove('open');
    requestAnimationFrame(() => panel.classList.add('open'));
  };
});
document.getElementById('panel-close').onclick = () => panel.classList.remove('open');
document.getElementById('panel-back').onclick = () => {
  panel.classList.remove('open');
  menu.classList.add('open');
  menuBtn.classList.add('open');
};
async function loadStatus() {
  const box = document.getElementById('status-list');
  box.textContent = 'Checking...';
  const started = performance.now();
  let data = { site: 'online', bot: 'unknown' };
  try {
    const res = await fetch('/api/status?ts=' + Date.now(), { cache: 'no-store' });
    data = await res.json();
  } catch {}
  const ms = Math.round(performance.now() - started);
  box.innerHTML = [
    ['Site', data.site || 'online'],
    ['Bot', data.bot || 'unknown'],
    ['Response', ms + ' ms']
  ].map(row => '<div class="status-row"><span>' + row[0] + '</span><strong>' + row[1] + '</strong></div>').join('');
  document.querySelector('.dot').textContent = data.bot === 'online' ? '🟢' : '🔴';
}
document.getElementById('status-btn').onclick = () => {
  document.querySelectorAll('.panel-page').forEach(page => page.classList.remove('active'));
  document.getElementById('status').classList.add('active');
  menu.classList.remove('open');
  menuBtn.classList.remove('open');
  panel.classList.add('open');
  loadStatus();
};

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

const fxToggle = document.getElementById('fx-toggle');
const soundToggle = document.getElementById('sound-toggle');
fxToggle.checked = settings.fx !== false;
soundToggle.checked = settings.sound !== false;
fxToggle.onchange = () => { settings.fx = fxToggle.checked; saveSettings(); applySettings(); };
soundToggle.onchange = () => { settings.sound = soundToggle.checked; saveSettings(); };
const themeBtn = document.getElementById('theme-btn');
const themePicker = document.getElementById('theme-picker');
const themeList = document.getElementById('theme-list');
const glitchOpt = themeList.querySelector('[data-theme="glitch"]');
if (settings.glitch) glitchOpt.hidden = false;
function themeLabel(value) {
  const btn = themeList.querySelector('[data-theme="' + value + '"]');
  return btn ? btn.textContent : 'Dark';
}
function setTheme(value) {
  settings.theme = value;
  saveSettings();
  applySettings();
  themeBtn.textContent = themeLabel(value);
  themeList.querySelectorAll('button').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === value));
}
setTheme(settings.theme || 'dark');
let themeFlips = 0;
themeBtn.onclick = () => {
  const open = themePicker.classList.toggle('open');
  if (!open) {
    themeFlips += 1;
    if (themeFlips >= 5 && !settings.glitch) {
      settings.glitch = true;
      saveSettings();
      glitchOpt.hidden = false;
      setTheme('glitch');
    }
  }
};
themeList.querySelectorAll('button').forEach(btn => {
  btn.onclick = () => {
    setTheme(btn.dataset.theme);
    themePicker.classList.remove('open');
  };
});

async function loadMe() {
  const res = await fetch('/api/me');
  const data = await res.json().catch(() => ({}));
  window.mdcUser = data.user;
  const btn = document.getElementById('login-btn');
  btn.textContent = data.user ? data.user.username : 'Login';
  btn.onclick = () => {
    if (!data.user) return location.href = '/api/auth/discord';
    const box = document.getElementById('account-box');
    const avatar = data.user.avatar ? 'https://cdn.discordapp.com/avatars/' + data.user.id + '/' + data.user.avatar + '.png' : '';
    box.innerHTML = (avatar ? '<img src="' + avatar + '" alt="">' : '') + '<strong>' + esc(data.user.username) + '</strong><span>Discord ID: ' + esc(data.user.id) + '</span>';
    document.querySelectorAll('.panel-page').forEach(page => page.classList.remove('active'));
    document.getElementById('account').classList.add('active');
    menu.classList.remove('open');
    menuBtn.classList.remove('open');
    panel.classList.add('open');
  };
}
loadMe();
