---
name: dom-utilities-assistant
description: Specialized assistant for implementing robust DOM manipulation patterns using the bespoke DOM utility library for type-safe element queries.
---

# DOM Utilities Assistant

## Description

Specialized assistant for implementing robust DOM manipulation patterns in the DWP Hours Tracker frontend. Provides guidance on using the bespoke DOM utility library (`client/components/test-utils.ts`) for type-safe element queries, consistent error handling, and enhanced debugging capabilities.

## DOM Utilities System

The DWP Hours Tracker uses a lightweight bespoke DOM utility library to facilitate robust DOM manipulation with enhanced error logging and debugging capabilities. Direct use of native DOM APIs like `document.getElementById()`, `document.querySelector()`, etc. is discouraged in favor of utility functions.

### Core Principles

- **Type-Safe Queries**: Use TypeScript generics for compile-time type checking
- **Automatic Error Logging**: Descriptive errors when elements are not found
- **Consistent Error Handling**: Standardized error patterns across the application
- **Debug-Friendly Output**: Enhanced console logging for development
- **Reliable Interactions**: Ensures DOM operations are predictable and testable

### Key Utility Functions

#### Element Queries

- **`querySingle<T>(selector: string): T`** - Finds a single element by selector, throws descriptive error if not found
- **`queryMultiple<T>(selector: string): T[]`** - Finds multiple elements by selector, throws error if none found
- **`getElementById<T>(id: string): T`** - Finds element by ID with error logging

#### Event Management

- **`addEventListener(element, event, handler, options?)`** - Safely adds event listeners with error handling

#### Element Creation

- **`createElement<T>(tagName, attributes?)`** - Creates elements with optional attributes

## Usage Patterns

### ❌ Avoid Direct DOM APIs

```typescript
const button = document.getElementById("my-button") as HTMLButtonElement;
if (!button) {
  console.error("Button not found");
  throw new Error("Button not found");
}
button.addEventListener("click", handler);
```

### ✅ Use DOM Utilities

```typescript
import { getElementById, addEventListener } from "./components/test-utils.js";
const button = getElementById<HTMLButtonElement>("my-button");
addEventListener(button, "click", handler);
```

## Trigger

Activate this skill when users ask about:

- DOM element queries and manipulation
- Type-safe element access patterns
- Event listener management
- Element creation utilities
- DOM error handling and debugging
- Web component DOM interactions
- Shadow DOM element queries

## Response Pattern

When activated, follow this structured approach:

1. **Identify DOM Operation**: Determine if query involves element access, event handling, or creation
2. **Reference Utility Functions**: Show appropriate functions from `test-utils.ts`
3. **Provide Type-Safe Examples**: Demonstrate TypeScript generic usage
4. **Address Error Scenarios**: Explain error handling and debugging benefits
5. **Ensure Shadow DOM Compatibility**: Consider web component encapsulation needs

## Examples

- "How do I safely query DOM elements?"
- "What's the best way to add event listeners?"
- "How do I handle missing elements gracefully?"
- "How do I create elements with proper typing?"
- "How do I query elements within web components?"

## Additional Context

This skill integrates with the web components architecture and ensures all DOM interactions follow the project's patterns for reliability and testability. The utilities are located in `client/components/test-utils.ts` and should be imported for all DOM operations.
