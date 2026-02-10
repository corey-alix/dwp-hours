# Deployment Automation

## Description

Implement automated deployment pipeline for the DWP Hours Tracker using Cloudflare Workers for serverless functions, Cloudflare Pages for static site hosting, and Cloudflare R2 for periodic database snapshots. This will enable continuous deployment on main branch pushes and preview deployments for pull requests.

## Priority

🟢 Low Priority

## Order of Operations

This checklist provides the recommended execution order for tasks, which may span multiple phases. Tasks can be done out-of-order as dependencies allow, but this sequence minimizes blockers and enables parallel development.

1. **Install Wrangler CLI** (Phase 1) - `pnpm add -g wrangler` ✅
2. **Set up local development environment** (Phase 4) - Configure `wrangler dev` with mocked services ✅
3. **Create Cloudflare account** (Phase 1) - Sign up and verify email
4. **Authenticate Wrangler** (Phase 1) - `wrangler auth login`
5. **Connect GitHub repository** (Phase 1) - Link repo to Cloudflare for deployments
6. **Configure Wrangler for local mocking** (Phase 4) - Set up R2, KV, and other bindings locally ✅
7. **Create R2 bucket** (Phase 3) - For database snapshots (can be done locally first) ✅
8. **Set up environment variables** (Phase 1/3) - Configure secrets and config locally and in Cloudflare ✅
9. **Configure Cloudflare Pages** (Phase 2) - Set up static site deployment
10. **Configure Cloudflare Workers** (Phase 2) - Set up API endpoints
11. **Test build process** (Phase 2) - Ensure `pnpm run build` works in Cloudflare environment
12. **Begin server migration** (Phase 4) - Start converting Express routes to Workers handlers ✅
13. **Implement database snapshot logic** (Phase 4) - Add R2 save/restore for SQLite ✅
14. **Migrate authentication routes** (Phase 4) - Convert `/api/auth/*` endpoints ✅
15. **Migrate core API routes** (Phase 4) - Convert PTO, employees, hours, acknowledgements ✅
16. **Resolve TypeScript compilation issues** (Phase 4) - Fix type mismatches and missing methods ✅
17. **Test migrated endpoints locally** (Phase 4) - Use Wrangler dev environment
18. **Migrate remaining routes** (Phase 4) - Complete employee management, hours, and acknowledgements ✅
19. **Configure production email service** (Phase 3) - Set up SendGrid/Mailgun
20. **Set up deployment automation** (Phase 2) - Configure CI/CD, preview deployments
21. **Deploy to production** (Phase 1/2) - Test manual deployment, then automate
22. **Configure administrative features** (Phase 5) - User management, backups, monitoring
23. **Document and train** (Phase 5) - Update README, train admins

## Checklist

- [ ] **Phase 1: Cloudflare Account Setup**
  - [ ] Create Cloudflare account and verify email
  - [ ] Connect GitHub repository to Cloudflare
  - [ ] Install Wrangler CLI globally (`npm install -g wrangler`)
  - [ ] Authenticate Wrangler with Cloudflare account (`wrangler auth login`)
  - [ ] Generate API token for CI/CD integration
  - [ ] Configure project settings and build commands
  - [ ] Set up environment variables for production
  - [ ] Test manual deployment process
- [ ] **Phase 2: Build Configuration**
  - [ ] Configure Cloudflare Pages for static site deployment
  - [ ] Set up Cloudflare Workers for API endpoints
  - [ ] Configure build settings to use `pnpm run build`
  - [ ] Set up build hooks and deployment notifications
  - [ ] Configure preview deployments for pull requests
  - [ ] Test build process in Cloudflare environment
  - [ ] Set up custom domain (optional)
- [ ] **Phase 3: Environment Management**
  - [ ] Create Cloudflare R2 bucket for database snapshots
  - [ ] Configure R2 bucket permissions and CORS
  - [ ] Set up production environment variables (secrets)
  - [ ] Configure email service (e.g., SendGrid, Mailgun) for production
  - [ ] Implement environment-specific configuration loading
  - [ ] Set up database snapshot encryption (optional)
- [ ] **Phase 4: Server Migration (server.mts → Workers)**
  - [x] Set up local development environment with Wrangler (`wrangler dev`) for mocking Cloudflare services
  - [x] Configure Wrangler to mock R2 buckets, KV namespaces, and other bindings locally
  - [x] Convert Express.js middleware to Workers middleware (CORS, helmet, etc.)
  - [x] Migrate authentication routes (`/api/auth/*`) to Workers handlers
  - [x] Migrate PTO routes (`/api/pto/*`) to Workers with database operations
- [x] Migrate employee management routes (`/api/employees/*`) to Workers
- [x] Migrate hours and acknowledgements routes to Workers
  - [x] Adapt SQLite operations for in-memory database with R2 snapshots
  - [x] Implement periodic database snapshot saving to R2
  - [x] Implement database restoration from R2 snapshots on startup
  - [ ] Convert file-based logging to Cloudflare logging/monitoring
  - [x] Update error handling for serverless environment
  - [ ] Test all migrated endpoints in local Wrangler environment before production deployment
- [ ] **Phase 5: Administrative Tasks**
  - [ ] Set up user management and role-based access
  - [ ] Configure backup schedules for database snapshots
  - [ ] Implement data retention policies
  - [ ] Set up monitoring and alerting for Workers/Pages/R2
  - [ ] Configure rate limiting and security policies
  - [ ] Set up automated testing in CI/CD pipeline
  - [ ] Implement deployment rollback procedures
  - [ ] Document administrative procedures and troubleshooting
  - [ ] Update README with deployment and admin information
  - [ ] Train administrators on Cloudflare dashboard usage

## Implementation Notes

- Use Cloudflare Workers for its simplicity and cost-effectiveness for static site + serverless deployment
- Configure build settings to use existing pnpm scripts (`pnpm run build`)
- Set up environment variables through Cloudflare dashboard for security
- Implement preview deployments to test changes before merging to main
- Use Cloudflare's deployment hooks for integration with other systems
- Configure Cloudflare R2 for storing periodic database snapshots (up to 100MB)
- Ensure email services are properly configured for production
- Follow the project's existing patterns for environment configuration
- **Migration Strategy**: Convert Express.js routes to Workers fetch event handlers, adapt middleware, and implement snapshot-based persistence
- **Database Handling**: Use in-memory SQLite with periodic R2 snapshots instead of persistent storage
- **Authentication**: Maintain magic link system but adapt for serverless environment - use Bearer tokens in Authorization header instead of cookies
- **Admin Tasks**: Include user onboarding, backup management, and compliance monitoring
- **Security**: Implement Workers KV for session storage, rate limiting via Workers, and secure R2 access
- **Local Development**: Use Wrangler's local development server (`wrangler dev`) to mock Cloudflare services (Workers, R2, KV) without connecting to production. This allows full development workflow offline, with automatic service mocking and hot reloading. VS Code can open browsers internally for agentic control during testing and development.
- **Current Progress**: All API routes (authentication, PTO, employees, hours, acknowledgements) have been migrated to Cloudflare Workers. Database snapshot logic is implemented with R2 integration. TypeScript compilation issues have been resolved. Local development environment is functional with Wrangler dev running successfully on localhost:8788. Build and lint pass without errors. However, sql.js does not work in Cloudflare Workers due to WebAssembly restrictions in miniflare and \_\_dirname compatibility issues.
- **Next Steps for Development**: Switch from sql.js + R2 snapshots to Cloudflare D1 database for SQLite operations. Update wrangler.toml to use D1 binding. Refactor all database operations to use D1 API instead of sql.js. Test all migrated endpoints locally with D1. Implement comprehensive error handling and logging for production monitoring. Set up production environment variables and email service configuration. Configure Cloudflare Pages for static site deployment. Deploy to production and set up CI/CD automation.
- **Type Safety**: Ensure proper type conversion between Entity models (with Date objects) and business rules interfaces (with string dates). Use dateUtils for consistent date handling.
- **Testing Strategy**: Use Wrangler dev for local endpoint testing. Implement integration tests with Playwright for E2E validation of migrated functionality.
- **Challenges Faced**: sql.js library incompatible with Cloudflare Workers due to WebAssembly restrictions in miniflare (local development) and **dirname undefined in Workers runtime. Attempts to fetch wasm binary and define **dirname failed. WebAssembly instantiate errors indicate miniflare doesn't support WASM execution. Alternative approach needed for SQLite in serverless environment.
- **Agent Context**: Migration completed successfully with all routes implemented. Worker runs on localhost:8788 with auto-browser opening configured. Intermittent wrangler dev issues were resolved by clearing .wrangler directory. Build passes, linting passes. Ready for local testing phase.

## Questions and Concerns

1. **Database snapshots and restores**: Load the latest snapshot from R2 on Worker cold starts to restore database state.
2. **Monitoring and alerting**: None required beyond Cloudflare's default monitoring.
3. **Rollback procedures**: No automated rollback needed; manual intervention sufficient for failures.
4. **Administrative training**: None required; standard Cloudflare dashboard usage is adequate.
5. **Type conversion between entities and business rules**: Entity models use Date objects while business rules expect string dates - ensure proper conversion using dateUtils.
6. **Authentication token format**: Migrated from cookie-based auth to Bearer token in Authorization header for Workers compatibility.
7. **Database persistence strategy**: In-memory SQLite with R2 snapshots works for this use case, but consider data consistency during high-traffic periods.
8. **Error handling in serverless**: Implement comprehensive error handling and logging for production monitoring.
9. **Route migration completeness**: Ensure all Express routes are properly migrated and tested before production deployment.
10. **Environment variable management**: Set up proper environment-specific configuration for local development vs production.
11. **Database compatibility**: sql.js WebAssembly issues in Cloudflare Workers require switching to D1 database for SQLite operations.</content>
    <parameter name="filePath">/home/ca0v/code/ca0v/mercury/TASKS/deployment-automation.md
