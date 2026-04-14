// Drafts tab — drop this file into baileysachr.github.io and include with:
//   <script src="drafts-tab.js" defer></script>
//
// Expects two things in the page:
//   1. A container element with id="drafts-root".
//   2. A global function claudeCmd(prefix, issueNumber, body) that creates a GitHub issue.
//      If not present this file falls back to creating issues directly with the PAT stored in
//      localStorage under the key 'hq-gh-pat'.

(function () {
  const ROOT_ID = 'drafts-root';
  const REPO = 'BAileysachr/bailey-email-ai';
  const POLL_MS = 60_000;
  const LABEL = 'draft-pending';

  function getPat() {
    return localStorage.getItem('hq-gh-pat') || '';
  }

  async function ghGet(path, params) {
    const url = new URL(`https://api.github.com${path}`);
    if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getPat()}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    return res.json();
  }

  async function createCommandIssue(prefix, issueNumber, body) {
    if (typeof window.claudeCmd === 'function') {
      return window.claudeCmd(prefix, issueNumber, body);
    }
    const title = `[${prefix}] #${issueNumber}`;
    const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getPat()}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body: body || '', labels: ['claude-command'] }),
    });
    if (!res.ok) throw new Error(`Create command failed: ${res.status}`);
    return res.json();
  }

  function parseIssueBody(body) {
    // Extract the blocks rendered by approver.createDraftIssue
    const grab = (label) => {
      const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.*)`);
      const m = body.match(re);
      return m ? m[1].trim() : '';
    };
    const codeBlocks = [...body.matchAll(/```\n([\s\S]*?)```/g)].map((m) => m[1].trim());
    return {
      business: grab('Business'),
      inbox: grab('Inbox'),
      from: grab('From'),
      subject: grab('Subject'),
      received: grab('Received'),
      confidence: parseInt(grab('Confidence'), 10) || 0,
      version: grab('Version'),
      originalEmail: codeBlocks[0] || '',
      draftReply: codeBlocks[1] || '',
    };
  }

  function confidenceColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }

  function businessBadge(b) {
    const colors = { plastix: '#2563eb', luma: '#0891b2', lilhottie: '#db2777' };
    const label = { plastix: 'Plastix', luma: 'Luma', lilhottie: 'Lil Hottie' }[b] || b || 'unknown';
    return `<span class="draft-badge" style="background:${colors[b] || '#64748b'}">${label}</span>`;
  }

  function escapeHtml(s) {
    return (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderCard(issue) {
    const parsed = parseIssueBody(issue.body || '');
    const n = issue.number;
    return `
    <div class="draft-card" data-issue="${n}">
      <div class="draft-head">
        <div class="draft-meta">
          ${businessBadge(parsed.business)}
          <span class="draft-from">${escapeHtml(parsed.from)}</span>
          <span class="draft-subject">${escapeHtml(parsed.subject)}</span>
        </div>
        <div class="draft-confidence" style="background:${confidenceColor(parsed.confidence)}">${parsed.confidence}</div>
      </div>
      <details class="draft-original">
        <summary>Original email</summary>
        <pre>${escapeHtml(parsed.originalEmail)}</pre>
      </details>
      <div class="draft-reply">
        <pre>${escapeHtml(parsed.draftReply)}</pre>
      </div>
      <div class="draft-actions">
        <button class="draft-btn draft-approve" data-issue="${n}">Approve</button>
        <button class="draft-btn draft-edit" data-issue="${n}">Edit</button>
        <button class="draft-btn draft-reject" data-issue="${n}">Ignore</button>
      </div>
      <div class="draft-edit-panel" style="display:none">
        <textarea placeholder="Tell Bailey's AI what to change..."></textarea>
        <button class="draft-btn draft-edit-send" data-issue="${n}">Send instruction</button>
      </div>
    </div>`;
  }

  function injectStyles() {
    if (document.getElementById('drafts-tab-styles')) return;
    const s = document.createElement('style');
    s.id = 'drafts-tab-styles';
    s.textContent = `
      #${ROOT_ID} { font-family: system-ui, sans-serif; }
      .draft-card { background:#0f172a; color:#e2e8f0; border:1px solid #1e293b; border-radius:12px; padding:16px; margin-bottom:12px; }
      .draft-head { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px; }
      .draft-meta { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
      .draft-badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; color:white; font-weight:600; }
      .draft-from { font-weight:600; }
      .draft-subject { opacity:0.8; }
      .draft-confidence { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:13px; }
      .draft-original { margin:8px 0; }
      .draft-original summary { cursor:pointer; opacity:0.7; font-size:13px; }
      .draft-original pre { background:#1e293b; padding:12px; border-radius:8px; white-space:pre-wrap; max-height:200px; overflow:auto; font-size:13px; }
      .draft-reply pre { background:#0b1220; border:1px solid #1e293b; padding:14px; border-radius:8px; white-space:pre-wrap; font-size:14px; line-height:1.5; margin:8px 0; }
      .draft-actions { display:flex; gap:8px; margin-top:8px; }
      .draft-btn { padding:8px 14px; border-radius:8px; border:none; font-weight:600; cursor:pointer; }
      .draft-approve { background:#22c55e; color:white; }
      .draft-edit { background:#f59e0b; color:white; }
      .draft-reject { background:#475569; color:white; }
      .draft-edit-panel { margin-top:10px; }
      .draft-edit-panel textarea { width:100%; min-height:80px; background:#0b1220; color:#e2e8f0; border:1px solid #1e293b; border-radius:8px; padding:10px; font-family:inherit; }
      .draft-edit-send { background:#2563eb; color:white; margin-top:6px; }
      .drafts-empty { opacity:0.6; padding:24px; text-align:center; }
    `;
    document.head.appendChild(s);
  }

  async function refresh() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    if (!getPat()) { root.innerHTML = '<div class="drafts-empty">Set GitHub PAT in localStorage (key: hq-gh-pat) to load drafts.</div>'; return; }
    try {
      const issues = await ghGet(`/repos/${REPO}/issues`, { state: 'open', labels: LABEL, per_page: 50 });
      const real = issues.filter((i) => !i.pull_request);
      if (!real.length) {
        root.innerHTML = '<div class="drafts-empty">No drafts waiting. Bailey, go bash some plastic.</div>';
        return;
      }
      root.innerHTML = real.map(renderCard).join('');
    } catch (err) {
      root.innerHTML = `<div class="drafts-empty">Load failed: ${escapeHtml(err.message)}</div>`;
    }
  }

  function bindActions() {
    document.addEventListener('click', async (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLButtonElement)) return;
      const n = parseInt(t.dataset.issue, 10);
      if (!n) return;
      if (t.classList.contains('draft-approve')) {
        t.disabled = true; t.textContent = 'Approving...';
        try { await createCommandIssue('CLAUDE APPROVE', n, 'Approved via dashboard'); await refresh(); }
        catch (err) { alert('Approve failed: ' + err.message); t.disabled = false; t.textContent = 'Approve'; }
      } else if (t.classList.contains('draft-edit')) {
        const panel = t.closest('.draft-card').querySelector('.draft-edit-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      } else if (t.classList.contains('draft-reject')) {
        if (!confirm('Reject this draft?')) return;
        t.disabled = true;
        try { await createCommandIssue('CLAUDE REJECT', n, 'Rejected via dashboard'); await refresh(); }
        catch (err) { alert('Reject failed: ' + err.message); t.disabled = false; }
      } else if (t.classList.contains('draft-edit-send')) {
        const card = t.closest('.draft-card');
        const text = card.querySelector('textarea').value.trim();
        if (!text) { alert('Type the instruction first.'); return; }
        t.disabled = true;
        try { await createCommandIssue('CLAUDE EDIT', n, `Bailey instruction: ${text}`); await refresh(); }
        catch (err) { alert('Edit failed: ' + err.message); t.disabled = false; }
      }
    });
  }

  function start() {
    injectStyles();
    bindActions();
    refresh();
    setInterval(refresh, POLL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
