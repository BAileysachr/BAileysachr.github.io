// Vault tab — live view of Bailey's Obsidian vault via the dashboard repo.
// Reads vault/index.json + vault/CLAUDE.md + vault/Claude Memory/**.md from this same repo.
(function () {
  const root = document.getElementById('vault-root');
  if (!root) return;

  const BASE = 'vault'; // same repo

  function mdToHtml(md) {
    // tiny markdown -> html (headings, bullets, checkboxes, code blocks, bold/italic, links).
    let html = md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // code fences
    html = html.replace(/```([\s\S]*?)```/g, (_, c) => `<pre><code>${c}</code></pre>`);
    // headings
    html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>')
               .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
               .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
               .replace(/^### (.+)$/gm, '<h3>$1</h3>')
               .replace(/^## (.+)$/gm, '<h2>$1</h2>')
               .replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // checkboxes
    html = html.replace(/^- \[x\] (.+)$/gim, '<div class="chk done">☑ $1</div>');
    html = html.replace(/^- \[ \] (.+)$/gm, '<div class="chk open">☐ $1</div>');
    // bullets
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)(\n(?!<li>))/g, '<ul>$1</ul>$2');
    // bold / italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    // links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // paragraphs
    html = html.replace(/\n{2,}/g, '</p><p>');
    return `<p>${html}</p>`;
  }

  function extractOpenItems(claudeMd) {
    const out = [];
    const re = /^- \[ \] (.+)$/gm;
    let m;
    while ((m = re.exec(claudeMd))) out.push(m[1].trim());
    return out;
  }

  async function fetchText(path) {
    const r = await fetch(`${BASE}/${path}?t=${Date.now()}`);
    if (!r.ok) throw new Error(`${path}: ${r.status}`);
    return r.text();
  }
  async function fetchJson(path) {
    const r = await fetch(`${BASE}/${path}?t=${Date.now()}`);
    if (!r.ok) throw new Error(`${path}: ${r.status}`);
    return r.json();
  }

  let state = { claude: '', index: null, memory: {}, view: 'overview' };

  async function load() {
    root.innerHTML = '<div class="empty" style="opacity:.6;padding:24px;text-align:center">Loading vault...</div>';
    try {
      state.index = await fetchJson('index.json');
      state.claude = await fetchText('CLAUDE.md');
      state.memory = {};
      for (const p of state.index.files) {
        if (p === 'CLAUDE.md') continue;
        const safe = p.split('/').map(encodeURIComponent).join('/');
        try { state.memory[p] = await fetchText(safe); }
        catch (e) { state.memory[p] = `(failed to load: ${e.message})`; }
      }
      render();
    } catch (err) {
      root.innerHTML = `<div class="empty" style="padding:24px;color:#b00">Failed to load vault: ${err.message}</div>`;
    }
  }

  function render() {
    const openItems = extractOpenItems(state.claude);
    const byFolder = {};
    for (const p of Object.keys(state.memory)) {
      const parts = p.split('/');
      const folder = parts.length > 2 ? parts[1] : 'Root';
      (byFolder[folder] = byFolder[folder] || []).push(p);
    }

    const tabs = ['overview', 'CLAUDE.md', ...Object.keys(byFolder)];
    const head = `
      <style>
        .vault-nav{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
        .vault-nav button{padding:6px 12px;border:1px solid #444;background:#222;color:#ddd;border-radius:6px;cursor:pointer}
        .vault-nav button.active{background:#2d5;color:#000;border-color:#2d5}
        .vault-card{background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:14px;margin:10px 0}
        .vault-card h3{margin:0 0 8px 0}
        .chk{padding:4px 0}
        .chk.open{color:#e8c547}
        .chk.done{color:#7d7;text-decoration:line-through;opacity:.7}
        .vault-path{font-family:monospace;font-size:11px;opacity:.6;margin-bottom:6px}
        .vault-md{line-height:1.55;font-size:14px}
        .vault-md pre{background:#0a0a0a;padding:10px;border-radius:6px;overflow:auto}
        .vault-md code{font-family:monospace;font-size:12px}
        .vault-md h1,.vault-md h2,.vault-md h3{margin-top:16px}
        .vault-meta{opacity:.6;font-size:12px;margin-bottom:8px}
      </style>
      <div class="vault-nav">
        ${tabs.map(t => `<button data-view="${t}" class="${state.view===t?'active':''}">${t}</button>`).join('')}
        <button id="vault-refresh" style="margin-left:auto">↻ Refresh</button>
      </div>
      <div class="vault-meta">Generated ${state.index?.generated_at || '—'} · ${state.index?.files?.length || 0} files</div>
    `;

    let body = '';
    if (state.view === 'overview') {
      body += `<div class="vault-card"><h3>Open items (${openItems.length})</h3>` +
              (openItems.length ? openItems.map(i => `<div class="chk open">☐ ${i.replace(/</g,'&lt;')}</div>`).join('') : '<div class="empty">no open items</div>') +
              `</div>`;
      body += `<div class="vault-card"><h3>Memory index</h3>`;
      for (const [folder, files] of Object.entries(byFolder)) {
        body += `<div style="margin:8px 0"><strong>${folder}</strong><ul>` +
                files.map(f => `<li><a href="#" data-open="${encodeURIComponent(f)}">${f.split('/').pop()}</a></li>`).join('') +
                `</ul></div>`;
      }
      body += `</div>`;
    } else if (state.view === 'CLAUDE.md') {
      body += `<div class="vault-card"><div class="vault-path">CLAUDE.md</div><div class="vault-md">${mdToHtml(state.claude)}</div></div>`;
    } else {
      const files = byFolder[state.view] || [];
      body += files.map(p => `<div class="vault-card"><div class="vault-path">${p}</div><div class="vault-md">${mdToHtml(state.memory[p] || '')}</div></div>`).join('');
    }

    root.innerHTML = head + body;
    root.querySelectorAll('.vault-nav button[data-view]').forEach(b => {
      b.addEventListener('click', () => { state.view = b.getAttribute('data-view'); render(); });
    });
    const rb = root.querySelector('#vault-refresh');
    if (rb) rb.addEventListener('click', load);
    root.querySelectorAll('a[data-open]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const p = decodeURIComponent(a.getAttribute('data-open'));
        const folder = p.split('/').length > 2 ? p.split('/')[1] : 'Root';
        state.view = folder;
        render();
        setTimeout(() => {
          const el = [...root.querySelectorAll('.vault-path')].find(x => x.textContent === p);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      });
    });
  }

  // Activate on tab switch
  function bindTabSwitch() {
    document.querySelectorAll('.tab[data-tab="vault"]').forEach(t => {
      t.addEventListener('click', () => { if (!state.index) load(); });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindTabSwitch);
  } else {
    bindTabSwitch();
  }
  // Initial load if the Vault tab is already active on page load
  if (document.querySelector('.tab.active[data-tab="vault"]')) load();
})();
