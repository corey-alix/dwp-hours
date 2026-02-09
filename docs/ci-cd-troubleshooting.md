# CI/CD Troubleshooting Guide

This guide covers common CI/CD pipeline issues and their solutions for the DWP Hours Tracker project.

## Pipeline Overview

The CI/CD pipeline consists of:
- **Quality Checks**: Linting, TypeScript compilation, build verification
- **Unit Tests**: Vitest unit tests with JUnit reporting
- **E2E Tests**: Playwright end-to-end tests
- **Deployment**: Netlify deployment on successful builds

## Common Issues and Solutions

### 1. Pipeline Fails on Quality Checks

**Symptoms:**
- Build fails during linting or TypeScript compilation
- Error messages about code style or type errors

**Solutions:**
```bash
# Run linting locally
pnpm lint

# Fix formatting issues
pnpm format

# Check TypeScript compilation
pnpm build
```

**Prevention:**
- Run `pnpm lint` and `pnpm build` before committing
- Use pre-commit hooks to catch issues early

### 2. Unit Tests Failing

**Symptoms:**
- Unit test job fails with test failures
- JUnit XML shows failed test cases

**Solutions:**
```bash
# Run unit tests locally
pnpm test:unit

# Run with verbose output
pnpm test:unit --reporter=verbose

# Debug specific test
pnpm test:unit --run specific-test-file
```

**Common Causes:**
- Database state issues in test isolation
- Mock setup problems
- Assertion failures due to changed business logic

### 3. E2E Tests Failing

**Symptoms:**
- E2E test job fails
- Browser screenshots show unexpected UI state
- Database seeding issues

**Solutions:**
```bash
# Run E2E tests locally
pnpm test:e2e

# Run with UI for debugging
pnpm test:e2e --ui

# Check database seeding
pnpm seed
pnpm run start:prod
```

**Common Causes:**
- Database not properly seeded
- Server not starting correctly
- Browser compatibility issues
- Timing issues in test steps

### 4. Dependency Installation Issues

**Symptoms:**
- Pipeline fails during `pnpm install`
- Lockfile conflicts
- Node.js version mismatches

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check Node.js version
node --version

# Update lockfile
pnpm install --frozen-lockfile=false
pnpm install --frozen-lockfile
```

### 5. Playwright Browser Issues

**Symptoms:**
- E2E tests fail with browser launch errors
- Missing browser binaries

**Solutions:**
```bash
# Install Playwright browsers
npx playwright install --with-deps

# Check browser installation
npx playwright install-deps
```

### 6. Database Connection Issues

**Symptoms:**
- Tests fail with database connection errors
- SQLite file not found or corrupted

**Solutions:**
```bash
# Initialize database
pnpm run db:init

# Seed test data
pnpm seed

# Check database file
ls -la db/dwp-hours.db
```

### 7. Git Hook Issues

**Symptoms:**
- Pre-commit or pre-push hooks fail unexpectedly
- Hooks run when they shouldn't

**Solutions:**
```bash
# Bypass hooks for urgent commits
git commit --no-verify
git push --no-verify

# Check hook configuration
cat .husky/pre-commit
cat .husky/pre-push

# Reinstall hooks
pnpm run prepare
```

### 8. Performance Issues

**Symptoms:**
- Pipeline takes too long to complete
- Tests timeout
- Build performance degrades

**Expected Performance:**
- Full pipeline: ~3-4 minutes
- Quality checks only: ~1-2 minutes
- E2E tests only: ~2-3 minutes
- Individual test execution: < 100ms for balance calculations

**Solutions:**
- Check test execution times in CI logs
- Optimize slow tests by reducing unnecessary operations
- Review dependency installation caching
- Consider parallel test execution if database conflicts are resolved
- Monitor for performance regressions in test suites

### 9. Deployment Issues

**Symptoms:**
- Netlify deployment fails
- Build succeeds but deployment doesn't work

**Solutions:**
- Check Netlify build logs
- Verify build output in `dist/` and `public/`
- Test production build locally: `pnpm run start:prod`
- Check environment variables in Netlify dashboard

### 10. Flaky Tests

**Symptoms:**
- Tests pass locally but fail in CI intermittently
- Race conditions or timing issues

**Solutions:**
- Add retry logic for flaky tests
- Increase timeouts for slow operations
- Use `waitFor` functions instead of fixed delays
- Isolate tests better to prevent interference

## Manual Override Procedures

### Emergency CI Bypass

For critical fixes that need immediate deployment:

1. **Use bypass flags**:
   ```bash
   git commit --no-verify -m "Emergency fix"
   git push --no-verify
   ```

2. **Temporarily disable branch protection** in GitHub Settings if needed

3. **Monitor deployment** closely after bypass

### Manual Deployment

If CI deployment fails:

1. **Build locally**:
   ```bash
   pnpm build
   pnpm run start:prod
   ```

2. **Test production build** thoroughly

3. **Deploy manually** to Netlify via drag-and-drop or CLI

### Rollback Procedures

1. **Git rollback**:
   ```bash
   git revert <problematic-commit>
   git push
   ```

2. **Netlify rollback** via deployment history

3. **Database rollback** if needed:
   ```bash
   pnpm run migrate -- --rollback-latest
   ```

## Monitoring and Alerts

### Pipeline Performance Monitoring

- **Build duration**: Monitored via GitHub Actions timing
- **Test failure rates**: Tracked in JUnit reports
- **Deployment success**: Netlify deployment status

### Alert Configuration

Currently alerts are logged to CI output. For enhanced monitoring:

1. **GitHub Notifications**: Configure in repository settings
2. **Slack Integration**: Add webhook notifications
3. **Email Alerts**: Set up commit email notifications

## Best Practices

### Development Workflow

1. **Run full test suite locally** before pushing
2. **Use feature branches** for development
3. **Keep commits small** and focused
4. **Review CI results** after each push

### Test Maintenance

1. **Fix flaky tests** immediately when discovered
2. **Keep test data** synchronized with application data
3. **Monitor test execution times** and optimize slow tests
4. **Update tests** when business logic changes

### CI/CD Maintenance

1. **Keep dependencies updated** regularly
2. **Monitor pipeline performance** and optimize as needed
3. **Review and update** workflow configurations
4. **Document new issues** and solutions in this guide

## Getting Help

If you encounter issues not covered here:

1. Check GitHub Actions logs for detailed error messages
2. Review recent commits for potential causes
3. Test locally with the same commands as CI
4. Create an issue with full error logs and reproduction steps