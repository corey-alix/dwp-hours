# ESBuild CSS Bundling

## Description

Implement esbuild-based CSS bundling to combine `styles.css`, `tokens.css`, and `atomic.css` into a single output file in `./public`, replacing the current copy operation in `build:client:assets` that misses `atomic.css`.

## Priority

🟡 Medium Priority

## Checklist

- [x] Analyze current CSS import structure in `styles.css`
- [x] Create new pnpm script `build:client:css` using esbuild for CSS bundling
- [x] Configure esbuild to bundle `client/styles.css` as entry point with output to `public/styles.css`
- [x] Update `build:client:assets` script to use new CSS bundling instead of manual file copying
- [x] Remove `client/styles.css` and `client/tokens.css` from the copy command in `build:client:assets`
- [x] Test that bundled CSS loads correctly in development server
- [x] Verify all CSS rules from all three files are present in the bundled output
- [x] Run `pnpm run build` to ensure no build errors
- [x] Run `pnpm run lint` to ensure code quality
- [ ] Manual testing of UI styling in browser
- [ ] Update build documentation if needed

## Implementation Notes

- Use esbuild's built-in CSS bundling capabilities with `--bundle` flag
- Set `client/styles.css` as the entry point since it imports `tokens.css` and `atomic.css`
- Output to `public/styles.css` to maintain existing file structure
- Ensure esbuild processes CSS imports correctly
- Test with both development and production builds
- Consider adding source maps for CSS debugging in development

## Questions and Concerns

1.
2.
3.
