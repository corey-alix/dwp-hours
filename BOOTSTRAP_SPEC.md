# DWP Hours Tracker - Bootstrap Specification

This document outlines the steps and decisions required to bootstrap the DWP Hours Tracker project environment. It serves as a checklist for setting up the Node.js application with SQLite backend, vanilla frontend, and development server.

## Project Overview

Based on the README.md, this is a Node.js application for PTO tracking with:

- Vanilla HTML/CSS/TypeScript frontend
- Node.js backend with SQLite database
- http-serve for development
- RESTful API
- Admin panel for user management

## Pre-Bootstrap Questions

Before scaffolding the project, answer the following questions to guide implementation decisions:

### Environment & Configuration

- What port should the development server run on? (Default: 3000)
- What should the SQLite database file be named? (Suggestion: `dwp-hours.db`)
- Should the application support environment variables for configuration? (e.g., via dotenv)
- What is the base URL/path for the API? (Suggestion: `/api`)

### Authentication & Security

- How will user authentication be handled? (**Decided**: Simple identifier-based login with hash value stored in user table based on username. Users provide the hash when challenged.)
- What are the admin privileges? (**Decided**: Role-based access with "Admin" role on employee record.)
- Should there be password protection for admin panel? (**Decided**: Yes, using hash value from user table.)

### Database & Data

- Should the database include additional fields in employees table? (e.g., hire_date, email, role, hash)
- How to handle PTO rate changes over time? (Store historical rates, or just current?)
- Should sick hours be tracked separately from PTO? (Based on legacy spreadsheet, yes)
- How to calculate available PTO? (Monthly accrual + carryover - used)

### Frontend & UI

- What UI library/framework to use for components? (Vanilla, or minimal like Lit or Preact? Stick to vanilla as specified)
- Should the UI include date pickers? (For date ranges - yes, vanilla or library?)
- How to handle responsive design? (CSS Grid/Flexbox)
- What is the color scheme/theme? (Professional, or match company branding?)

### Development & Build

- What TypeScript configuration? (**Decided**: Strict mode, target ES2020, module "node16" for ES modules and import.meta support)
- Should there be a build step for production? (Bundle JS/CSS, or serve as-is?)
- What testing framework? (**Decided**: Vitest for unit tests, Playwright for integration/E2E tests.)
- Linting and formatting? (**Decided**: Linting with `tsc --noEmit`, formatting with Prettier before every commit.)

### Deployment & Production

- How will the app be deployed? (Heroku, Vercel, self-hosted?)
- Should SQLite be replaced with PostgreSQL for production? (**Decided**: No, use SQLite in production.)
- What logging mechanism? (**Decided**: File-based logging, no external libraries.)

## WSL Environment Setup

**Important**: If developing in Windows Subsystem for Linux (WSL), additional setup is required to avoid UNC path and native compilation issues.

### Node.js Installation in WSL

- [ ] Install Node.js LTS in WSL (not just Windows):
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- [ ] Verify installation: `node --version && npm --version`
- [ ] Configure PATH to prioritize WSL Node.js over Windows Node.js:
  ```bash
  export PATH=/usr/bin:$PATH
  ```
  Add this to `~/.bashrc` for permanent configuration.

### Database Choice for WSL Compatibility

- **Issue**: Native SQLite packages (sqlite3, better-sqlite3) require compilation and fail in WSL due to UNC path restrictions
- **Solution**: Use `sql.js` (pure JavaScript SQLite implementation) instead of native SQLite packages
- **Trade-off**: Slightly slower performance but full WSL compatibility and no native dependencies

### TypeScript Configuration for ES Modules

- [ ] Set `"type": "module"` in `package.json` to enable ES modules
- [ ] Configure `tsconfig.json` with `"module": "node16"` for import.meta support
- [ ] Install `@types/sql.js` for TypeScript definitions

## Bootstrap Checklist

### 1. Project Structure Setup

- [ ] Create project root directory
- [ ] Initialize Git repository
- [ ] Create `package.json` with basic metadata
- [ ] Set up directory structure:
  - `src/` for source code
  - `public/` for static assets
  - `db/` for database files
  - `docs/` for documentation

### 2. Backend Setup

- [ ] Install Node.js dependencies:
  - `express` for server
  - `sql.js` for database (instead of sqlite3 for WSL compatibility)
  - `cors` for cross-origin requests
  - `body-parser` for JSON parsing
  - `@types/sql.js` for TypeScript definitions
- [ ] Create basic Express server (`src/server.js` or `.ts`)
- [ ] Set up SQLite database connection
- [ ] Create database schema files (`db/schema.sql`)
- [ ] Implement basic API routes (health check, etc.)

### 3. Database Schema Implementation

- [ ] Create employees table with fields: id, name, identifier, pto_rate, carryover_hours, role, hash
- [ ] Create pto_entries table with fields: id, employee_id, start_date, end_date, type, hours, created_at
- [ ] Add foreign key constraints
- [ ] Implement hash generation for user authentication
- [ ] Create migration script to initialize database
- [ ] **Note**: When using sql.js, use `stmt.bind(array)` followed by `stmt.run()` for prepared statements, and `db.exec('SELECT last_insert_rowid()')` to get inserted IDs

### 4. API Development

- [ ] Implement employee CRUD endpoints
- [ ] Implement PTO entry endpoints (POST, GET)
- [ ] Implement PTO status calculation endpoint
- [ ] Add input validation and error handling
- [ ] Implement authentication with hash verification
- [ ] Implement admin-only routes with role checking

### 5. Frontend Setup

- [ ] Install TypeScript and configure `tsconfig.json` (module: "node16", strict mode)
- [ ] Add `"type": "module"` to `package.json` for ES modules support
- [ ] Create HTML structure (`public/index.html`)
- [ ] Create CSS stylesheets (`public/styles.css`)
- [ ] Create TypeScript modules for UI components
- [ ] Implement login/authentication UI
- [ ] Create PTO submission form
- [ ] Create dashboard for PTO status display

### 6. Admin Panel

- [ ] Create admin login/authentication
- [ ] Implement employee management UI (add/edit/delete)
- [ ] Create PTO review interface
- [ ] Add reporting features (monthly/yearly summaries)

### 7. Development Environment

- [ ] Install `http-serve` for development server
- [ ] Configure npm scripts:
  - `npm run dev` - start development server
  - `npm run build` - build for production
  - `npm run db:init` - initialize database
- [ ] Set up hot reloading if needed
- [ ] Add environment configuration

### 8. Testing & Quality

- [ ] Set up Vitest for unit testing
- [ ] Set up Playwright for integration and E2E testing
- [ ] Write basic unit tests for API functions
- [ ] Add integration tests for key workflows
- [ ] Configure linting with `tsc --noEmit`
- [ ] Set up code formatting with Prettier and pre-commit hook

### 9. Documentation & Migration

- [ ] Create API documentation (e.g., using Swagger or simple markdown)
- [ ] Document database schema and relationships
- [ ] Create migration script from legacy spreadsheet
- [ ] Update README with setup instructions

### 10. Initial Data & Testing

- [ ] Create sample employee data
- [ ] Import legacy spreadsheet data (if available)
- [ ] Test all major workflows:
  - Employee login and PTO submission
  - Admin user management
  - PTO status calculations
  - API endpoints

### 11. Security & Best Practices

- [ ] Implement input sanitization
- [ ] Add rate limiting to API
- [ ] Secure admin routes
- [ ] Add CORS configuration
- [ ] Review and implement security headers

### 12. Deployment Preparation

- [ ] Create production build script
- [ ] Set up environment variables for production
- [ ] Document deployment process
- [ ] Consider Docker containerization

## Next Steps

After completing the bootstrap checklist:

1. Review all questions and ensure decisions are documented
2. Begin implementation in order of dependencies
3. Test incrementally as features are added
4. Update this specification as the project evolves

## Dependencies Summary

Core Dependencies:

- Node.js (v16+) - **Must be installed in WSL, not just Windows**
- npm or yarn
- sql.js (pure JavaScript SQLite, WSL-compatible)
- Express.js
- TypeScript
- http-serve

Optional/Recommended:

- dotenv (environment variables)
- cors (CORS handling)
- @types/sql.js (TypeScript definitions for sql.js)
- vitest (unit testing)
- playwright (E2E testing)
- prettier (code formatting)
