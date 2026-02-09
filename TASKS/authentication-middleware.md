# Authentication Middleware Implementation

## Description

Implement authentication middleware to secure API endpoints by verifying the `auth_hash` cookie and extracting authenticated employee context. This middleware will be applied to protected routes (like PTO endpoints) to ensure only authenticated users can access sensitive operations and to automatically associate requests with the correct employee without requiring `employeeId` in request bodies.

## Priority

🔥 High Priority

## Checklist

### Phase 1: Middleware Foundation

- [x] Study proper authentication workflows and cookie-based session management
- [x] Design authentication flow: email → magic link → temporal token validation → session cookie creation
- [x] Modify `/api/auth/validate` to return session token instead of database hash
- [x] Create session token format: hash(employee_id + timestamp + salt) with expiration
- [x] Update client-side auth validation to set `auth_hash` cookie with session token
- [x] Create authentication middleware function that validates session token against employee data
- [x] Implement session token validation: extract employee_id, verify hash, check expiration
- [x] Add employee information (id, name, role) to request object when authentication succeeds
- [x] Handle authentication failures with appropriate 401 responses and error logging
- [x] Create middleware wrapper function for easy application to route handlers
- [x] Write unit tests for middleware authentication logic (valid session token, invalid token, expired token, missing cookie)
- [x] Update existing auth tests to reflect new session token approach
- [x] `npm run build` passes
- [x] `npm run lint` passes

### Phase 2: Route Protection

- [x] Apply authentication middleware to all PTO endpoints (`/api/pto/*`)
- [x] Apply authentication middleware to hours submission endpoints (`/api/hours`)
- [x] Apply authentication middleware to acknowledgement endpoints (`/api/acknowledgements`)
- [x] Update route handlers to use `req.employee` instead of extracting employeeId from request body
- [x] Implement role-based access control for admin-only operations (employee management, admin acknowledgements)
- [x] Test that unauthenticated requests return 401 status codes
- [x] `npm run build` passes
- [x] `npm run lint` passes

### Phase 3: Client-Side Integration

- [x] Update APIClient methods to remove `employeeId` parameters from request bodies for authenticated endpoints
- [x] Ensure client automatically sends `auth_hash` cookie with requests (verify cookie configuration)
- [x] Update PTO form component to receive employee context from parent app for validation
- [x] Test end-to-end authentication flow with protected endpoints
- [x] Verify error handling for expired/invalid authentication
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] Run `npm run test` to ensure no regressions

### Phase 4: Security and Edge Cases

- [x] Implement proper CORS handling for cookie-based authentication
- [x] Add rate limiting considerations for authentication endpoints
- [x] Handle cookie expiration and renewal scenarios
- [x] Implement secure logout that clears authentication cookies
- [x] Add comprehensive error logging for authentication failures
- [x] Security review of authentication implementation
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] Run `npm run test` to ensure no regressions

### Quality Gates

- [x] Update API documentation to reflect authentication requirements
- [ ] All protected endpoints require authentication
- [ ] Client-side API calls updated to work with authenticated endpoints
- [ ] Comprehensive test coverage for authentication middleware
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Run `npm run test` to ensure no regressions

## Implementation Notes

- Authentication middleware should be reusable across different route types
- Use existing employee repository and database connection
- Follow existing error handling patterns with proper logging
- Consider performance impact of database lookups on each request
- Ensure middleware doesn't break existing functionality during transition
- Cookie-based authentication requires proper CORS configuration

## Questions and Concerns

1. Resolved: Low traffic with in-memory SQLite database - no performance optimizations needed for database lookups.
2. Resolved: Admins have unrestricted access to all employee data.
3. Resolved: No backward compatibility concerns needed for MVP implementation.
4. Resolved: Authentication cookies persist indefinitely. Users must re-login if cookie is lost or different browser is used. Temporal magic links expire after time period. Currently email not working so links returned in response for clicking.
5. Resolved: If email not found in database, create new user account. Use businessRules.ts for email domain whitelisting, currently accept "test-\*@gmail.com" addresses.
6. Resolved: Production emails magic links. Development/testing returns links in response for login form rendering. Production response tells user to check email for "Time Management Access" message.
7. Resolved: Log server-side failures and provide meaningful error messages via businessRules.ts VALIDATION_MESSAGES when possible.
8. Resolved: No HttpOnly/Secure/SameSite flags needed for localhost test/dev environments; revisit for production.
9. Resolved: Role field is sufficient for admin verification; ensure database lookup rather than trusting user-provided data.
10. **Middleware Application Order**: In what order should authentication middleware be applied relative to other middleware (CORS, body parsing, validation, etc.)?
11. **Testing Authenticated Endpoints**: How should authenticated endpoints be tested in development and CI/CD environments without complex authentication setup?
12. **Error Response Consistency**: What should be the consistent format and content for authentication error responses across all endpoints?
