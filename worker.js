const REPO = 'MDCforLEGAL/MDC-HUB';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/files') return listFiles(env);
    if (url.pathname === '/api/status') return publicStatus();
    if (url.pathname === '/api/raw') return rawFile(url, env);
    if (url.pathname === '/api/upload' && request.method === 'POST') return uploadFile(request, env);
    if (url.pathname === '/api/delete' && request.method === 'POST') return deleteFile(request, env);
    if (url.pathname === '/api/like' && request.method === 'POST') return likeFile(request, env);
    if (url.pathname === '/api/comment' && request.method === 'POST') return commentFile(request, env);
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  }
};

async function listFiles(env) {
  try {
    const token = envValue(env, ['GITHUB_TOKEN', 'GH_TOKEN', 'GITHUB_PAT', 'GH_PAT', 'TOKEN']);
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'mdc-hub' };
    if (token) headers.Authorization = 'Bearer ' + token;
    const res = await fetch('https://api.github.com/repos/' + REPO + '/contents/files.json', { headers });
    if (!res.ok) return Response.json([], { headers: { 'Cache-Control': 'no-store' } });
    const data = await res.json();
    const items = JSON.parse(atob(String(data.content || '').replace(/\n/g, '')));
    return Response.json(items, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json([], { headers: { 'Cache-Control': 'no-store' } });
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

function envValue(env, names) {
  for (const name of names) {
    const value = env && env[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}
async function uploadFile(request, env) {
  const token = envValue(env, ['GITHUB_TOKEN', 'GH_TOKEN', 'GITHUB_PAT', 'GH_PAT', 'TOKEN']);
  const uploadKey = envValue(env, ['UPLOAD_KEY', 'UPLOAD_PASSWORD', 'KEY']);
  if (!token) return Response.json({ error: 'GITHUB_TOKEN missing', keys: Object.keys(env || {}) }, { status: 500 });
  if (!uploadKey) return Response.json({ error: 'UPLOAD_KEY missing', keys: Object.keys(env || {}) }, { status: 500 });
  const form = await request.formData();
  if (form.get('key') !== uploadKey) return Response.json({ error: 'Wrong key' }, { status: 401 });
  const file = form.get('file');
  if (!file || typeof file === 'string') return Response.json({ error: 'No file' }, { status: 400 });
  const name = safeName(file.name);
  const b64 = toBase64(new Uint8Array(await file.arrayBuffer()));
  const headers = {
    Authorization: 'Bearer ' + token,
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
  if (!put.ok) {
    const detail = await put.text();
    return Response.json({ error: 'Upload failed', github: put.status + ' ' + detail.slice(0, 300) }, { status: 500 });
  }

  const listRes = await fetch('https://api.github.com/repos/' + REPO + '/contents/files.json', { headers });
  const listData = listRes.ok ? await listRes.json() : null;
  const items = listData ? JSON.parse(atob(listData.content.replace(/\n/g, ''))) : [];
  const entry = {
    name,
    file: 'https://raw.githubusercontent.com/' + REPO + '/main/files/' + encodeURIComponent(name),
    type: file.type || 'file',
    note: String(form.get('note') || '').trim().slice(0, 120) || 'Uploaded from the site'
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
  if (!save.ok) {
    const detail = await save.text();
    return Response.json({ error: 'List update failed', github: save.status + ' ' + detail.slice(0, 300) }, { status: 500 });
  }
  return Response.json({ ok: true, name });
}

async function deleteFile(request, env) {
  const token = envValue(env, ['GITHUB_TOKEN', 'GH_TOKEN', 'GITHUB_PAT', 'GH_PAT', 'TOKEN']);
  const uploadKey = envValue(env, ['UPLOAD_KEY', 'UPLOAD_PASSWORD', 'KEY']);
  if (!token || !uploadKey) return Response.json({ error: 'Server key missing' }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  if (body.key !== uploadKey) return Response.json({ error: 'Wrong key' }, { status: 401 });
  const fromUrl = String(body.file || '').split('/').pop() || '';
  const name = safeName(decodeURIComponent(fromUrl) || body.name);
  const headers = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'mdc-hub',
    'Content-Type': 'application/json'
  };
  const existing = await fetch('https://api.github.com/repos/' + REPO + '/contents/files/' + encodeURIComponent(name), { headers });
  if (!existing.ok) return Response.json({ error: 'File not found' }, { status: 404 });
  const existingData = await existing.json();
  const del = await fetch('https://api.github.com/repos/' + REPO + '/contents/files/' + encodeURIComponent(name), {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ message: 'Delete ' + name, sha: existingData.sha })
  });
  if (!del.ok) {
    const detail = await del.text();
    return Response.json({ error: 'Delete failed', github: del.status + ' ' + detail.slice(0, 200) }, { status: 500 });
  }
  const listRes = await fetch('https://api.github.com/repos/' + REPO + '/contents/files.json', { headers });
  const listData = listRes.ok ? await listRes.json() : null;
  const items = listData ? JSON.parse(atob(listData.content.replace(/\n/g, ''))) : [];
  const next = items.filter(item => item.name !== body.name && !String(item.file || '').endsWith('/' + name) && item.file !== 'files/' + name);
  const save = await fetch('https://api.github.com/repos/' + REPO + '/contents/files.json', {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: 'Remove ' + name + ' from list',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(next, null, 2)))),
      sha: listData && listData.sha
    })
  });
  if (!save.ok) return Response.json({ error: 'Deleted file, list update failed' }, { status: 500 });
  return Response.json({ ok: true, files: next });
}

async function rawFile(url, env) {
  const name = safeName(decodeURIComponent(url.searchParams.get('name') || ''));
  if (!name) return new Response('Missing name', { status: 400 });
  const token = envValue(env, ['GITHUB_TOKEN', 'GH_TOKEN', 'GITHUB_PAT', 'GH_PAT', 'TOKEN']);
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'mdc-hub' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch('https://api.github.com/repos/' + REPO + '/contents/files/' + encodeURIComponent(name), { headers });
  if (!res.ok) return new Response('Not found', { status: 404 });
  const data = await res.json();
  const text = atob(String(data.content || '').replace(/\n/g, ''));
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function publicStatus() {
  let bot = 'offline';
  try {
    const res = await fetch('https://ufdlpho6fv.apps.bot-hosting.cloud', { method: 'GET' });
    bot = res.ok ? 'online' : 'offline';
  } catch {}
  return Response.json({ site: 'online', bot }, { headers: { 'Cache-Control': 'no-store' } });
}

function ghHeaders(env) {
  const token = envValue(env, ['GITHUB_TOKEN', 'GH_TOKEN', 'GITHUB_PAT', 'GH_PAT', 'TOKEN']);
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'mdc-hub', 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  return headers;
}
async function readList(env) {
  const headers = ghHeaders(env);
  const res = await fetch('https://api.github.com/repos/' + REPO + '/contents/files.json', { headers });
  if (!res.ok) return { items: [], sha: null, headers };
  const data = await res.json();
  return { items: JSON.parse(atob(String(data.content || '').replace(/\n/g, ''))), sha: data.sha, headers };
}
async function saveList(headers, items, sha, message) {
  return fetch('https://api.github.com/repos/' + REPO + '/contents/files.json', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message, content: btoa(unescape(encodeURIComponent(JSON.stringify(items, null, 2)))), sha })
  });
}
async function likeFile(request, env) {
  const body = await request.json().catch(() => ({}));
  const { items, sha, headers } = await readList(env);
  const item = items.find(entry => entry.name === body.name);
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 });
  item.likes = (item.likes || 0) + 1;
  const save = await saveList(headers, items, sha, 'Like ' + item.name);
  if (!save.ok) return Response.json({ error: 'Like failed' }, { status: 500 });
  return Response.json({ ok: true, likes: item.likes });
}
async function commentFile(request, env) {
  const body = await request.json().catch(() => ({}));
  const user = String(body.user || '').trim().slice(0, 24);
  const text = String(body.text || '').trim().slice(0, 160);
  if (!user || !text) return Response.json({ error: 'Missing comment' }, { status: 400 });
  const { items, sha, headers } = await readList(env);
  const item = items.find(entry => entry.name === body.name);
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 });
  item.comments = [{ name: user, text }, ...(item.comments || [])].slice(0, 20);
  const save = await saveList(headers, items, sha, 'Comment on ' + item.name);
  if (!save.ok) return Response.json({ error: 'Comment failed' }, { status: 500 });
  return Response.json({ ok: true });
}
