# Project — bailey-email-ai

24/7 autonomous email AI across Bailey's three businesses.

**Location:** `C:\Users\BaileySachr\OneDrive - Plastix Australia\Documents\bailey-email-ai`
**Backend repo:** `github.com/BAileysachr/bailey-email-ai`
**Dashboard repo:** `github.com/BAileysachr/BAileysachr.github.io` (live: https://baileysachr.github.io, PIN 8682)
**Hosting:** Railway (`bailey-email-ai-production.up.railway.app`)
**DB:** Supabase (`zbvqcmowdnxxpqmtsqzo.supabase.co`)

## Stack
Node.js 20+, Express, Microsoft Graph webhooks, Anthropic Claude (`claude-sonnet-4-6`), Supabase Postgres, Twilio SMS, GitHub Issues as command queue, web push (VAPID).

## Design principles (non-negotiable)
- **Config over code** — prompts, rules, thresholds live in Supabase `prompts`/`rules`/`config`.
- **No autonomous sending** until Bailey flips `auto_send_global` in config.
- **Always reply to thread**, never start a new one.
- **Append-only `interactions` learning log** — never delete.
- Update `MODULES.md` whenever a module changes.

## Inboxes
- `Bailey@plastix.com.au` — Plastix + Lil Hottie (live, subscription registered)
- `bailey@lumahydration.com.au` — Luma Hydration (separate Azure tenant `NETORG20598924.onmicrosoft.com` via GoDaddy-managed M365 — **needs second Azure app registration** with Mail.ReadWrite + Mail.Send + admin consent, then per-inbox creds in env as `AZURE_*_LUMA`)

## Command queue (dashboard → backend)
GitHub Issues on dashboard repo, labeled `claude-command`:
- `[CLAUDE ACTION]` — action modal (reply, chase, quote, handle, ignore + free text)
- `[CLAUDE DONE]` — mark handled
- `[CLAUDE NOTE]` — free-form instruction
PAT stored in dashboard localStorage as `hq-gh-pat`.

## Verified end-to-end (2026-04-14)
Marketing → Bailey@plastix.com.au test email → Graph webhook → classifier (urgent, priority 9) → drafter (confidence 40) → GitHub Issue #2 → notifier. Real customer email (`sales@plastix.com.au`, "FW: Fence panels") also processed once webhook fix deployed.

## Known gotchas
- Railway needs explicit `PORT=3000` env AND `app.listen(PORT, '0.0.0.0', …)` to route.
- `serviceInstanceDeployV2` / `serviceInstanceRedeploy` redeploy the pinned SHA — use `deploymentTriggerCreate` + `environmentTriggersDeploy` to pull HEAD.
- Graph notifications send `Users/{guid}/Messages/{msgId}`, not the email address — map subscriptionId → inbox via Supabase `config` rows `graph_sub_*`.
- Node's `fs` on Windows does not translate bash's `/tmp` — use absolute Windows paths in scripts.
- Luma inbox is a separate tenant; single Azure app can't read it.

**How to apply:** Before touching any module read `MODULES.md` in the repo root. New modules: clean interface, load prompts/rules from Supabase, log via `utils/logger.js`, documented in MODULES.md.
