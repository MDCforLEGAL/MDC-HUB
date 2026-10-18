const intro = document.getElementById('intro');
const grid = document.getElementById('grid');
const count = document.getElementById('count');

setTimeout(() => intro.classList.add('hide'), 1900);

function fileUrl(item) {
  if (!item.file) return '';
  if (item.file.startsWith('http')) return item.file;
  return new URL(item.file, location.href).href;
}

async function copyFile(item, button) {
  button.textContent = 'Copying...';
  try {
    const res = await fetch(fileUrl(item), { cache: 'no-store' });
    if (!res.ok) throw new Error('read failed');
    await navigator.clipboard.writeText(await res.text());
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
    grid.innerHTML = items.map((item, i) => `
      <article class="card" style="animation-delay:${0.08 * i}s">
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
document.getElementById('menu-btn').onclick = () => {
  menu.classList.toggle('open');
  if (!menu.classList.contains('open')) panel.classList.remove('open');
};
document.querySelectorAll('.menu-item').forEach(button => {
  button.onclick = () => {
    document.querySelectorAll('.panel-page').forEach(page => page.classList.remove('active'));
    document.getElementById(button.dataset.panel).classList.add('active');
    panel.classList.add('open');
    menu.classList.remove('open');
  };
});
document.getElementById('panel-close').onclick = () => panel.classList.remove('open');

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function makeKey() {
  let body = '';
  for (let i = 0; i < 8; i++) body += chars[Math.floor(Math.random() * chars.length)];
  return 'MDCSB-' + body;
}
document.getElementById('make-key').onclick = () => {
  document.getElementById('key-out').textContent = makeKey();
};
document.getElementById('copy-key').onclick = async () => {
  await navigator.clipboard.writeText(document.getElementById('key-out').textContent);
};
