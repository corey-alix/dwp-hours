# API Type Safety

## Description
Implement strong typings for the API client to enable type-safe consumption of server services. The current APIClient lacks strong types, making it prone to runtime errors and reducing developer experience. Both server and client should be constrained by the same models to ensure consistency. Explore options similar to Swagger's approach for generating API proxies or defining shared models.

## Priority
🟡 Medium Priority

## Checklist
- [ ] Analyze current API endpoints in server.mts and identify all request/response types
- [ ] Define shared TypeScript interfaces/models for API data structures (e.g., Employee, PTOEntry, etc.)
- [ ] Evaluate options for type-safe API integration:
  - [ ] Option 1: Generate OpenAPI/Swagger spec from Express routes and use codegen tools (e.g., openapi-typescript) to generate client types
  - [ ] Option 2: Create shared model definitions in a common package/library used by both server and client
  - [ ] Option 3: Implement tRPC or similar type-safe RPC framework to replace REST API
  - [ ] Option 4: Hand-code client proxy classes with strong types based on server interfaces
- [ ] Choose and implement the selected approach
- [ ] Update APIClient.ts to use strongly typed methods
- [ ] Ensure server routes validate against the same models
- [ ] Write unit tests for type safety and API integration
- [ ] Add E2E tests for client-server communication with types
- [ ] Update API documentation with type definitions
- [ ] Manual testing of type safety in development workflow
- [ ] Code review, linting, and build verification

## Implementation Notes
- Preferred approach: Option 1 (Swagger-like) for automatic generation, falling back to Option 2 if generation is complex
- Ensure models cover all entities: Employee, PTOEntry, MonthlyHours, Acknowledgement, AdminAcknowledgement
- Consider using tools like `swagger-jsdoc` for Express route documentation or `zod` for runtime type validation
- Maintain backward compatibility during transition
- Follow project's TypeScript strict mode and error handling patterns