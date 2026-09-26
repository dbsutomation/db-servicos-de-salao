# Architecture decisions

- Optional salon functions live as booleans on `public.salons`; database defaults are off, while preexisting salons retain their former access. This prevents new salons from inheriting optional capabilities.
- Enforce optional functions in RLS as well as page navigation; UI-only restrictions cannot protect direct data access.
- Work hours require agenda, and disabling agenda turns off its work-hours flag without deleting saved schedule rows. This preserves settings for later reactivation.
- Only platform administrators can update salon feature flags; a database trigger protects this even if other salon update permissions change.