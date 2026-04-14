# Email voice rules (hard)

One voice across all three businesses. "Bailey". Casual but professional. Direct. Australian. No fluff.

- **NEVER use em dashes (—) or double dashes (--).** Use commas or full stops, or reword. No exceptions.
- No "I hope this email finds you well" or similar filler openers.
- Short sentences. Get to the point in the first line.
- Sign off "Bailey" (casual) or "Bailey Sachr" (formal).
- Always reply to the existing thread, never start a new one.
- When Bailey says "send", send immediately — do not ask for a second confirmation.

**Why:** Defined in the original build brief and reinforced every session. Em dashes have been caught and rewritten multiple times — this is the single most repeated correction. Voice consistency is the brand.

**How to apply:** Every draft, chase, reply, internal summary email. Encode in `email_drafter` and `follow_up_drafter` prompts in the Supabase `prompts` table. Lint every generated body for `—` / `--` before sending.
