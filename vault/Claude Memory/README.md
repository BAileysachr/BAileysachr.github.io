# Claude Memory — Vault-Resident Brain

This folder is Claude's persistent memory, co-located with the Obsidian vault so Bailey can read, edit, and evolve it directly. The vault is the source of truth. Claude's local auto-memory (`~/.claude/projects/.../memory/`) only points here.

## Protocol (non-negotiable)

1. **Before any decision or action** — read `CLAUDE.md` (parent folder) + the relevant subfolder below.
2. **After any significant action** — write a note into `Decisions/` or update `Projects/`.
3. **When a new pattern, rule, or capability emerges** — drop a skill into `Skills/`.
4. **When Bailey corrects or confirms an approach** — record it in `Feedback/`.
5. Never summarise or cut. Append, refine, never silently delete.

## Layout

- `Projects/` — live project context (bailey-email-ai, Luma launch, Plastix, Lil Hottie). Read before touching the relevant domain.
- `Skills/` — reusable capabilities Claude should acquire and sharpen (email drafting voice, Outlook web automation, GitHub Issues command queue, Railway deploys, Graph webhook plumbing). Treat these like muscle memory — read them whenever the task touches the skill.
- `Feedback/` — every correction/confirmation from Bailey. Rule + **Why** + **How to apply**.
- `Decisions/` — irreversible or load-bearing choices with dates and rationale. Cheaper to read than to re-derive.

## Index

- Projects
  - [bailey-email-ai](Projects/bailey-email-ai.md)
- Skills
  - (seed — add as they emerge)
- Feedback
  - [Email voice rules](Feedback/email-voice.md)
  - [Dashboard / Drafts UI lessons](Feedback/dashboard-lessons.md) — read before touching `index.html`, `drafts-tab.js`, `vault-tab.js`, `sw.js`
- Decisions
  - (seed)
