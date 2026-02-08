# Do Not Impact Local Legacy Vault (LLV)

**Rule:** Nothing in this repo (Local Password Vault) should direct you to make changes that negatively impact **Local Legacy Vault** (LLV).

## Supabase and shared infrastructure

- **Local Legacy Vault** uses Supabase (Edge Functions, stripe-webhook, send-email, migrations, etc.). That Supabase project is for LLV only.
- **Do not** follow any instruction that would have you change that same Supabase project (migrations, functions, secrets, tables) in a way that could break or change LLV behavior.
- If LPV uses a database, it should use **its own** Supabase project (or other backend) — separate from LLV’s. Any setup steps for “LPV’s database” are only for that LPV-only project and must never touch LLV’s Supabase.

## When in doubt

- If a step says “run this in Supabase” or “add this migration,” confirm it is for an **LPV-only** project, not the one used by Local Legacy Vault.
- No circles: you will not be directed here to make Supabase (or other) changes that impact Legacy Vault.
