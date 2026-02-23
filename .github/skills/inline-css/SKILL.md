---
name: inline-css
description: Efficiently manage CSS imports in TypeScript codebases, understanding tsc vs esbuild behavior for fast, low-config, maintainable setups.
---

# Agent Skill: Handling CSS Imports in TypeScript Projects (tsc vs esbuild)

**Skill Name**  
`css-imports-typescript-esbuild`

**Description**  
Efficiently manage `import "./styles.css"` (and `.module.css`) in TypeScript codebases.  
Understand what `tsc` does vs modern bundlers (especially **esbuild**).  
Prefer fast, low-config, maintainable setups.

**Applicable Versions** (as of Feb 2026)

- TypeScript ≥ 5.0
- esbuild ≥ 0.20 (behavior stable since ~0.8–0.12)

**Core Facts**

| Tool    | `import "./file.css"` allowed? | Inlines CSS into JS bundle?   | Emits separate `.css` file? | Default loader behavior                          | Best Use Case                          |
| ------- | ------------------------------ | ----------------------------- | --------------------------- | ------------------------------------------------ | -------------------------------------- |
| `tsc`   | Yes (with config)              | **Never**                     | No (ignores)                | No emit — only type checking                     | Pure type-checking + declaration emit  |
| esbuild | Yes                            | **Yes** — when `bundle: true` | Yes — when no JS entry      | `.css` → CSS → inject `<style>` or separate file | Most modern apps, libs, SSR front-ends |

**tsc — Type-Only Support (2025–2026 standard)**

Enable arbitrary non-JS imports without errors:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "module": "preserve", // or "esnext"
    "allowArbitraryExtensions": true,
    "noEmit": true, // common with esbuild/vite
    "isolatedModules": true,
  },
}
```

````

Optional — explicit module declaration for CSS Modules:

```ts
// src/styles.d.css.ts  (or global.d.ts)
declare module "*.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
```

→ `tsc` never emits CSS or JS code for it.
→ Use with esbuild / vite / rollup for actual bundling.

**esbuild — Recommended Default (fast & clean)**

Built-in CSS handling — no plugins needed in 99% of cases.

```js
// build.js (ESM)
import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.tsx"],
  bundle: true,
  minify: true,
  format: "esm",
  platform: "browser",
  outfile: "dist/app.js",
  // loader: { '.css': 'css' }          // default — usually not needed
  // or { '.module.css': 'local-css' }  // for CSS modules (exports object)
});
```

**Behavior Matrix (esbuild bundle: true)**

| Import style                            | Loader (default) | Result in browser bundle                    | Export value (if imported) |
| --------------------------------------- | ---------------- | ------------------------------------------- | -------------------------- |
| `import "./global.css"`                 | `css`            | Injects `<style>` tag at runtime            | `undefined` / void         |
| `import styles from "./mod.module.css"` | `local-css`      | Injects `<style>`, exports hashed class map | `{ [className]: string }`  |
| `import raw from "./file.css?raw"`      | `text` (manual)  | `raw` = string containing CSS               | `string`                   |

**Patterns – Pick One per Project**

1. **Browser SPA (Vite / esbuild dev + build)**
   → `import "./App.css"` → auto-injected styles
   → Use `local-css` for modules

2. **Library / Component (emits JS + separate CSS)**
   → `--bundle --splitting` + external CSS handling
   → Or emit CSS separately: `esbuild --entryPoints=src/index.ts src/index.css --outdir=dist`

3. **SSR / full inline (rare)**
   → Use plugin or custom loader → collect CSS strings
   → esbuild alone does **not** inline to JS string by default (unlike style-loader)

**Quick Checklist (Maintainable Setup)**

- [ ] `tsconfig.json`: `allowArbitraryExtensions`, `moduleResolution: "bundler"`
- [ ] Use esbuild (or Vite) — never rely on `tsc` for CSS emit
- [ ] Decide early: global CSS vs modules vs CSS-in-JS
- [ ] Avoid custom plugins unless you need PostCSS / Sass transforms
- [ ] Test: `import classes from "./Button.module.css"; classes.primary` → autocompletes & typesafe

**Verdict**
**tsc** → types only, no inlining, no emission
**esbuild** → inlines/injects CSS automatically when bundling → fastest path for most projects in 2026

Use this skill when: onboarding new TS+CSS repo, debugging "CSS not applying", choosing bundler.
````
