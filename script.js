const intro = document.getElementById('intro');
const grid = document.getElementById('grid');
const count = document.getElementById('count');

setTimeout(() => intro.classList.add('hide'), 1900);

async function loadFiles() {
  try {
    const res = await fetch('files.json', { cache: 'no-store' });
    const items = await res.json();
    count.textContent = items.length + (items.length === 1 ? ' file' : ' files');
    if (!items.length) {
      grid.innerHTML = '<p class="empty">No files yet.</p>';
      return;
    }
    grid.innerHTML = items.map((item, i) => `
      <a class="card" href="${item.file}" style="animation-delay:${0.08 * i}s" target="_blank" rel="noopener">
        <div class="type">${item.type || 'file'}</div>
        <h3>${item.name}</h3>
        <p>${item.note || 'Open file'}</p>
      </a>
    `).join('');
  } catch {
    count.textContent = 'Could not load files';
    grid.innerHTML = '<p class="empty">Add files.json next to this page.</p>';
  }
}

loadFiles();

document.getElementById('form').onsubmit = async (e) => {
  e.preventDefault();
  const msg = document.getElementById('msg');
  msg.textContent = 'Uploading...';
  const res = await fetch('/api/upload', { method: 'POST', body: new FormData(e.target) });
  const data = await res.json().catch(() => ({}));
  msg.textContent = data.ok ? 'Uploaded.' : 'Failed: ' + (data.error || res.status);
  if (data.ok) { e.target.reset(); loadFiles(); }
};
