# Email Magic Link

## Description
Implement email delivery for the magic link authentication flow so users receive their login link via SMTP instead of only returning it in API responses. Use environment-based configuration for SMTP credentials and sender details, while preserving test-mode behavior for E2E tests.

## Priority
🔥 High Priority

## Checklist
- [ ] Add SMTP configuration via environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SENDER_NAME`, `SENDER_EMAIL`)
- [ ] Implement a reusable mailer utility using Nodemailer (transport creation, send function, error handling)
- [ ] Update authentication magic-link request endpoint to send email in non-test mode
- [ ] Preserve test-mode behavior to return the magic link directly for E2E testing
- [ ] Add input validation and error responses for email send failures
- [ ] Add unit tests for mailer utility (mock transporter)
- [ ] Add API tests for magic-link request behavior (test mode vs non-test mode)
- [ ] Update documentation (README, environment setup) with SMTP configuration requirements
- [ ] Verify build and lint pass (`npm run build`, `npm run lint`)
- [ ] Manual testing of magic-link email delivery

## Implementation Notes
- Use `dotenv` for local development configuration loading.
- Avoid `tls.rejectUnauthorized = false` in production; limit to local development if needed.
- Provide clear logging on send failures using the existing `log()` helper.
- Do not expose the magic link in API responses outside test mode.
- Consider `transporter.verify()` on startup for fast feedback in dev.

## Testing
- Unit tests: mock Nodemailer transporter, verify `sendMail` called with expected `to`, `from`, `subject`, and body.
- API tests: exercise `/api/auth/request-link` in test mode (returns magic link) and non-test mode (no link returned, email send attempted).
- Manual: use a real SMTP provider or ethereal.email to confirm deliverability.
