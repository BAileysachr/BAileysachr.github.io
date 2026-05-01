// Drafts tab — calls Bailey HQ backend (no GitHub PAT in browser).
// Backend is the source of truth. Auth is the dashboard PIN sent via X-HQ-Pin.

(function () {
  const ROOT_ID = 'drafts-root';
  const API = (window.HQ_API_BASE || 'https://bailey-email-ai-production.up.railway.app');
  const POLL_MS = 20_000;

  function pin() { return localStorage.getItem('hq-pin') || '8682'; }

  async function api(path, init) {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'X-HQ-Pin': pin(), ...((init || {}).headers || {}) },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`${res.status} ${txt.slice(0, 140)}`);
    }
    return res.json();
  }

  function parseIssueBody(body) {
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
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
      <details class="draft-original"><summary>Original email</summary><pre>${escapeHtml(parsed.originalEmail)}</pre></details>
      <div class="draft-reply"><pre>${escapeHtml(parsed.draftReply)}</pre></div>
      <div class="draft-actions">
        <button class="draft-btn draft-approve" data-issue="${n}">Approve</button>
        <button class="draft-btn draft-edit" data-issue="${n}">Edit</button>
        <button class="draft-btn draft-reject" data-issue="${n}">Ignore</button>
      </div>
      <div class="draft-edit-panel" style="display:none">
        <textarea placeholder="Tell your boy what to change..."></textarea>
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
      .draft-from { font-weight:600; } .draft-subject { opacity:0.8; }
      .draft-confidence { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:13px; }
      .draft-original { margin:8px 0; }
      .draft-original summary { cursor:pointer; opacity:0.7; font-size:13px; }
      .draft-original pre { background:#1e293b; padding:12px; border-radius:8px; white-space:pre-wrap; max-height:200px; overflow:auto; font-size:13px; }
      .draft-reply pre { background:#0b1220; border:1px solid #1e293b; padding:14px; border-radius:8px; white-space:pre-wrap; font-size:14px; line-height:1.5; margin:8px 0; }
      .draft-actions { display:flex; gap:8px; margin-top:8px; }
      .draft-btn { padding:8px 14px; border-radius:8px; border:none; font-weight:600; cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
      .draft-approve { background:#22c55e; color:white; } .draft-edit { background:#f59e0b; color:white; } .draft-reject { background:#475569; color:white; }
      .draft-edit-panel { margin-top:10px; }
      .draft-edit-panel textarea { width:100%; min-height:80px; background:#0b1220; color:#e2e8f0; border:1px solid #1e293b; border-radius:8px; padding:10px; font-family:inherit; }
      .draft-edit-send { background:#2563eb; color:white; margin-top:6px; }
      .drafts-empty { opacity:0.6; padding:24px; text-align:center; }
    `;
    document.head.appendChild(s);
  }

  let _refreshing = false;
  async function refresh(force) {
    if (_refreshing) return;
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    // NEVER refresh while Bailey is typing in an edit panel — that's
    // what was nuking his text every 20 seconds.
    if (!force) {
      const openPanels = root.querySelectorAll('.draft-edit-panel[style*="display: block"], .draft-edit-panel[style*="display:block"]');
      for (const panel of openPanels) {
        const ta = panel.querySelector('textarea');
        if (ta && (ta.value.trim() || document.activeElement === ta)) {
          return; // Bailey is editing — skip this refresh cycle
        }
      }
    }

    _refreshing = true;
    try {
      const data = await api('/api/drafts');
      const real = data.drafts || [];
      const tabEl = document.querySelector('.tab[data-tab="drafts"]');
      if (tabEl) {
        let b = tabEl.querySelector('.draft-count');
        if (!b) { b = document.createElement('span'); b.className = 'draft-count'; tabEl.appendChild(b); }
        b.textContent = real.length ? ` ${real.length}` : '';
        b.style.cssText = 'background:#ef4444;color:#fff;border-radius:999px;padding:1px 7px;font-size:11px;margin-left:5px;display:' + (real.length ? 'inline-block' : 'none');
      }
      if (!real.length) {
        root.innerHTML = '<div class="drafts-empty">No drafts waiting. Bailey, go bash some plastic.</div>';
        return;
      }
      // Preserve any open edit panels + textarea content before re-render
      const savedEdits = {};
      root.querySelectorAll('.draft-card').forEach(function(card) {
        var n = card.dataset.issue;
        var panel = card.querySelector('.draft-edit-panel');
        var ta = panel ? panel.querySelector('textarea') : null;
        if (panel && panel.style.display !== 'none') {
          savedEdits[n] = { open: true, text: ta ? ta.value : '' };
        }
      });

      const ts = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      root.innerHTML = `<div style="opacity:.55;font-size:12px;margin:0 0 10px 0;display:flex;gap:8px;align-items:center">
        <span>${real.length} draft${real.length===1?'':'s'} · updated ${ts}</span>
        <button id="drafts-refresh" style="margin-left:auto;padding:4px 10px;border:1px solid #334;border-radius:6px;background:#111;color:#ddd;cursor:pointer">↻ Refresh</button>
      </div>` + real.map(renderCard).join('');

      // Restore open edit panels + textarea content after re-render
      Object.keys(savedEdits).forEach(function(n) {
        var card = root.querySelector('.draft-card[data-issue="' + n + '"]');
        if (!card) return;
        var panel = card.querySelector('.draft-edit-panel');
        var ta = panel ? panel.querySelector('textarea') : null;
        if (panel && savedEdits[n].open) {
          panel.style.display = 'block';
          if (ta) ta.value = savedEdits[n].text;
        }
      });

      const rb = document.getElementById('drafts-refresh');
      if (rb) rb.addEventListener('click', function() { refresh(true); });
    } catch (err) {
      root.innerHTML = `<div class="drafts-empty">Load failed: ${escapeHtml(err.message)}<br><small>Backend: ${API}</small></div>`;
    } finally {
      _refreshing = false;
    }
  }

  // Optimistic removal: fade the card out immediately on action, restore if API fails.
  function fadeOutCard(card) {
    if (!card) return;
    card.style.transition = 'opacity .25s, max-height .35s, margin .25s, padding .25s';
    card.style.maxHeight = card.offsetHeight + 'px';
    // next frame so transition takes effect
    requestAnimationFrame(() => {
      card.style.opacity = '0';
      card.style.maxHeight = '0px';
      card.style.marginBottom = '0px';
      card.style.paddingTop = '0px';
      card.style.paddingBottom = '0px';
      card.style.overflow = 'hidden';
    });
    setTimeout(() => { if (card.parentElement) card.remove(); }, 360);
  }
  function restoreCard(card) {
    if (!card) return;
    card.style.transition = '';
    card.style.opacity = '';
    card.style.maxHeight = '';
    card.style.marginBottom = '';
    card.style.paddingTop = '';
    card.style.paddingBottom = '';
    card.style.overflow = '';
  }

  function bindActions() {
    document.addEventListener('click', async (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLButtonElement)) return;
      const n = parseInt(t.dataset.issue, 10);
      if (!n) return;
      const card = t.closest('.draft-card');

      if (t.classList.contains('draft-approve')) {
        // Optimistic: fade card immediately. Restore on failure.
        fadeOutCard(card);
        try {
          await api(`/api/drafts/${n}/approve`, { method: 'POST', body: '{}' });
          // Background refresh to sync state — the card is already gone visually
          refresh().catch(() => {});
        } catch (err) {
          alert('Approve failed: ' + err.message);
          restoreCard(card);
          t.disabled = false; t.textContent = 'Approve';
        }
      } else if (t.classList.contains('draft-edit')) {
        const panel = card.querySelector('.draft-edit-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      } else if (t.classList.contains('draft-reject')) {
        if (!confirm('Reject this draft?')) return;
        fadeOutCard(card);
        try {
          await api(`/api/drafts/${n}/reject`, { method: 'POST', body: '{}' });
          refresh().catch(() => {});
        } catch (err) {
          alert('Reject failed: ' + err.message);
          restoreCard(card);
          t.disabled = false;
        }
      } else if (t.classList.contains('draft-edit-send')) {
        const text = card.querySelector('textarea').value.trim();
        if (!text) { alert('Type the instruction first.'); return; }
        // Edit doesn't remove the draft (it stays pending until re-drafted by
        // the backend), but we fade so Bailey sees feedback. Refresh will
        // bring back the new version a few seconds later.
        fadeOutCard(card);
        try {
          await api(`/api/drafts/${n}/edit`, { method: 'POST', body: JSON.stringify({ instruction: text }) });
          // Wait a moment for the backend to regenerate before refreshing.
          setTimeout(() => refresh(true).catch(() => {}), 1500);
        } catch (err) {
          alert('Edit failed: ' + err.message);
          restoreCard(card);
          t.disabled = false;
        }
      }
    });
  }

  function start() {
    injectStyles();
    bindActions();
    refresh();
    setInterval(refresh, POLL_MS);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
