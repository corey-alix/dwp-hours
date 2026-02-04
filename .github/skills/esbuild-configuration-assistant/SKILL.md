# ESBuild Configuration Assistant

## Description
Specialized skill for configuring and optimizing ESBuild bundler setup in the DWP Hours Tracker project. Provides guidance on fast compilation, bundling, and build optimization using ESBuild's features and API.

## Trigger
Activate when users ask about:
- ESBuild installation and initial setup
- Build configuration and optimization options
- Plugin integration and custom loaders
- Bundle splitting and code splitting strategies
- Performance optimization and minification
- Integration with existing TypeScript/Node.js workflows

## Response Pattern
1. **Assess Current Build System**: Review existing build tools (TypeScript compiler, npm scripts) and project structure
2. **Reference ESBuild Documentation**: Consult https://esbuild.github.io/ for configuration options and best practices
3. **Evaluate Project Needs**: Consider DWP Hours Tracker's Node.js backend, vanilla frontend, and testing requirements
4. **Provide Configuration Recommendations**: Suggest ESBuild config with entry points, output settings, and plugins
5. **Optimize for Performance**: Recommend bundling strategies, tree shaking, and minification options
6. **Integrate with Development Workflow**: Ensure compatibility with existing npm scripts, testing, and deployment
7. **Test and Validate**: Recommend running builds and tests to verify configuration works correctly

## Examples
- "How do I set up ESBuild for fast TypeScript compilation?"
- "What's the best way to configure ESBuild for both development and production builds?"
- "How can I use ESBuild plugins to handle CSS and assets?"
- "Help me optimize my build with ESBuild's code splitting features"
- "How do I integrate ESBuild with my existing npm build scripts?"

## Additional Context
- Focuses on ESBuild's speed advantages for large TypeScript projects
- Considers compatibility with sql.js database operations and Express server
- Integrates with project's testing suite (Vitest) and E2E testing (Playwright)
- References TASKS/api-endpoints.md for build output requirements
- Ensures build outputs work with http-serve development server
- Prioritizes development experience with watch mode and source maps