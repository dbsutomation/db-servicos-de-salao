# Salon function controls

# Login branding and mobile shortcut
- [ ] Apply supplied OS symbol with One Studio on login without changing authentication or the surrounding composition.
- [ ] Configure favicon and manifest-only mobile home-screen icons; verify desktop/mobile display and icon metadata.

# Client checkout and security
- [x] Make client email optional; three validation tests pass.
- [x] Add quick client creation inside checkout; verified real save, automatic selection, mobile form and cart reload, with disposable clients removed.
- [x] Repair image policies, role mutation authorization, trusted staff provisioning and same-establishment sale validation; database authorization tests pass and production dependency scan is clear.
- [ ] Enable leaked-password protection in external Supabase Authentication settings (blocked: requires owner configuration and an eligible Supabase plan).
- [ ] Apply available Postgres security upgrade (blocked: owner must schedule the external Supabase upgrade; it may interrupt live access).
- [x] Review 14 signed-in SECURITY DEFINER warnings: scoped RLS helpers and authorized administrative routines are intentional; retain required grants rather than breaking access.

# Unified login
- [x] Share the login screen, resolve platform-admin access first, and block operational pages for administrators; access rules covered by four tests.
- [x] Remove the dedicated administrator login; verify real staff login, denied admin-page access, reload, and logout in the browser.
- [ ] Verify shared login with a real platform-admin session (blocked: available test account is an establishment user; administrator routing and operational denial verified by tests).

# Readiness for the next establishment

- [x] Allow administrator-selected initial passwords without requiring email delivery; retain invitation mode and preserve passwords on retries.
- [x] Create Consumidor Final only for newly created establishments; verify two independent creations with rolled-back database tests.
- [x] Allow custom service and professional categories without losing current categories; verify forms on desktop and mobile.
- [x] Clarify professional email requirements and duplicate-email errors; verify guidance while signed in.
- [x] Add useful first-use dashboard states; verify an existing establishment does not show first-use guidance and does load its data.
- [ ] Verify new-establishment creation and initial-password sign-in end-to-end (blocked: available test account is not a platform administrator; permission denial verified).

- [x] Add per-salon optional controls with new-salon defaults and preserved existing access.
- [x] Restrict optional data and customer booking in database rules.
- [x] Add administrator switches and hide or block unavailable pages.
- [ ] Verify administrator toggle end-to-end while signed in (blocked: external Supabase has no managed browser session).