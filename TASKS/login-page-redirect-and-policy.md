# Login Page Redirect & PTO Policy Link

## Description

When navigating to `http://localhost:3003/` while not authenticated, the page displays "Page not found" instead of redirecting to the login page. This task fixes the root-path routing so unauthenticated visitors are sent to `/login`, adds a link to the PTO Policy document on the login page, and creates a minimal Markdown-to-HTML converter (no third-party dependency) to publish `POLICY.md` as `POLICY.html` in the `public/` directory as part of the build process.

## Priority

🔥 High Priority — authentication and login flow are foundational.

## Checklist

### Phase 1: Root-Path Routing Fix

- [ ] Add a `/` route entry in `client/router/routes.ts` that redirects to `/login` (unauthenticated) or `/submit-time-off` (authenticated)
- [ ] Verify navigating to `/` while signed out redirects to `/login`
- [ ] Verify navigating to `/` while signed in redirects to the default dashboard page
- [ ] Verify direct-URL access to `/login` still works as before

### Phase 2: Minimal Markdown-to-HTML Converter

- [ ] Create `scripts/md-to-html.mts` — a zero-dependency Markdown parser supporting headings, paragraphs, tables, bold, italic, inline code, lists, and horizontal rules
- [ ] Wrap output in a styled HTML shell that respects `tokens.css` design tokens
- [ ] Add `build:policy` script to `package.json` that converts `POLICY.md` → `public/POLICY.html`
- [ ] Integrate `build:policy` into the main `build:client` pipeline

### Phase 3: Login Page — Policy Link

- [ ] Add a visible "PTO Policy" link on the login page that opens `/POLICY.html`
- [ ] Style the link to match the existing login page design

### Phase 4: Validation & Quality Gates

- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] Manual testing: unauthenticated root-path redirect
- [ ] Manual testing: POLICY.html renders correctly
- [ ] Manual testing: login page link opens policy document

## Implementation Notes

- The Markdown converter must not rely on any third-party package (e.g., marked, remark). A minimal regex-based converter is sufficient for the limited Markdown used in `POLICY.md` (headings, tables, paragraphs, bold, lists).
- The converter script should be a TypeScript ESM module (`.mts` extension) per project conventions.
- `POLICY.html` should be regenerated on every client build so it stays in sync with `POLICY.md`.
- The router fix is client-side only; the server SPA catch-all already serves `index.html` for all non-API paths.

## Questions and Concerns

1.
2.
3.
