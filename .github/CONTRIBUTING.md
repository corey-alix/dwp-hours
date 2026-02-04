# Contributing to DWP Hours Tracker

Thank you for your interest in contributing to the DWP Hours Tracker! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites
- Node.js 18+ (see `.github/copilot-instructions.md` for WSL setup)
- npm or yarn
- Git

### Getting Started
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/dwp-hours-tracker.git`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`
5. Build the project: `npm run build`

### Development Workflow
1. Choose a task from `TASKS/README.md`
2. Create a feature branch: `git checkout -b feature/task-name`
3. Implement the changes following our [code quality standards](#code-quality-standards)
4. Test thoroughly (see [testing requirements](#testing-requirements))
5. Update task checklists in `TASKS/`
6. Commit with clear messages
7. Create a pull request

## Task Management

### Task Priority Order
Follow the priority order defined in `TASKS/README.md`:

1. 🔥 **High Priority**: database-schema.md, authentication.md, pto-calculations.md, api-endpoints.md
2. 🟡 **Medium Priority**: admin-panel.md, testing-suite.md
3. 🟢 **Low Priority**: data-migration.md, security-production.md

### Task Implementation
- Always reference the relevant `TASKS/[task-file].md`
- Complete all checklist items before marking a task as done
- Update checklists as you work
- Ensure dependencies are completed first

## Code Quality Standards

### TypeScript
- Use strict mode (enabled by default)
- Proper type annotations for all variables and functions
- Avoid `any` type except when necessary
- Use interfaces for complex objects

### Error Handling
```typescript
try {
  // Implementation
} catch (error) {
  log(`Error description: ${error}`);
  res.status(500).json({ error: 'User-friendly message' });
}
```

### Database Operations
- Use prepared statements: `stmt.bind([values])`
- Always call `saveDatabase()` after writes
- Handle SQL constraints gracefully

### API Design
- RESTful endpoints under `/api/`
- Proper HTTP status codes
- Input validation on all endpoints
- Consistent response formats

## Testing Requirements

### Manual Testing
- Test all new features manually
- Verify error cases are handled
- Test with different user roles
- Check responsive design

### Automated Testing
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Maintain test coverage standards

### Quality Gates
Before submitting a PR, ensure:
- ✅ `npm run build` passes
- ✅ `npm run lint` passes
- ✅ Manual testing completed
- ✅ Task checklists updated

## Pull Request Process

1. **Create Issue First**: Use issue templates for task implementation
2. **Branch Naming**: `feature/task-name` or `bugfix/issue-description`
3. **Commit Messages**: Clear, descriptive messages
4. **PR Template**: Fill out all sections of the PR template
5. **Code Review**: Address reviewer feedback
6. **Merge**: Squash merge with descriptive commit message

## Architecture Guidelines

### Backend (Express + SQLite)
- Routes in `src/server.ts`
- Database operations use sql.js
- File-based logging to `logs/app.log`

### Frontend (Vanilla TypeScript)
- Components in `public/app.ts`
- API client handles HTTP requests
- UIManager handles UI state

### Build System
- TypeScript compilation to `dist/` and `public/`
- http-serve for development
- npm scripts for all operations

## Security Considerations

- Input validation on all user inputs
- SQL injection prevention with prepared statements
- CORS configuration for API access
- No sensitive data in logs
- Secure authentication implementation

## Getting Help

- Check `TASKS/README.md` for task guidance
- Review `.github/copilot-instructions.md` for implementation patterns
- Create an issue for questions or blockers
- Join discussions on existing issues

## Recognition

Contributors will be recognized in the project documentation and Git history. Thank you for helping improve the DWP Hours Tracker!</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/.github/CONTRIBUTING.md