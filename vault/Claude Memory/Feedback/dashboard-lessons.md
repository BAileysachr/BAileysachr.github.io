# Dashboard / Drafts UI — lessons learned

> **HARD RULE FROM BAILEY:** Never make the same mistake twice. Every mistake below MUST be re-read before any dashboard work, and the underlying skill MUST be researched and internalised — not just the symptom patched. If you're about to ship something and one of these patterns applies, STOP and verify.

Source of truth for mistakes Claude has made building Bailey's HQ dashboard. Read this BEFORE editing `index.html`, `drafts-tab.js`, `vault-tab.js`, or anything in `BAileysachr.github.io`.

## Bailey's standing rule
> "ensure what you are going to do works before assuming or actioning - be 100% sure before you action"

Before any dashboard change:
1. Read the current file from the repo (or `index-current.html` cache) — never patch from memory.
2. Trace the call chain end-to-end: button → handler → API call → backend route → result render.
3. Check argument types and the actual repo URLs being hit.
4. Only then write the patch. If unsure, fetch the live HTML / live API response first.

---

## Mistakes made (do not repeat)

### 1. `title.substring is not a function` on Reject
- **Cause:** `drafts-tab.js` called `window.claudeCmd(prefix, issueNumber, body)` but the global `claudeCmd(type, title, body, onSuccess)` in `index.html` ran `title.substring(0,80)`. `issueNumber` is an integer.
- **Fix:** `drafts-tab.js` no longer uses `window.claudeCmd`. It posts directly to the email-ai repo. `index.html`'s `claudeCmd` now coerces with `String(title)` defensively.
- **Rule:** Never assume two functions with the same name across files share a signature. If you didn't write both, read both.

### 2. Dashboard `claudeCmd` posted to the WRONG repo
- **Cause:** `claudeCmd` posted to `BAileysachr/BAileysachr.github.io/issues`, but the email-AI backend only listens to `BAileysachr/bailey-email-ai`. So Quick Note / Done / Reject buttons fired into the void for weeks.
- **Fix:** repo URL changed to `BAileysachr/bailey-email-ai`.
- **Rule:** Every "send command to Claude" path MUST end at `BAileysachr/bailey-email-ai` issues with `claude-command` label. The dashboard repo is for static hosting only.

### 3. Phone "not updating / no notifications"
- **Causes:**
  - 15-minute hard reload (`setTimeout(reload, 15*60*1000)`) — too slow.
  - No service worker, no Push API registration — backend was sending push events into nothing.
- **Fixes:**
  - Reload reduced to 2 minutes.
  - Manual ↻ Refresh button in topbar.
  - Bell button registers `/sw.js`, fetches VAPID public key from `/push/vapid-public-key`, subscribes via `pushManager.subscribe`, POSTs subscription to `/push/subscribe`.
  - `sw.js` handles `push` and `notificationclick`.
- **Rule:** Push requires (a) HTTPS origin (GitHub Pages = OK), (b) a registered service worker at site root, (c) user-gesture permission grant (`Notification.requestPermission()`), (d) subscription saved server-side. Skip any of those four and nothing fires.

### 4. Drafts tab polled every 60s
- Slow on phone. Now 20s. Plus a manual refresh button in the drafts header and a count badge on the tab itself.

### 5. `Argument list too long` on `curl --data` for big files
- Hit when pushing CLAUDE.md via shell. Always write body to a tmp file and use `curl --data-binary @file` for large payloads. Or use the `Invoke-RestMethod` PowerShell path (works for binary base64 too).

### 6. Runtime not where you think it is
- This Windows box has NO `node`, NO `python` on PATH (the python alias goes to MS Store stub). The reliable scripting runtime is **PowerShell** via `cmd /c "powershell -NoProfile -ExecutionPolicy Bypass -File ..."`. Save dashboard-push scripts as `.ps1`.

### 7. `claudeCmd` signature drift across files
- `drafts-tab.js` passed `(prefix, issueNumber, body)`. Old `index.html` expected `(type, title, body, onSuccess)`. This is the same root cause as #1 but worth recording separately: when adding a new caller of a global, audit every existing caller.

---

## Canonical command shape (all "tell Claude something" buttons)

```js
fetch('https://api.github.com/repos/BAileysachr/bailey-email-ai/issues', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${getPat()}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: `[${PREFIX}] ${context}`,    // PREFIX ∈ APPROVE | EDIT | REJECT | CAL | DONE | NOTE
    body: 'human-readable details',
    labels: ['claude-command'],
  }),
});
```
Backend regex (in `src/modules/approver.js`): `/^\[CLAUDE (APPROVE|EDIT|REJECT|CAL)\]/i` — extend the regex when adding a new prefix.

## Tab order (current, intentional)
Needs You → Drafts → Open Items → Actioned → Cleaned → Vault → History.
Bailey reads left-to-right by priority; never reorder without asking.

## Files involved
- `BAileysachr.github.io/index.html` — main dashboard
- `BAileysachr.github.io/drafts-tab.js` — drafts pane
- `BAileysachr.github.io/vault-tab.js` — vault pane
- `BAileysachr.github.io/sw.js` — service worker (push)
- Local cache: `C:\Users\BaileySachr\AppData\Local\Temp\index-current.html` (pull before patching)
- Push script: `C:\Users\BaileySachr\AppData\Local\Temp\push3.ps1`
- Backend push endpoints: `bailey-email-ai-production.up.railway.app/push/{vapid-public-key,subscribe}`

## Skills levelled up from these mistakes

### Skill: Web Push end-to-end
- Server: VAPID keypair (`web-push generate-vapid-keys`), store private + public + subject in env. Endpoints: `GET /push/vapid-public-key` returns `{publicKey}`; `POST /push/subscribe` stores `{endpoint, keys:{p256dh,auth}}` per device.
- Client requirements (all four or no notifications): HTTPS origin, registered service worker at site root, `Notification.requestPermission()` from a user gesture, server-side subscription persisted.
- VAPID public key is URL-safe base64; convert with `urlBase64ToUint8Array` before passing to `pushManager.subscribe`.
- Service worker MUST live at site root (`/sw.js`) and have correct scope; iOS Safari needs the site installed as a PWA before push works at all.
- `userVisibleOnly: true` is mandatory in Chrome.
- Test: send a push from server, watch `chrome://serviceworker-internals`.

### Skill: GitHub Issues as a command queue
- One repo (`bailey-email-ai`) is THE command sink. Backend long-polls / webhook-listens for issues with label `claude-command`.
- Title prefix is the verb: `[CLAUDE APPROVE]`, `[CLAUDE EDIT]`, `[CLAUDE REJECT]`, `[CLAUDE CAL]`, `[CLAUDE DONE]`, `[CLAUDE NOTE]`. Adding a verb requires a regex update in `src/modules/approver.js`.
- Body carries structured data; keep human-readable but parseable.
- Never split commands across multiple repos — one queue, one consumer.

### Skill: Defensive JS for cross-file globals
- Any global function called from multiple files is a contract. Document its signature with a JSDoc comment at the definition site.
- Defensive coercion at the boundary: `String(x).substring(...)` not `x.substring(...)` when `x` could be a number or undefined.
- When adding a new caller, grep ALL callers (`grep -rn 'claudeCmd(' .`) and verify signatures match.

### Skill: Windows scripting reality
- Available everywhere: PowerShell (`powershell -NoProfile -ExecutionPolicy Bypass -File x.ps1`), `cmd`, Git Bash.
- NOT available by default: `node`, `python` (the python.exe alias is a Microsoft Store stub, not a real interpreter).
- For binary uploads via REST: PowerShell's `[Convert]::ToBase64String([IO.File]::ReadAllBytes(...))` + `Invoke-RestMethod` is the most reliable path.

### Skill: GitHub Contents API for cross-repo file pushes
- `PUT /repos/{owner}/{repo}/contents/{path}` with `{message, content: base64, sha?}`.
- `sha` is REQUIRED for updates, MUST be omitted for creates. Always GET first to detect.
- Large bodies via curl on Windows: write to file, use `--data-binary @file` to dodge `ARG_MAX`.

### Skill: Mobile-friendly dashboards
- Auto-reload should be 1–3 minutes, not 15. Pair with manual ↻ button.
- Polling intervals on phone should be ≤30s for "live" feel.
- Tab badges (`N drafts`) communicate state without forcing tab switches.
- `viewport` meta with `maximum-scale=1.0, user-scalable=no` prevents accidental zoom on tap.
- All buttons need `touch-action: manipulation; -webkit-tap-highlight-color: transparent` for crisp mobile feel.

---

## Pre-flight checklist before any dashboard deploy
- [ ] Read current file from repo (don't trust local cache without verifying timestamp)
- [ ] If touching a global function, grep ALL callers across `*.js` and inline `<script>` blocks
- [ ] Repo target for issues is `bailey-email-ai`, not `BAileysachr.github.io`
- [ ] If adding a button that triggers a backend action, the backend route exists (verify with curl)
- [ ] If adding push/SW code, sw.js is at site root and HTTPS only
- [ ] PowerShell push script tested and reports OK shas
- [ ] After push: open dashboard, hard-reload (Ctrl+Shift+R), confirm visible change
