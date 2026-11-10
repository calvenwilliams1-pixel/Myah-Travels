# Account lifecycle (Batch M)

## Users table flags

- `is_admin` (0/1): grants access to admin-only actions. Until the Users page ships, accounts are managed from the CLI only.
- `is_active` (0/1): disabled users cannot log in. `getCurrentUser` returns null for inactive users.
- `must_change_password` (0/1): forces a password change on next login. If `has_completed_setup` is 1, only the password step is shown.
- `has_completed_setup` (0/1): whether the user finished the 3-step wizard. Set to 0 to re-trigger the full wizard.

## Account creation (CLI)

Accounts are managed with `scripts/seed-admin.ts`. Never put the password on the command line; read it silently so it stays out of shell history.

```bash
# Admin account (setup complete, still must change password on first login)
read -s -p "Password: " P; echo
ADMIN_USERNAME=alice ADMIN_PASSWORD="$P" npx tsx scripts/seed-admin.ts
unset P

# New user (full 3-step wizard, forced password change)
read -s -p "Temp password: " P; echo
ADMIN_USERNAME=bob ADMIN_PASSWORD="$P" npx tsx scripts/seed-admin.ts --temp-password
unset P

# Reset an existing user password (forces password change on next login)
read -s -p "New password: " P; echo
ADMIN_USERNAME=alice ADMIN_PASSWORD="$P" npx tsx scripts/seed-admin.ts --reset-password
unset P

# Promote an existing user to admin
ADMIN_USERNAME=alice npx tsx scripts/seed-admin.ts --promote
```

The script only creates users unless one of the flags above is given. Other flags on an existing user are never changed.

## Sessions

**Current behavior:**

- `requireAuth()` and `requireSession()` call `getCurrentUser()`, which reads fresh from the DB on every request. There is no cache.
- `resetCurrentUserCache()` is a **no-op** left for API compatibility after the M.5d cache removal. Calls in `requireAuth`/`requireSession` do nothing.
- `getCurrentUser()` returns `null` for any user with `is_active = 0`, so **disabling a user blocks their next request** even though their session row still exists.
- `checkSetupRequired(user)` (extracted from `requireAuth`, tested in `lib/auth/require-auth.test.ts`) throws `AuthError(403, "Setup required")` when `hasCompletedSetup` is false or `mustChangePassword` is true. `requireAuth` calls it; `requireSession` does not.
- `seed-admin.ts --reset-password` sets `must_change_password = 1` but does **not** revoke existing sessions. Those sessions keep working until they expire or the user changes password via the wizard.
- The wizard's `changePasswordAction` invalidates all other sessions on success, then creates a new session for the wizard tab.

**Gaps (deferred):**

- No admin "revoke all sessions" action.
- Disabling a user doesn't call `lucia.invalidateUserSessions()` — sessions remain in the DB, just inert.
- No UI for any of this. All account operations are CLI-only until the Users page (M.6) is built or dropped permanently.

## Deployment notes

- `DISABLE_AUTH=true` is a dev-only bypass and must never be set in production.
- Rate limiting reads `cf-connecting-ip` first, which is only trustworthy if the app listens on 127.0.0.1 behind the Cloudflare Tunnel (`next start -H 127.0.0.1`).
- Remove `ADMIN_PASSWORD` from `.env` after seeding. See the `read -s` pattern above — it avoids `.env` entirely.
- `NODE_ENV=production` disables the `DISABLE_AUTH=true` dev bypass. In production the bypass fails closed and a valid Lucia session is required.
- `TOTP_ENFORCEMENT=true` (read by `app/admin/(dashboard)/layout.tsx`) forces every logged-in user to enroll TOTP before reaching any admin page. Set on the mini PC at launch. Unset in dev.
- `seed-admin.ts` refuses to run when `NODE_ENV=production` — it's a dev-setup tool, not a runtime tool. Create the first admin on the mini PC using the local `tsx` invocation shown above.
- Backups: see `docs/DATA-DURABILITY.md` and `scripts/backup.sh`. The `users` table is small but critical — the `password_hash` and `totp_secret` columns are the entire admin identity.
