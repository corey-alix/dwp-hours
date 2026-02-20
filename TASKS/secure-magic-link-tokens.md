# Secure Magic Link Tokens

## Description

Enhance the security and reliability of the magic link authentication system by embedding the expiration timestamp and recipient email directly into the JWT token. Remove the separate 'ts' query parameter from magic links. Implement two distinct token types: short-lived magic link tokens (1 hour expiration) and long-lived session tokens (10 years expiration).

## Priority

🔥 High Priority

## Checklist

### Stage 1: Token Generation Updates

- [x] Install and configure JWT library (jsonwebtokens) for server-side token handling
- [x] Update `/api/auth/request-link` endpoint to generate JWT tokens containing:
  - Email identifier
  - Expiration timestamp (1 hour from creation)
  - Issuer and audience claims for security
- [x] Remove 'ts' parameter from magic link URL generation
- [x] Update magic link URL format to use only the JWT token
- [ ] Lint validation

### Stage 2: Token Validation Updates

- [x] Update `/api/auth/validate` endpoint to:
  - Parse and verify JWT token instead of separate token/ts parameters
  - Validate embedded expiration timestamp
  - Validate embedded recipient email matches the requesting user
  - Return appropriate error responses for expired, invalid, or mismatched tokens
- [x] Remove 'ts' parameter handling from validation logic
- [x] Update error messages to reflect new token structure
- [ ] Lint validation

### Stage 3: Session Token Longevity

- [x] Update session token generation in `/api/auth/validate` to create JWT tokens with 10-year expiration
- [x] Ensure session tokens include necessary claims (employee email)
- [x] Update client-side cookie handling to accept long-lived tokens
- [ ] Lint validation

### Stage 4: Frontend Updates

- [x] Update `UIManager.ts` checkAuth method to remove 'ts' parameter extraction and usage
- [x] Update `APIClient.validateAuth` method to send only the token parameter
- [ ] Test magic link flow end-to-end with new token structure
- [x] Update any hardcoded magic link generation in tests
- [ ] Lint validation

### Stage 5: Testing and Validation

- [x] Install jsonwebtoken package: `pnpm add jsonwebtoken @types/jsonwebtoken`
- [ ] Run `pnpm run build` to validate compilation
- [ ] Run `pnpm run lint` to validate code quality
- [x] Write unit tests for JWT token generation and validation
- [x] Write unit tests for expiration and recipient validation
- [x] Update E2E tests to work with new magic link format
- [ ] Manual testing of magic link expiration behavior
- [ ] Manual testing of session token longevity
- [ ] Security testing to ensure tokens cannot be tampered with
- [ ] Update API documentation for new token endpoints

## Implementation Notes

- Use the `jsonwebtoken` npm package for JWT handling
- Store JWT secret in environment variables (HASH_SALT can be reused or create dedicated JWT_SECRET)
- Magic link tokens: exp = now + 1 hour, include email for recipient validation
- Session tokens: exp = now + 10 years, include employee ID and role
- Ensure smooth migration: old magic links with 'ts' should gracefully fail with clear error messages
- Follow existing error handling patterns in the codebase
- Update any logging to reflect new token structure

## Questions and Concerns

1.
2.
3.
