# Pnpm Migration

## Status: ✅ COMPLETED
Migration completed successfully. All tests pass with dynamic port assignment, and the development workflow supports multiple git worktrees with automatic environment configuration.

## Description
Migrate the DWP Hours Tracker project to use pnpm as the package manager, implement support for multiple git worktrees, and assign unique server ports for each worktree to prevent port conflicts during development. The project is currently halfway through this conversion.

## Priority
🟢 Low Priority

## Checklist
- [x] Audit current npm/pnpm usage and identify all scripts/commands that need updating
- [x] Update all package.json scripts to use pnpm instead of npm where applicable
- [x] Ensure pnpm-lock.yaml is properly generated and committed
- [x] Test package installation and script execution with pnpm in a clean environment
- [x] Implement worktree port assignment system using get-worktree-port.sh script
- [x] Update nodemon.json to remove hardcoded PORT and rely on environment variables
- [x] Modify start:prod script to use PORT environment variable with fallback
- [x] Update playwright.config.ts to use dynamic PORT for webServer and baseURL
- [x] Replace all hardcoded localhost:3000 references in e2e tests with relative paths
- [x] Add automatic PORT setting for mars worktree shells via bashrc configuration
- [x] Update test scripts to run worktree:port before execution for port visibility
- [x] Verify that multiple worktrees can run simultaneously on different ports
- [x] Test E2E suite runs correctly with dynamic ports
- [x] Update documentation to reflect pnpm usage and worktree setup
- [x] Ensure CI/CD pipelines (if any) are updated for pnpm
- [x] Manual testing of development workflow in multiple worktrees
- [x] Code review of all migration changes
- [x] Lint and build verification across all configurations

## Implementation Notes
- Worktree port assignment is handled by the `setWorkspaceEnvironment()` function in `~/.bashrc`, assigning ports based on planet names (mars=3004, etc.)
- Use npm-run-all for complex script orchestration
- Playwright's baseURL handles dynamic port resolution for tests
- Environment variables should be preferred over hardcoded values
- Ensure backward compatibility where possible during transition
- Document the worktree setup process for team members

## Workflow Changes for npm Users

If you're familiar with npm, here are the key changes to your workflow when using pnpm:

- **Installation**: Use `pnpm install` instead of `npm install` to install all dependencies.
- **Adding packages**: Use `pnpm add <package>` instead of `npm install <package>`.
- **Removing packages**: Use `pnpm remove <package>` instead of `npm uninstall <package>`.
- **Running scripts**: Use `pnpm run <script>` instead of `npm run <script>`. You can also use `pnpm <script>` directly for scripts defined in package.json.
- **Listing packages**: Use `pnpm ls` instead of `npm ls`.
- **Updating packages**: Use `pnpm update` instead of `npm update`.

Do not mix commands: avoid using `npm run` with `pnpm install`. Use pnpm consistently for all package management tasks. Pnpm uses `pnpm-lock.yaml` instead of `package-lock.json`, and it creates a more efficient node_modules structure with symlinks, which can be faster and use less disk space.

To help avoid accidental use of npm during the transition, you can manually set the alias by running `alias npm='pnpm'` in your terminal (this lasts for the current session only). For a permanent solution, the global `~/.bashrc` setup already includes this alias for worktree directories.

For automatic setup in VS Code terminals, the project includes a `.bashrc` file and VS Code workspace settings that automatically source the alias script and set the PORT environment variable when opening any terminal in VS Code.

Alternatively, for global automatic setup in all terminals (recommended), the environment setup is configured in `~/.bashrc` with a `setWorkspaceEnvironment()` function that automatically sets PORT and aliases for all worktrees (earth, jupiter, mars, mercury, saturn) whenever you're in those directories. This provides seamless environment configuration across all terminals and worktrees.

## Questions and Concerns
1. Should we maintain npm as a fallback option for users who prefer it? **No.**
2. How should we handle port conflicts if worktrees exceed the predefined planet ports? **They will not - there are 5 worktrees and the main project folder: dwp-hours earth jupiter mars mercury saturn.**
3. Are there any CI/CD systems that need updating for pnpm? **No.**
4. Should we add validation to prevent running multiple servers on the same port? **How? I think we just need to be sure this worktree runs on port 3004.**</content>
<parameter name="filePath">/home/ca0v/code/ca0v/mars/TASKS/pnpm-migration.md