# Project Types Generator

## Description

Create a utility to generate a single `project-types.d.ts` file containing all TypeScript type definitions from the project, formatted with YAML front matter (wrapped in comments) for architecture analysis and sharing with agents. The file should include dependency information and be structured for AI-assisted code review.

**Key Requirements:**

- Only scan the "client" folder (not "server")
- Use tsconfig that extends `tsconfig-client.json`
- Include a file index header at the top showing each file name and its starting line number in the document
- The header format should be:

```
/*
---
 client/APIClient.d.ts 22
 client/UIManager.d.ts 89
 ...
 shared/testDataGenerators.d.ts 8484
---
*/
```

**Implementation Approach:**

1. Build the document content first
2. Track line numbers as content is accumulated
3. Generate the file index header with correct line numbers
4. Insert the header at the top of the document
5. Account for the header's line count when calculating subsequent file positions

## Priority

🟢 Low Priority

## Checklist

### Phase 1: Type Declaration Generation

- [x] Generate individual `.d.ts` files for client folder using `tsc --emitDeclarationOnly`
- [x] Use tsconfig that extends `tsconfig-client.json`
- [x] Test declaration generation with client-focused config

### Phase 2: File Structure Analysis

- [x] Create script to scan generated `.d.ts` files
- [x] Extract dependency relationships from import statements
- [x] Map file paths relative to project root
- [x] Build file structure index with line number references

### Phase 3: YAML Front Matter Implementation

- [x] Implement YAML header generation for file structure overview
- [x] Add per-file YAML headers with path and dependencies
- [x] Ensure proper YAML formatting and escaping
- [x] Validate YAML structure with parser

### Phase 4: Content Concatenation

- [x] Implement file concatenation with section separators
- [x] Generate file index header with line number references
- [x] Build document content first, then insert header with correct line numbers
- [x] Account for header line count when calculating file positions
- [x] Preserve TypeScript syntax and formatting
- [x] Handle special characters and multiline content
- [x] Add final Questions and Concerns section

### Phase 5: Script Packaging

- [x] Create executable script (`generate-project-types.mjs`)
- [x] Add script to `package.json` scripts section
- [x] Document usage in README or script comments
- [x] Clean up temporary files after generation

### Phase 6: Testing and Validation

- [x] Test script execution on clean repository
- [x] Verify generated file contains all expected types
- [x] Validate YAML front matter accuracy
- [x] Test with different project states (before/after changes)

### Phase 7: Documentation and Integration

- [x] Update build documentation to mention types export
- [x] Add usage examples for architecture sharing
- [x] Consider integration with CI/CD for automated generation
- [x] Manual testing of generated file usability

## Implementation Notes

- Use Node.js ESM for the generation script
- Only scan the "client" folder (not "server")
- Extend `tsconfig-client.json` for declaration generation
- Follow project's file organization patterns
- Consider memory usage for large type files
- Ensure cross-platform compatibility
- Generate file index header with line number references:
  1. Build document content first
  2. Track line numbers as content accumulates
  3. Generate header with correct line numbers
  4. Insert header at top, accounting for its line count

## Questions and Concerns

1. Should the generator be integrated into the build process?
2. How frequently should the types file be regenerated?
3. Are there any sensitive types that should be excluded?
4. Should the output format be customizable?
5. How to handle circular dependencies in the dependency analysis?
