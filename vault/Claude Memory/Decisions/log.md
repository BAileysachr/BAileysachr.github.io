# Decisions log

Append-only. One line per decision: `YYYY-MM-DD — what — why`.

## 2026

- **2026-04-15** — Backend proxy pattern adopted for Bailey HQ dashboard (no PAT in browser, dashboard calls `/api/*` on Railway with `X-HQ-Pin: 8682`) — phone needed token prompt, was leaking PATs, multi-device pain.
- **2026-04-15** — Service worker `renotify: false` (was true) — same draft re-buzzing on each push.
- **2026-04-15** — Two-way SMS/WhatsApp wired via Twilio webhook → `[CLAUDE *]` issue queue — Bailey wanted text-back control without opening dashboard.
- **2026-04-15** — iOS PWA tags + manifest added — push on iPhone Safari only works for installed PWAs.
- **2026-04-15** — Universal operating protocol (`Claude Memory/Universal/operating-protocol.md`) created and linked from vault `CLAUDE.md` STEP 5 — Bailey wants pre-action checklist read every session, every project.
- **2026-04-15** — Dashboard auto-reload reduced 15min → 2min — phone was stale.
- **2026-04-15** — `claudeCmd` rerouted from `BAileysachr.github.io` repo to `bailey-email-ai` repo via backend — was firing into the void; backend wasn't listening on dashboard repo.
