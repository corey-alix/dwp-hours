#!/usr/bin/env node

import { execSync } from "child_process";

const rootDir = process.cwd();

// Run prettier on all relevant files
try {
    console.log("Formatting code with Prettier...");
    execSync('npx prettier --write "**/*.{js,ts,json,css,html,md}" --ignore-path .gitignore', {
        cwd: rootDir,
        stdio: "inherit"
    });
    console.log("Code formatting completed.");
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Prettier formatting failed:", message);
    process.exit(1);
}

// Run linting
try {
    console.log("Running TypeScript linting...");
    execSync("npm run lint", { cwd: rootDir, stdio: "inherit" });
    console.log("Linting completed successfully.");
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Linting failed:", message);
    process.exit(1);
}

console.log("Pre-commit checks passed!");
