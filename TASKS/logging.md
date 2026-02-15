# Logging System

## Description

Implement a comprehensive logging system for the DWP Hours Tracker that provides daily log rotation, configurable log levels, and structured logging with proper error tracking and monitoring capabilities.

## Priority

🟢 Low Priority

## Checklist

- [x] **Phase 1: Design and Planning**
  - [x] Analyze current logging needs and requirements
  - [x] Define log levels (error, warn, info, debug)
  - [x] Design log format and structure (timestamp, level, message, context)
  - [x] Plan log rotation strategy (daily rotation, retention policy)
  - [x] Document logging best practices and usage guidelines

- [x] **Phase 2: Core Implementation**
  - [x] Create logs directory structure (`logs/`)
  - [x] Implement daily log rotation function (`getLogPath()`)
  - [x] Create structured logging function with configurable levels
  - [x] Add context information to logs (request ID, user ID, etc.)
  - [x] Implement log file size limits and rotation

- [x] **Phase 3: Log Management**
  - [x] Implement log cleanup for old files (retention policy)
  - [x] Add log compression for archived files
  - [x] Create log monitoring and alerting capabilities
  - [x] Add log search and filtering functionality

- [x] **Phase 4: Integration and Configuration**
  - [x] Integrate logging into all server endpoints and operations
  - [x] Add environment-based log level configuration
  - [x] Implement request/response logging middleware
  - [x] Add error boundary logging for unhandled exceptions

- [x] **Phase 5: Testing and Validation**
  - [x] Write unit tests for logging functions and rotation
  - [x] Test log rotation behavior (daily rotation, cleanup)
  - [x] Validate log format and structure
  - [x] Test logging under different error conditions
  - [x] Add E2E tests for logging integration

- [x] **Phase 6: Documentation and Deployment**
  - [x] Update API documentation with logging configuration
  - [x] Document logging procedures in deployment guide
  - [x] Add logging monitoring to health checks
  - [x] Manual testing of logging functionality
  - [x] Code review and linting

## Implementation Notes

- Use daily log files with timestamped filenames (YYYY-MM-DD.log)
- Implement log levels with environment variable control (LOG_LEVEL, defaults to INFO)
- Support configurable log format (LOG_FORMAT: json|text, defaults to json)
- Support configurable auto-cleanup (LOG_AUTO_CLEANUP: yes|no, defaults to yes)
- Follow existing error handling patterns
- Ensure logging doesn't impact performance
- Add request IDs for tracing distributed operations
- Consider log aggregation for production monitoring
- Implement structured JSON logging for better parsing (when format=json)

## Questions and Concerns

1. Should we implement structured JSON logging or keep human-readable text format?
   - **Decision**: Keep flat, human readable format

2. How should we handle sensitive information in logs (passwords, tokens)?
   - **Decision**: Sensitive data will not get logged, just events, not data

3. Do we need log aggregation and centralized logging in production?
   - **Decision**: Do log aggregation, just keep rolling with a new log file each day, manual deletions

4. Should log levels be configurable per module or globally?
   - **Decision**: We do need log levels, one for dev/debug and one for system events, setting can go in event variables or .env file
