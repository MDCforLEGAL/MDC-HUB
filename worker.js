const REPO = 'MDCforLEGAL/MDC-HUB';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/files') return listFiles();
    if (url.pathname === '/api/upload' && request.method === 'POST') return uploadFile(request, env);
    if (url.pathname === '/' || url.pathname === '/index.html') return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    return new Response('Not found', { status: 404 });
  }
};

async function gh(path, options = {}) {
  const res = await fetch('https://api.github.com/repos/' + REPO + path, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'mdc-hub',
      ...(options.headers || {})
    }
  });
  if (!res.ok) throw new Error('GitHub ' + res.status);
  return res.json();
}

async function listFiles() {
  try {
    const data = await gh('/contents/files.json');
    const items = JSON.parse(atob(data.content.replace(/\n/g, '')));
    return Response.json(items);
  } catch {
    return Response.json([]);
  }
}

function safeName(name) {
  return String(name || 'file').replace(/[^\w.\- ]/g, '_').slice(0, 80);
}

async function uploadFile(request, env) {
  if (!env.GITHUB_TOKEN) return Response.json({ error: 'GITHUB_TOKEN missing' }, { status: 500 });
  if (!env.UPLOAD_KEY) return Response.json({ error: 'UPLOAD_KEY missing' }, { status: 500 });
  const form = await request.formData();
  if (form.get('key') !== env.UPLOAD_KEY) return Response.json({ error: 'Wrong key' }, { status: 401 });
  const file = form.get('file');
  if (!file || typeof file === 'string') return Response.json({ error: 'No file' }, { status: 400 });
  const name = safeName(file.name);
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const b64 = btoa(binary);
  const headers = { Authorization: 'Bearer ' + env.GITHUB_TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'mdc-hub', 'Content-Type': 'application/json' };

  let sha;
  const existing = await fetch('https://api.github.com/repos/' + REPO + '/contents/files/' + encodeURIComponent(name), { headers }).then(r => r.ok ? r.json() : null);
  if (existing) sha = existing.sha;
  const put = await fetch('https://api.github.com/repos/' + REPO + '/contents/files/' + encodeURIComponent(name), {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message: 'Add ' + name, content: b64, sha })
  });
  if (!put.ok) return Response.json({ error: 'Upload failed' }, { status: 500 });

  const listRes = await fetch('https://api.github.com/repos/' + REPO + '/contents/files.json', { headers });
  const listData = listRes.ok ? await listRes.json() : null;
  const items = listData ? JSON.parse(atob(listData.content.replace(/\n/g, ''))) : [];
  const entry = { name, file: 'https://raw.githubusercontent.com/' + REPO + '/main/files/' + encodeURIComponent(name), type: file.type || 'file', note: 'Uploaded from the site' };
  const next = [entry, ...items.filter(item => item.name !== name)];
  const save = await fetch('https://api.github.com/repos/' + REPO + '/contents/files.json', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message: 'Update file list', content: btoa(JSON.stringify(next, null, 2)), sha: listData && listData.sha })
  });
  if (!save.ok) return Response.json({ error: 'List update failed' }, { status: 500 });
  return Response.json({ ok: true, name });
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#12110f">
<title>MDC HUB</title>
<style>
:root{--bg:#12110f;--bg2:#1b1916;--ink:#f4efe6;--muted:#b7ae9f;--line:rgba(244,239,230,.12);--accent:#d7c4a3}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;min-height:100vh;background:radial-gradient(900px 500px at 10% -10%,rgba(215,196,163,.08),transparent 50%),var(--bg);color:var(--ink);font:16px/1.5 Segoe UI,system-ui,sans-serif}
.intro{position:fixed;inset:0;z-index:20;display:grid;place-items:center;background:#0d0c0a;transition:opacity .8s ease,visibility .8s ease}
.intro.hide{opacity:0;visibility:hidden}
.intro-name{display:flex;gap:.45em;font-size:clamp(42px,10vw,92px);font-weight:700;letter-spacing:.08em}
.intro-name span{display:inline-block;opacity:0;transform:translateY(24px);animation:rise .8s ease forwards}
.intro-name span:nth-child(2){animation-delay:.28s}
@keyframes rise{to{opacity:1;transform:none}}
.top{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;padding:18px 7vw;background:rgba(18,17,15,.78);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
.brand{color:var(--ink);text-decoration:none;font-weight:700;letter-spacing:.12em}
nav{display:flex;gap:22px}nav a{color:var(--muted);text-decoration:none}
.hero,.files,.upload{padding:10vh 7vw}.hero{min-height:70vh;display:flex;flex-direction:column;justify-content:center}
.eyebrow{margin:0 0 12px;color:var(--accent);letter-spacing:.22em;text-transform:uppercase;font-size:12px}
h1{margin:0;font-size:clamp(56px,12vw,128px);line-height:.9;letter-spacing:-.04em}
.lead{max-width:460px;color:var(--muted);font-size:18px}
h2{margin:0 0 16px;font-size:32px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
.card{display:block;padding:18px;background:var(--bg2);border:1px solid var(--line);border-radius:18px;color:inherit;text-decoration:none;transition:transform .25s ease,border-color .25s ease}
.card:hover{transform:translateY(-4px);border-color:rgba(215,196,163,.45)}
.card .type{color:var(--accent);font-size:12px;letter-spacing:.12em;text-transform:uppercase}
.card h3{margin:10px 0 6px;font-size:20px}.card p,.empty{margin:0;color:var(--muted)}
form{display:grid;gap:12px;max-width:420px}
input,button{border:1px solid var(--line);border-radius:12px;background:var(--bg2);color:var(--ink);padding:12px 14px;font:inherit}
button{cursor:pointer;background:#d7c4a3;color:#12110f;font-weight:700}
#msg{color:var(--muted)}
footer{padding:28px 7vw 40px;color:var(--muted);border-top:1px solid var(--line)}
@media(max-width:700px){.top,.hero,.files,.upload,footer{padding-left:20px;padding-right:20px}}
</style>
</head>
<body>
<div class="intro" id="intro"><div class="intro-name"><span>MDC</span><span>HUB</span></div></div>
<header class="top"><a class="brand" href="#top">MDC HUB</a><nav><a href="#files">Files</a><a href="#upload">Upload</a></nav></header>
<main id="top">
<section class="hero"><p class="eyebrow">Public files</p><h1>MDC HUB</h1><p class="lead">Upload from this page. Everyone can see the files.</p></section>
<section class="files" id="files"><h2>Files</h2><p class="empty" id="count">Loading</p><div class="grid" id="grid"></div></section>
<section class="upload" id="upload"><h2>Upload</h2><form id="form"><input name="key" type="password" placeholder="Upload key" required><input name="file" type="file" required><button>Upload</button><p id="msg"></p></form></section>
</main>
<footer>MDC HUB</footer>
<script>
setTimeout(()=>document.getElementById('intro').classList.add('hide'),1900);
async function load(){
  const grid=document.getElementById('grid');
  const count=document.getElementById('count');
  try{
    const items=await fetch('/api/files').then(r=>r.json());
    count.textContent=items.length+(items.length===1?' file':' files');
    grid.innerHTML=items.length?items.map(item=>'<a class="card" href="'+item.file+'" target="_blank" rel="noopener"><div class="type">'+(item.type||'file')+'</div><h3>'+item.name+'</h3><p>'+(item.note||'Open')+'</p></a>').join(''):'<p class="empty">No files yet.</p>';
  }catch{count.textContent='Could not load files'}
}
document.getElementById('form').onsubmit=async e=>{
  e.preventDefault();
  const msg=document.getElementById('msg');
  msg.textContent='Uploading...';
  const res=await fetch('/api/upload',{method:'POST',body:new FormData(e.target)});
  const data=await res.json();
  msg.textContent=data.ok?'Uploaded.':'Failed: '+(data.error||res.status);
  if(data.ok){e.target.reset();load()}
};
load();
</script>
</body></html>`;
