# Architecture decisions

- Share internal client validation between client management and quick checkout creation; render the quick-create dialog outside the checkout form to avoid nested form submissions.
- Provision staff membership only through trusted service-role operations, never signup metadata; validate role changes and sale references against the caller's establishment in the database.
- Service image writes require an active same-establishment manager and establishment-prefixed paths; public image links remain compatible, but cross-establishment listing is denied.

- Resolve platform-admin membership from Supabase before operational profiles in the shared auth context; route guards use that resolved state to keep administrative and establishment screens mutually exclusive.

- Create the default walk-in client with an after-insert salon trigger, never a backfill, so existing establishments remain unchanged and provisioning is atomic.
- Provision initial manager passwords only through the authenticated platform-admin edge function; preserve invitation mode and never store or return the password.
- Derive category suggestions from current RLS-scoped services plus legacy defaults; keep category strings consistent between service and professional forms.
- Determine dashboard first-use state from unfiltered accessible records only after a successful read, so filtered empty periods and failed requests do not look like new establishments.

- Optional salon functions live as booleans on `public.salons`; database defaults are off, while preexisting salons retain their former access. This prevents new salons from inheriting optional capabilities.
- Enforce optional functions in RLS as well as page navigation; UI-only restrictions cannot protect direct data access.
- Work hours require agenda, and disabling agenda turns off its work-hours flag without deleting saved schedule rows. This preserves settings for later reactivation.
- Only platform administrators can update salon feature flags; a database trigger protects this even if other salon update permissions change.- Components use only semantic color tokens (primary, secondary, accent, etc.) defined in `src/index.css`; no brand-specific color utilities. This keeps a single source of truth and enables future per-salon theming by overriding CSS variables.
