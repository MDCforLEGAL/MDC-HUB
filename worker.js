const REPO = 'MDCforLEGAL/MDC-HUB';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/files') return listFiles();
    if (url.pathname === '/api/upload' && request.method === 'POST') return uploadFile(request, env);
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  }
};

async function listFiles() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/' + REPO + '/main/files.json', { headers: { 'User-Agent': 'mdc-hub' } });
    if (!res.ok) return Response.json([]);
    return Response.json(await res.json());
  } catch {
    return Response.json([]);
  }
}

function safeName(name) {
  return String(name || 'file').replace(/[^\w.\- ]/g, '_').slice(0, 80);
}

function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

async function uploadFile(request, env) {
  if (!env.GITHUB_TOKEN) return Response.json({ error: 'GITHUB_TOKEN missing' }, { status: 500 });
  if (!env.UPLOAD_KEY) return Response.json({ error: 'UPLOAD_KEY missing' }, { status: 500 });
  const form = await request.formData();
  if (form.get('key') !== env.UPLOAD_KEY) return Response.json({ error: 'Wrong key' }, { status: 401 });
  const file = form.get('file');
  if (!file || typeof file === 'string') return Response.json({ error: 'No file' }, { status: 400 });
  const name = safeName(file.name);
  const b64 = toBase64(new Uint8Array(await file.arrayBuffer()));
  const headers = {
    Authorization: 'Bearer ' + env.GITHUB_TOKEN,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'mdc-hub',
    'Content-Type': 'application/json'
  };

  const existing = await fetch('https://api.github.com/repos/' + REPO + '/contents/files/' + encodeURIComponent(name), { headers });
  const existingData = existing.ok ? await existing.json() : null;
  const put = await fetch('https://api.github.com/repos/' + REPO + '/contents/files/' + encodeURIComponent(name), {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message: 'Add ' + name, content: b64, sha: existingData && existingData.sha })
  });
  if (!put.ok) return Response.json({ error: 'Upload failed' }, { status: 500 });

  const listRes = await fetch('https://api.github.com/repos/' + REPO + '/contents/files.json', { headers });
  const listData = listRes.ok ? await listRes.json() : null;
  const items = listData ? JSON.parse(atob(listData.content.replace(/\n/g, ''))) : [];
  const entry = {
    name,
    file: 'https://raw.githubusercontent.com/' + REPO + '/main/files/' + encodeURIComponent(name),
    type: file.type || 'file',
    note: 'Uploaded from the site'
  };
  const next = [entry, ...items.filter(item => item.name !== name)];
  const save = await fetch('https://api.github.com/repos/' + REPO + '/contents/files.json', {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: 'Update file list',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2)))),
      sha: listData && listData.sha
    })
  });
  if (!save.ok) return Response.json({ error: 'List update failed' }, { status: 500 });
  return Response.json({ ok: true, name });
}
