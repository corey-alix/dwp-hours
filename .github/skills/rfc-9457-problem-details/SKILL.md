---
name: rfc-9457-problem-details
description: Specialized assistant for implementing RFC 9457 compliant problem details in HTTP API error responses.
---

# RFC 9457 Problem Details Assistant

## Description

Specialized assistant for implementing RFC 9457 compliant problem details in HTTP API error responses. Provides guidance on standardized, machine-readable error payloads for better API developer experience and tooling compatibility.

## Trigger

Activate when users ask about:

- HTTP API error handling and standardization
- Problem details implementation
- RFC 9457 compliance
- Structured error responses
- API error payload design

## Response Pattern

1. Assess the current error handling approach in the codebase
2. Provide RFC 9457 core structure and best practices
3. Guide implementation of problem details objects
4. Suggest extensions for domain-specific error data
5. Ensure proper Content-Type headers and response formatting
6. Validate against RFC 9457 requirements

## Examples

- "How should I structure error responses in my API?"
- "What's the best way to handle validation errors?"
- "Need to standardize HTTP error responses"
- "Implementing problem details for API errors"
- "RFC 9457 compliance guide"

## Additional Context

This skill integrates with the existing error handling patterns in the DWP Hours Tracker project. It helps standardize error responses across endpoints, particularly for validation failures and business rule violations. Works alongside businessRules.ts for consistent error messaging.

---

# SKILLS.md: RFC 9457 - Problem Details for HTTP APIs

**Concise reference implementation guide**  
**Obsoletes:** RFC 7807  
**Media Types:** `application/problem+json` (primary), `application/problem+xml` (equivalent)  
**Goal:** Standardized, machine-readable, extensible error payloads for HTTP APIs

## Core Object Members

| Member     | Type             | Required? | Semantics / Usage Notes                                                                       | Default / Behavior if absent        |
| ---------- | ---------------- | --------- | --------------------------------------------------------------------------------------------- | ----------------------------------- |
| `type`     | string (URI-ref) | No        | Primary identifier for problem category (e.g. `"https://example.com/probs/out-of-credit"`)    | `"about:blank"`                     |
| `title`    | string           | No        | Short, stable, human-readable summary of problem type (localize via Accept-Language)          | —                                   |
| `status`   | number           | No        | HTTP status code of this response (advisory only)                                             | — (MUST match actual response code) |
| `detail`   | string           | No        | Occurrence-specific human-readable explanation; client-action focused, **not** debugging info | —                                   |
| `instance` | string (URI-ref) | No        | Unique identifier for this specific problem occurrence (dereferenceable or opaque)            | —                                   |

- Clients **MUST** ignore unrecognized members (forward compatibility).
- Extensions are encouraged for domain-specific data (e.g. `"balance"`, `"errors"` array with JSON Pointers).

## Recommended Structure (2025–2026 practice)

```json
{
  "type": "https://example.com/problems/validation-failed", // stable, dereferenceable URI preferred
  "title": "Validation Failed",
  "status": 400,
  "detail": "Request contains invalid fields",
  "instance": "/errors/req-7a3b9c2e-f1d4-4e11-9e2a-abcdef123456",
  // extensions
  "errors": [
    {
      "pointer": "#/quantity",
      "detail": "Must be ≥ 1 and ≤ 999",
      "code": "range" // domain-specific short code
    }
  ]
}
```

## Best-Practice Rules (Efficient & Maintainable)

- **Always** set `Content-Type: application/problem+json`
- Use **absolute** URIs for `type` and `instance` (avoid relative → resolution bugs)
- Prefer resolvable `type` URIs → documentation, future discovery
- `detail` → imperative, concise, client-fix oriented ("Must be positive integer")
- Never parse `detail` for logic → use extensions instead
- `status` member is advisory → **MUST** match real HTTP status
- One problem type per response → pick most relevant/urgent when multiple issues
- Extensions names → XML-safe (`Name` production from XML spec)

## Extension Patterns (Common in Production)

```json
"errors": [ { "pointer": "#/email", "detail": "Invalid format", "code": "format" } ]           // validation
"balance": 30, "accounts": ["/topup/12345"]                                                   // payment
"violations": [ { "rule": "rate-limit", "retry-after": 60 } ]                                 // throttling
```

## Registry & Interoperability

- Define problem types under your control (e.g. `/problems/{slug}`)
- Consider IANA registry for broadly useful types (see RFC §4.2)
- Reuse common types when semantics match → reduces client code

## Implementation Checklist (Go / TypeScript / Java / .NET style)

```typescript
interface ProblemDetail {
  type?: string; // URI
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: any; // extensions
}

// Response helper
function problemResponse(
  status: number,
  type: string,
  title: string,
  detail?: string,
  extensions = {},
) {
  return {
    status,
    headers: { "Content-Type": "application/problem+json" },
    body: {
      type: `https://api.example.com/problems/${type}`,
      title,
      status,
      detail,
      instance: `/errors/${crypto.randomUUID()}`,
      ...extensions,
    },
  };
}
```

## Changes from RFC 7807 (key deltas)

- Clarified relative URI resolution risks → strongly prefer absolute
- Encouraged dereferenceable `type` URIs + IANA registry concept
- Minor editorial & security guidance improvements

Adopt RFC 9457 for all new APIs → excellent DX, agent/tool compatibility, future-proofing.
