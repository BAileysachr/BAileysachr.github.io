# Universal Operating Protocol for Bailey's Claude

> Read this BEFORE any action, on ANY project. This is non-negotiable. Bailey's standing instruction:
> *"use all the information you gather and save in all aspects of projects we take on - it should be in your main memory that you read from every time"*
> *"never make the same mistake twice — you do whatever is necessary to learn from your mistake and never make it again. you also learn new skills from that mistake by researching what you just learnt"*
> *"ensure what you are going to do works before assuming or actioning - be 100% sure before you action"*

## The five-step pre-action protocol

Before writing code, sending a command, hitting an API, or making a decision:

### 1. READ THE STATE
- Read the actual current file from disk or the live API response. Never patch from memory or summary.
- For dashboard / web work: pull the live HTML before patching.
- For backend code: open the route/function and trace it end-to-end.
- For external services (Graph, Twilio, GitHub, Railway, Supabase): hit the actual endpoint with curl/PowerShell first to see the real response shape.

### 2. TRACE THE CHAIN
Map every action → reaction:
- UI button → JS handler → fetch URL → backend route → service call → return → UI update.
- If any link in the chain is unknown, read the source.
- If two functions share a name across files, read BOTH signatures. They may not match.

### 3. VERIFY ASSUMPTIONS
- Argument types: numbers vs strings, presence vs absence (`String(x)` defensive coercion at boundaries).
- Repo / URL targets: every command must hit the right repo (`bailey-email-ai`, not `BAileysachr.github.io`).
- Auth: every request must carry the right token in the right header.
- Platform constraints: Windows has no `node` or real `python` on PATH — use PowerShell. iPhone Safari needs PWA-installed before push works. Service workers must live at site root.

### 4. EXECUTE WITH OBSERVABILITY
- One change at a time when possible.
- Log the exact command and exact response.
- After each push: hard-reload the affected surface and CONFIRM the visible change.

### 5. CAPTURE THE LEARNING
- After any mistake or successful pattern: append to the relevant `Claude Memory/Feedback/*.md` AND mine the underlying skill into `Claude Memory/Skills/*.md`.
- After any decision (irreversible or load-bearing): append a one-line entry to `Claude Memory/Decisions/log.md` with date + what + why.
- Cross-link in `Claude Memory/README.md` so future Claude finds it.

## Working principles

- **Bailey's autonomous-deployment rule stands.** "do it, don't ask me for approvals." Just verify before acting.
- **Never delete, only refine and append.** Vault notes accumulate; old context is more useful than missing context.
- **Be 100% sure before action.** If 80% sure, read more first. Cheap to verify, expensive to undo.
- **Mobile-first for anything Bailey will use on his iPhone 16 Pro Max.** Touch targets ≥44px, safe-area insets, viewport-fit=cover, PWA-installable.
- **Backend > client when secrets are involved.** Never put a PAT, API key, or auth token in browser-side code. Backend proxies. Client uses a simple PIN at most.
- **Email voice rules apply universally** to anything Claude writes that goes to a third party (no em-dashes, conversational, etc — see `Feedback/email-voice.md`).

## Default toolchain on this Windows box

| Need | Use | Don't |
|---|---|---|
| Run a script | PowerShell via `cmd /c "powershell -NoProfile -ExecutionPolicy Bypass -File x.ps1"` | `node` (not installed), `python` (MS Store stub only) |
| Push file to GitHub | `Invoke-RestMethod` PUT `/repos/{r}/contents/{p}` with base64 + sha | curl with large `--data` (ARG_MAX) |
| Edit existing file | `Edit` tool (verify with Read first) | `Write` for partial changes |
| Search code | `Grep` tool | `grep` / `rg` directly |

## Cross-project responsibilities

When working on ANY project, also:
1. Update `Projects/<project>.md` with what changed and why.
2. If a new generalisable skill emerged, add it to `Skills/`.
3. If Bailey corrected something, log it in `Feedback/<area>.md` with: rule + why + how to apply.
4. Append to `Decisions/log.md`.

This is how Claude builds up the same context for Bailey's businesses across sessions instead of starting fresh each time.
