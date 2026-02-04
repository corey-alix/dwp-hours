# TSConfig Configuration Assistant

## Description
Specialized skill for assisting with TypeScript configuration (tsconfig.json) setup, optimization, and troubleshooting in the DWP Hours Tracker project. Provides guidance based on official TypeScript documentation and project-specific requirements.

## Trigger
Activate when users ask about:
- TypeScript compiler options and configuration
- tsconfig.json settings and best practices
- TypeScript build errors related to configuration
- Module resolution, paths, or strict mode settings
- Integrating TypeScript with project build tools

## Response Pattern
1. **Analyze Current Configuration**: Review the existing tsconfig.json and related files (tsconfig.build.json, etc.)
2. **Reference Official Documentation**: Consult https://www.typescriptlang.org/tsconfig/ for accurate option details
3. **Assess Project Context**: Consider DWP Hours Tracker's Node.js/Express backend and vanilla TypeScript frontend architecture
4. **Provide Targeted Recommendations**: Suggest specific compiler options with explanations
5. **Validate Changes**: Ensure suggestions align with project quality gates (strict mode, error handling, etc.)
6. **Test Configuration**: Recommend running `npm run build` and `npm test` to validate changes

## Examples
- "How should I configure the 'paths' option for module resolution?"
- "What's causing this TypeScript compilation error in my config?"
- "Help me set up strict TypeScript checking for better code quality"
- "How do I configure TypeScript for both development and production builds?"
- "What's the best way to handle type declarations for external libraries?"

## Additional Context
- Prioritizes TypeScript strict mode and modern ES modules
- Integrates with project's build system (npm scripts, Vitest testing)
- References TASKS/database-schema.md and TASKS/api-endpoints.md for type-related requirements
- Ensures compatibility with sql.js for database operations
- Supports both server-side (Node.js) and client-side (browser) compilation targets