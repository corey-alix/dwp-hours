# Azure AD Authentication

## Description

Extend the existing magic-link authentication system to support Azure Active Directory (Azure AD / Entra ID) single sign-on for internal corporate users. Off-prem users continue to authenticate via magic links; on-prem users with a corporate identity authenticate via the MSAL authorization-code flow, with the server validating Azure-issued JWTs and mapping them to the existing `employees` table.

## Priority

🔥 High Priority

This is a direct extension of the foundation `authentication.md` task. Corporate identity validation is a security requirement for internal deployments and blocks production use by on-prem staff.

## Proposed Library Evaluation

| Library              | Verdict                  | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **@azure/msal-node** | ✅ **Recommended**       | The official Microsoft library for Azure AD token acquisition. Handles the OAuth 2.0 authorization-code flow, token caching, and refresh. ADAL is deprecated; MSAL is the only supported path. Lightweight enough for the 512 MB deployment target (~2 MB installed).                                                                                                                                                        |
| **express-jwt**      | ⚠️ **Replace with jose** | `express-jwt` pulls in the full `jsonwebtoken` C-binding chain and is middleware-shaped, which doesn't fit the project's existing manual cookie-extraction pattern in `server/utils/auth.ts`. The project already depends on `jsonwebtoken` for HS256 magic-link tokens; for Azure RS256 validation, the zero-dependency **jose** library (pure JS, ESM-native) is lighter, faster, and avoids a second middleware paradigm. |
| **jwks-rsa**         | ⚠️ **Replace with jose** | `jose` includes `createRemoteJWKSet()` which fetches and caches JWKS from the Azure AD endpoint natively — no separate package needed. Eliminates one dependency while retaining the same dynamic key-resolution capability.                                                                                                                                                                                                 |
| **dotenv**           | ✅ **Already installed** | Already in `package.json` (`^17.2.3`). No action required.                                                                                                                                                                                                                                                                                                                                                                   |

### Recommended dependency changes

```
pnpm add @azure/msal-node jose
```

- **@azure/msal-node** — authorization-code flow, token cache, refresh
- **jose** — RS256 JWT verification + JWKS fetching (replaces both `express-jwt` and `jwks-rsa`)

No new dependencies beyond these two. `dotenv` is already present; `jsonwebtoken` remains for the existing magic-link HS256 flow.

## Checklist

### Phase 1 — Configuration & Environment (foundation)

- [x] Define Azure AD environment variables in `.env.example`: `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_REDIRECT_URI` _(done — see `.env.example`)_
- [x] Add `AZURE_AD_ENABLED` feature flag (default `false`) to `shared/businessRules.ts`
- [x] Create `server/auth/azureAdConfig.ts` — reads env vars, exports MSAL `ConfidentialClientApplication` config
- [x] Validate: `pnpm run build` passes, flag defaults to off, no behavioral change

### Phase 1b — Centralize Role Constants (prerequisite for AD role mapping)

The string literal `"Admin"` is scattered across 30+ locations in the codebase (server middleware, route handlers, client components, router guards, type definitions, tests). Before adding AD-sourced role assignment, centralize role handling:

- [x] Add role constants to `shared/businessRules.ts`: `ROLE_ADMIN = "Admin"`, `ROLE_MANAGER = "Manager"`, `ROLE_EMPLOYEE = "Employee"`
- [x] Add Azure AD app-role-name constants to `shared/businessRules.ts`: `AD_ROLE_ADMIN = "dw-time-admin"`, `AD_ROLE_MANAGER = "dw-time-manager"`, `AD_ROLE_USER = "dw-time-user"`
- [x] Add AD-to-internal role mapping to `shared/businessRules.ts`: `AD_ROLE_MAP: Record<string, EmployeeRole>` — `{ "dw-time-admin": "Admin", "dw-time-manager": "Manager", "dw-time-user": "Employee" }`
- [x] Add role type to `shared/businessRules.ts`: `type EmployeeRole = typeof ROLE_ADMIN | typeof ROLE_MANAGER | typeof ROLE_EMPLOYEE`
- [x] Add role-check helpers to `shared/businessRules.ts`: `isAdmin(role: string): boolean`, `isManager(role: string): boolean`
- [x] Replace hardcoded `"Admin"` comparisons in `server/utils/auth.ts` (`authenticateAdmin`) with `isAdmin()`
- [x] Replace hardcoded `"Admin"` comparisons in `server/server.mts` (inline role checks at ~4 locations)
- [x] Replace hardcoded `"Admin"` in client-side code: `client/router/routes.ts` (`roles: [ROLE_ADMIN]`), `client/components/dashboard-navigation-menu/index.ts`, `client/components/employee-list/index.ts`, `client/components/employee-form/index.ts`
- [x] Replace hardcoded `"Admin"` and `"Employee"` in type definitions: `client/components/employee-list/index.ts` (`Employee.role`), `shared/seedData.ts`
- [ ] Update test files to import role constants instead of using string literals
- [x] Validate: `pnpm run build` && `pnpm run test` pass, no behavioral change

### Phase 2 — Server-Side Auth Endpoints

- [x] Install `@azure/msal-node` and `jose`
- [x] Create `GET /api/auth/azure/login` — generates MSAL auth-code URL and redirects user to Azure AD consent screen
- [x] Create `GET /api/auth/azure/callback` — exchanges authorization code for tokens via MSAL, verifies `id_token` signature using `jose` + Azure JWKS endpoint
- [x] Map Azure `preferred_username` / `email` claim to `employees.identifier`; return existing session JWT (same format as magic-link flow)
- [x] Handle unknown-user case: auto-provision new employee from Azure claims (`preferred_username`/`email` → `identifier`, `name` claim → `name`), same pattern as magic-link auto-provisioning
- [ ] Validate: manual curl test of login redirect → callback → session cookie set

### Phase 2b — Azure AD Role Mapping

For Azure AD users, the AD role assignment takes precedence over the local database `employees.role` field. This ensures corporate identity governance controls who is an admin. A user can be assigned **multiple** AD app roles; the server resolves to the **highest-privilege** internal role present.

#### AD App Role → Internal Role Mapping

| Azure AD App Role | Internal Role | Notes                                                                             |
| ----------------- | ------------- | --------------------------------------------------------------------------------- |
| `dw-time-admin`   | `Admin`       | Full admin access                                                                 |
| `dw-time-manager` | `Manager`     | Manager-specific features TBD; currently no additional privileges beyond Employee |
| `dw-time-user`    | `Employee`    | Standard employee access                                                          |

Precedence (highest wins): `dw-time-admin` > `dw-time-manager` > `dw-time-user`. If a user has both `dw-time-admin` and `dw-time-manager`, they resolve to `Admin`.

- [ ] Configure Azure App Roles `dw-time-admin`, `dw-time-manager`, `dw-time-user` in the Azure app registration manifest (see setup guide below)
- [ ] Request `roles` claim in the `id_token` by adding the scope or configuring the app manifest
- [x] In Azure callback handler: extract `roles` claim array from the `id_token`; resolve to highest-privilege internal role using `AD_ROLE_MAP` and precedence order
- [x] On every Azure AD login, update `employees.role` from the resolved AD role (AD is the source of truth for AD-authenticated users)
- [x] Add `auth_provider` column to `employees` table (`"local"` | `"azure_ad"`, default `"local"`) to distinguish AD-managed users from magic-link users
- [ ] For `auth_provider = "azure_ad"` employees: ignore local role edits in the admin panel (show role as read-only with tooltip "Managed by Azure AD")
- [ ] For `auth_provider = "local"` employees: existing role editing behavior unchanged
- [ ] Validate: AD user with `dw-time-admin` role gets Admin access; AD user with only `dw-time-manager` gets Manager access; AD user with only `dw-time-user` gets Employee access; magic-link users are unaffected

### Phase 3 — Frontend Integration

- [x] Add "Sign in with Microsoft" button to login page (only visible when `AZURE_AD_ENABLED` is `true`)
- [x] Button triggers `GET /api/auth/azure/login` (full-page redirect, not popup)
- [x] On callback redirect back to app, extract session cookie and call `authService.initialize()` as normal
- [x] Ensure existing magic-link UI remains functional and is the default when Azure is disabled
- [ ] Validate: end-to-end browser login with Azure test tenant

### Phase 4 — Token Validation Middleware

- [ ] Extend `validateSessionToken()` in `server/utils/auth.ts` to accept both HS256 (magic-link) and RS256 (Azure) JWTs, OR keep a single HS256 session JWT issued by the server after Azure callback (simpler)
- [x] If using server-issued session JWT for both flows (recommended): no middleware changes needed — Azure callback already issues the same JWT format
- [ ] Add token audience/issuer validation for Azure tokens if directly trusting Azure JWTs
- [x] Validate: existing magic-link auth still works unchanged; Azure-authenticated users see correct role

### Phase 5 — Unit Tests

- [x] Test `azureAdConfig.ts` — correct MSAL config from env vars, disabled when `AZURE_AD_ENABLED=false`
- [ ] Test `/api/auth/azure/login` — redirects to correct Azure URL with expected params
- [ ] Test `/api/auth/azure/callback` — exchanges code, maps email to employee, returns session JWT
- [ ] Test callback with unknown email — auto-provisions employee and returns session JWT
- [x] Test callback with `dw-time-admin` role claim — sets `employees.role` to `ROLE_ADMIN`
- [x] Test callback with `dw-time-manager` role claim (no `dw-time-admin`) — sets `employees.role` to `ROLE_MANAGER`
- [x] Test callback with `dw-time-user` role claim only — sets `employees.role` to `ROLE_EMPLOYEE`
- [x] Test callback with multiple role claims (`dw-time-admin` + `dw-time-manager`) — resolves to highest-privilege role (`ROLE_ADMIN`)
- [x] Test callback without any recognized role claim — sets `employees.role` to `ROLE_EMPLOYEE`
- [ ] Test role sync on repeat login — AD role overrides any local role change for `auth_provider = "azure_ad"` employees
- [x] Test `AD_ROLE_MAP` mapping from `shared/businessRules.ts`
- [ ] Test callback with invalid/expired code — returns 401
- [x] Test feature flag off — Azure endpoints return 404 or are not registered
- [x] Test `isAdmin()` and `isManager()` helpers from `shared/businessRules.ts`
- [x] Validate: `pnpm run test` passes

### Phase 6 — E2E Tests

- [x] E2E: Azure login button visible only when feature flag is on
- [x] E2E: Magic-link flow unaffected when Azure is enabled alongside it
- [ ] E2E: Mock Azure callback to verify session creation (Playwright intercept)
- [ ] Validate: `pnpm run test:e2e` passes

### Phase 7 — Documentation & Quality Gates

- [ ] Update `TASKS/authentication.md` to reference this task
- [ ] Document Azure AD setup in README (tenant registration, redirect URI, env vars)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [ ] Manual testing with real Azure tenant
- [x] Security review: no client secrets in client bundle, PKCE if using SPA flow in future, state parameter for CSRF

## Implementation Notes

- **Single session JWT strategy (recommended)**: After Azure callback validates the user, the server issues the _same_ HS256 session JWT it issues for magic-link users. This means `validateSessionToken()` in `server/utils/auth.ts` requires **zero changes** — both auth flows converge to the same session format. This is the simplest path and avoids dual-algorithm middleware.
- **Feature flag gating**: All Azure routes and UI should be gated behind `AZURE_AD_ENABLED`. When `false`, the app behaves identically to today.
- **Memory budget**: `@azure/msal-node` + `jose` add ~3 MB to `node_modules`. Acceptable for Azure App Service deployment.
- **Deployment targets**: Azure App Service is the primary deployment; Azure AD is enabled there. The DigitalOcean droplet is a personal portfolio instance — magic-link only, `AZURE_AD_ENABLED=false`.
- **No `express-jwt` middleware**: The project uses manual cookie extraction in `server/utils/auth.ts`, not Express middleware for auth. Adding `express-jwt` would introduce a second auth paradigm. Keep the existing pattern.
- **MSAL token cache**: Use in-memory cache (default) for single-instance deployments. If scaling to multiple instances, switch to `msal-node-extensions` distributed cache.
- **State parameter**: The MSAL `getAuthCodeUrl()` call must include a `state` parameter (cryptographic nonce) to prevent CSRF on the callback endpoint.
- **Date handling**: Token expiration checks use `jsonwebtoken` or `jose` built-in `exp` claim validation — no `new Date()` calls needed.
- **Azure AD role precedence**: For employees with `auth_provider = "azure_ad"`, the `roles` claim from each Azure login is the source of truth. The `roles` claim is an **array** — a user can hold multiple AD roles simultaneously (e.g., both `dw-time-admin` and `dw-time-manager`). The server resolves to the highest-privilege internal role: `dw-time-admin` → Admin > `dw-time-manager` → Manager > `dw-time-user` → Employee. The server updates `employees.role` on every Azure callback, so role changes in Azure AD take effect on next login without manual database edits. Magic-link users (`auth_provider = "local"`) are unaffected — their roles are managed locally via the admin panel.
- **Manager role**: The `Manager` internal role is introduced for forward compatibility. Currently, managers have **no additional privileges** beyond a standard employee. Manager-specific features will be specified and implemented in a future task. The role is persisted in `employees.role` so it is ready when those features land.
- **Role constant centralization**: Phase 1b eliminates ~30 scattered `"Admin"` string literals across server, client, and test code. All role logic flows through `ROLE_ADMIN`, `ROLE_MANAGER`, `ROLE_EMPLOYEE`, `isAdmin()`, and `isManager()` from `shared/businessRules.ts`. The `AD_ROLE_MAP` constant centralizes the mapping from Azure app-role values to internal roles, ensuring a single source of truth. This is a prerequisite for safe AD role mapping — without it, adding a second role source would compound the fragility of hardcoded strings.

## Azure App Registration

The following identifiers are from the Azure AD app registration (these are public GUIDs, not secrets):

| Property                    | Value                                  |
| --------------------------- | -------------------------------------- |
| **Application (client) ID** | `a4b9b1c3-1b63-4ec8-9eb9-1c87e474b233` |
| **Object ID**               | `14324ba4-a109-4bd7-8a13-e5d2e53c5a98` |
| **Directory (tenant) ID**   | `c0196b2c-3597-46f7-b2c7-35867478c85e` |

- **Client ID** and **Tenant ID** are set in `.env` as `AZURE_AD_CLIENT_ID` and `AZURE_AD_TENANT_ID`.
- **Object ID** is the Azure portal internal identifier for the app registration — not used in code.
- **Client Secret** must be generated in the Azure portal (Certificates & secrets) and stored in `.env` as `AZURE_AD_CLIENT_SECRET`. This is the only truly sensitive value.

### Azure App Registration Setup Guide

The app registration already exists (Application ID `a4b9b1c3-1b63-4ec8-9eb9-1c87e474b233`). Complete these remaining steps in the Azure Portal:

1. **Generate a Client Secret**
   - Navigate to [Azure Portal → App registrations → DWP Hours Tracker → Certificates & secrets](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Credentials)
   - Click **New client secret**, enter a description (e.g., "DWP Hours Production"), set expiration (recommend 24 months)
   - Copy the **Value** immediately (it's only shown once) → store as `AZURE_AD_CLIENT_SECRET` in `.env`

2. **Configure Redirect URI**
   - Navigate to **Authentication** → **Add a platform** → **Web**
   - Add redirect URI: `https://<your-azure-app>.azurewebsites.net/api/auth/azure/callback`
   - For local dev, also add: `http://localhost:3000/api/auth/azure/callback`
   - Under **Implicit grant and hybrid flows**, leave all checkboxes **unchecked** (we use authorization-code flow, not implicit)

3. **Configure Token Claims**
   - Navigate to **Token configuration** → **Add optional claim** → **ID** token type
   - Add: `email`, `preferred_username`, `given_name`, `family_name`
   - When prompted to add Microsoft Graph permissions, accept

4. **Verify API Permissions**
   - Navigate to **API permissions**
   - Ensure these are present: `openid`, `profile`, `email` (all under Microsoft Graph → Delegated)
   - Click **Grant admin consent** if not already granted

5. **Configure App Roles** (for AD-based role assignment)
   - Navigate to **App roles** → **Create app role**
   - Display name: `DW Time Admin`, Value: `dw-time-admin`, Description: `Full admin access to DWP Hours Tracker`, Allowed member types: **Users/Groups**
   - Create a second role — Display name: `DW Time Manager`, Value: `dw-time-manager`, Description: `Manager access (features TBD)`, Allowed member types: **Users/Groups**
   - Create a third role — Display name: `DW Time User`, Value: `dw-time-user`, Description: `Standard employee access`, Allowed member types: **Users/Groups**
   - Navigate to **Enterprise applications** → **DWP Hours Tracker** → **Users and groups**
   - Assign yourself the `dw-time-admin` role
   - Assign other corporate users the appropriate role(s) — a user may be assigned **multiple** roles; the server resolves to the highest-privilege internal role
   - The `roles` claim will automatically appear in the `id_token` after assignment

6. **Set Environment Variables** (in `.env` on production server)
   ```
   AZURE_AD_ENABLED=true
   AZURE_AD_TENANT_ID=c0196b2c-3597-46f7-b2c7-35867478c85e
   AZURE_AD_CLIENT_ID=a4b9b1c3-1b63-4ec8-9eb9-1c87e474b233
   AZURE_AD_CLIENT_SECRET=<paste secret value from step 1>
   AZURE_AD_REDIRECT_URI=https://<your-azure-app>.azurewebsites.net/api/auth/azure/callback
   ```

## SKILL BUILDER

Create a SKILL.md that describe the AD integration and captures your learnings from the implementation.

## Questions and Concerns

1. ~~Should Azure-authenticated users who don't exist in `employees` be auto-provisioned?~~ **Yes** — auto-provision on first Azure login, same as magic-link flow.
2. ~~Is this a single-tenant setup?~~ **Yes** — single-tenant confirmed (tenant `c0196b2c-3597-46f7-b2c7-35867478c85e`).
3. ~~Should Azure login be the only option for corporate users?~~ **Both methods remain available.** Azure AD is an _additional_ login option. Contractors and external users without Azure AD accounts use magic links. There is no domain-based gating — any user can choose either method (Azure button or magic link). The feature flag `AZURE_AD_ENABLED` controls whether the Azure button _appears_, not who can use magic links.
4. ~~Does the deployment target have outbound HTTPS to Azure?~~ **Yes** — primary deployment is now Azure App Service, which has native outbound access to `login.microsoftonline.com`. The DigitalOcean droplet is a portfolio-only instance with `AZURE_AD_ENABLED=false`.
5. ~~Will app registration be managed by a separate team?~~ **No** — single-developer project. Full setup guide documented above in "Azure App Registration Setup Guide".
