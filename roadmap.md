# Salon function controls

# Unified login
- [ ] Share the login screen, resolve platform-admin access first, and block operational pages for administrators.
- [ ] Remove the dedicated administrator login and verify shared login and access guards.

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