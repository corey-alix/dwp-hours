# Migrate Scripts to TypeScript

## Description

Create a checklist-driven plan to migrate the JavaScript files in scripts/ to TypeScript while preserving behavior and aligning with existing build, lint, and runtime patterns.

## Priority

🟢 Low Priority

## Checklist

- [x] Inventory all JavaScript files in scripts/ and map their responsibilities
- [x] Decide TypeScript target (ESM) and runtime strategy for scripts (tsx, node + ts-node, or build step)
- [x] Add new tsconfig-scripts.json (or similar) for scripts without impacting existing builds
- [x] Add or update tsconfig settings for scripts (if needed) without impacting existing builds
- [x] Convert scripts/ files from .js to .ts with minimal behavior changes
- [x] Replace CommonJS patterns (if any) with ESM-compatible TypeScript patterns
- [x] Add type annotations for external dependencies (sql.js, fs, path, child_process, etc.)
- [x] Ensure all imports use the correct file extensions for ESM after compilation
- [x] Update package.json scripts to run the TypeScript versions
- [x] Add lint:script command to package.json and wire it into lint
- [x] Validate migration scripts still operate with the sql.js database workflow
- [x] Update documentation in README or TASKS as needed
- [x] Run lint, build, and manual script verification

## Implementation Notes

- Keep runtime behavior identical; focus on type safety and clarity.
- Prefer the existing project conventions for ESM and TypeScript strictness.
- If a build step is introduced for scripts, keep it separate from client/server builds to avoid slowing tests.
- Validate that seed and migrate flows still run in CI and local workflows.
