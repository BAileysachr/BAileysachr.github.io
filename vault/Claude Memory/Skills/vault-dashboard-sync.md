# Skill: vault-dashboard-sync

## When to use
After any edit to `CLAUDE.md` or any file under `Claude Memory/` that should appear on the dashboard.

## How
Run locally (Git Bash or any POSIX shell on Windows):

```
bash "C:/Users/BaileySachr/OneDrive - Plastix Australia/Documents/bailey-email-ai/scripts/sync-vault.sh"
```

The script:
1. Walks `Obsidian Vault/CLAUDE.md` + every `.md` under `Obsidian Vault/Claude Memory/`.
2. Writes `vault/index.json` with the file list + generation timestamp.
3. `PUT`s each file (base64 via GitHub Contents API) into `BAileysachr/BAileysachr.github.io` under `vault/`.
4. Dashboard's `vault-tab.js` fetches these at tab-open + on Refresh.

## Automate (optional)
Windows Task Scheduler, daily at 7:00 AEST:

- Program: `C:\Program Files\Git\bin\bash.exe`
- Arguments: `"C:/Users/BaileySachr/OneDrive - Plastix Australia/Documents/bailey-email-ai/scripts/sync-vault.sh"`
- Start in: `C:\Users\BaileySachr\OneDrive - Plastix Australia\Documents\bailey-email-ai`

## Gotchas
- Spaces in vault paths are URL-encoded to `%20` when PUTing to GitHub — already handled.
- Big files use `--data-binary @file` (inline `--data-binary "$body"` overflowed bash arg limits on CLAUDE.md).
- GitHub Pages caches new files ~60s — first load after a new file may 404. Refresh.

## Evidence
- Wired 2026-04-15. Verified first sync pushed 7 files (index + CLAUDE.md + 5 memory files) and dashboard Vault tab rendered them.
