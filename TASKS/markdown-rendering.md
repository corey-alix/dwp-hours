# Markdown Document Rendering

## Description

Implement server-side rendering of Markdown (\*.md) files as HTML documents, with support for Mermaid diagrams and optional raw markdown output. This will allow serving documentation and other markdown content directly through the web interface with proper formatting and diagram rendering.

## Priority

🟢 Low Priority

## Checklist

### Phase 1: Package Installation and Setup

- [ ] Install markdown rendering library (marked or similar)
- [ ] Install mermaid rendering support (mermaid or puppeteer-based solution)
- [ ] Install required dependencies for HTML templating
- [ ] Update package.json with new dependencies
- [ ] Test package compatibility with existing server setup

### Phase 2: Server Route Implementation

- [ ] Add GET route handler for `/*.md` files in server.mts
- [ ] Implement file existence checking for .md files
- [ ] Add query parameter parsing for `format=raw` option
- [ ] Create HTML template wrapper for rendered markdown
- [ ] Implement proper content-type headers for HTML vs markdown responses

### Phase 3: Markdown Rendering Logic

- [ ] Implement markdown to HTML conversion using chosen library
- [ ] Add syntax highlighting support for code blocks
- [ ] Implement table of contents generation (optional)
- [ ] Add CSS styling for rendered markdown content
- [ ] Handle relative links and image paths correctly

### Phase 4: Mermaid Diagram Support

- [ ] Integrate mermaid.js library for client-side rendering
- [ ] Add mermaid diagram detection in markdown content
- [ ] Implement server-side mermaid rendering (optional fallback)
- [ ] Test various mermaid diagram types (flowcharts, sequence diagrams, etc.)
- [ ] Handle mermaid rendering errors gracefully

### Phase 5: Security and Error Handling

- [ ] Implement path traversal protection for .md file requests
- [ ] Add file size limits for markdown content
- [ ] Implement proper error responses for missing files
- [ ] Add request rate limiting for markdown rendering
- [ ] Validate markdown content for malicious scripts

### Phase 6: Testing and Documentation

- [ ] Write unit tests for markdown rendering functions
- [ ] Add E2E tests for .md file serving and rendering
- [ ] Test mermaid diagram rendering in various browsers
- [ ] Update API documentation with new markdown serving capabilities
- [ ] Add examples of supported markdown features

### Phase 7: Code Quality and Deployment

- [ ] Run build and lint checks
- [ ] Manual testing of markdown file rendering
- [ ] Test raw format parameter functionality
- [ ] Update deployment documentation if needed
- [ ] Code review and final validation

## Implementation Notes

- **Package Recommendations**:
  - `marked`: Fast markdown parser with extensions support
  - `mermaid`: For diagram rendering (client-side preferred for performance)
  - `highlight.js`: For syntax highlighting in code blocks
  - `DOMPurify`: For sanitizing rendered HTML content

- **Route Design**: Use wildcard route `/*` with file extension checking to avoid conflicts with existing API routes
- **Raw Format**: When `?format=raw` is specified, return raw markdown with `Content-Type: text/markdown`
- **Performance**: Cache rendered HTML for frequently accessed files
- **Security**: Only serve .md files from allowed directories (public/, docs/, etc.)
- **Browser Compatibility**: Ensure mermaid diagrams work across supported browsers

## Questions and Concerns

1. **RESOLVED**: Limit markdown serving to specific directories - only the `/components` directory (where test.html pages are located)
2. **RESOLVED**: Client-side mermaid rendering is preferred for performance
3. **RESOLVED**: No authentication required - anyone can read the markdown or run the test.html pages
4. **RESOLVED**: Images should be deployed to expected paths and served, but there are currently no images in the markdown files
5. **RESOLVED**: No other diagram formats needed - just Mermaid diagrams (sequence diagrams, flowcharts, etc.)</content>
   <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/earth/TASKS/markdown-rendering.md
