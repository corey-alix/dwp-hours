#!/usr/bin/env node

/**
 * Project Types Generator
 *
 * Generates a single project-types.d.md file containing all TypeScript type definitions
 * from the project, formatted with YAML front matter for architecture analysis and
 * sharing with agents.
 *
 * Usage: node scripts/generate-project-types.mjs
 *        pnpm run generate:types
 *
 * The generated project-types.d.md file includes:
 * - File index header with line number references for each file
 * - YAML front matter with project metadata and file structure overview
 * - Per-file YAML headers with dependencies and export information
 * - Complete TypeScript declaration files for all modules
 * - Questions and Concerns section for architectural decisions
 *
 * This file is ideal for:
 * - AI-assisted code review and architecture analysis
 * - Understanding project structure and dependencies
 * - Sharing type definitions with external tools or agents
 * - Documentation and onboarding purposes
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, readdirSync, statSync, unlinkSync, rmSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const TYPES_DIR = join(PROJECT_ROOT, 'dist', 'types');
const OUTPUT_FILE = join(PROJECT_ROOT, 'project-types.d.md');

function log(message) {
  console.log(`[generate-project-types] ${message}`);
}

function execCommand(command, cwd = PROJECT_ROOT) {
  log(`Running: ${command}`);
  return execSync(command, { cwd, stdio: 'inherit', encoding: 'utf8' });
}

function generateDeclarations() {
  log('Generating TypeScript declarations...');
  execCommand('npx tsc --project tsconfig-declarations.json');
}

function scanDeclarationFiles() {
  const files = [];

  function scanDir(dir, relativePath = '') {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = join(relativePath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scanDir(fullPath, relPath);
      } else if (entry.endsWith('.d.ts')) {
        files.push({
          fullPath,
          relativePath: relPath,
          content: readFileSync(fullPath, 'utf8')
        });
      }
    }
  }

  scanDir(TYPES_DIR);
  return files;
}

function extractDependencies(content) {
  const dependencies = new Set();
  const importRegex = /^import\s+.*?\s+from\s+['"]([^'"]+)['"]/gm;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    // Convert relative imports to project-relative paths
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      dependencies.add(importPath);
    } else if (!importPath.startsWith('@') && !importPath.includes('/node_modules/')) {
      // Internal project imports
      dependencies.add(importPath);
    }
  }

  return Array.from(dependencies).sort();
}

function generateYamlFrontMatter(fileInfo, allFiles) {
  const yaml = {
    file: fileInfo.relativePath,
    dependencies: extractDependencies(fileInfo.content),
    lineCount: fileInfo.content.split('\n').length,
    exports: extractExports(fileInfo.content)
  };

  return `/*
---
${Object.entries(yaml)
  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  .join('\n')}
---
*/`;
}

function extractExports(content) {
  const exports = [];
  const exportRegex = /^export\s+(?:declare\s+)?(?:class|interface|type|const|function|enum)\s+(\w+)/gm;
  let match;

  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }

  return exports;
}

function generateFileStructureOverview(allFiles) {
  const overview = {
    totalFiles: allFiles.length,
    directories: {},
    fileTypes: {}
  };

  for (const file of allFiles) {
    const dir = dirname(file.relativePath);
    const ext = file.relativePath.split('.').pop();

    overview.directories[dir] = (overview.directories[dir] || 0) + 1;
    overview.fileTypes[ext] = (overview.fileTypes[ext] || 0) + 1;
  }

  return `/*
---
project: "DWP Hours Tracker"
generated: "${new Date().toISOString()}"
${Object.entries(overview)
  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  .join('\n')}
---
*/`;
}

function generateFileIndexHeader(fileIndex, content) {
  // Calculate the header line count
  const tempHeader = `/*
---
${fileIndex.map(entry => ` ${entry.path} ${entry.contentStartLine}`).join('\n')}
---
*/
`;
  const headerLineCount = tempHeader.split('\n').length;

  // Adjust line numbers to account for the header
  const adjustedFileIndex = fileIndex.map(entry => ({
    path: entry.path,
    lineNumber: entry.contentStartLine + headerLineCount
  }));

  return `/*
---
${adjustedFileIndex.map(entry => ` ${entry.path} ${entry.lineNumber}`).join('\n')}
---
*/
`;
}

function generateProjectTypesFile() {
  log('Scanning generated declaration files...');
  const files = scanDeclarationFiles();

  log(`Found ${files.length} declaration files`);

  // Build content without file index header first
  let content = generateFileStructureOverview(files);
  content += '\n\n// ===== TYPE DEFINITIONS =====\n\n';

  // Track file positions and build content
  const fileIndex = [];

  for (const file of files) {
    log(`Processing ${file.relativePath}...`);

    // Record the current position for this file (will adjust for header later)
    fileIndex.push({
      path: file.relativePath,
      contentStartLine: content.split('\n').length + 1
    });

    // Add file content
    const yamlHeader = generateYamlFrontMatter(file, files);
    content += yamlHeader;
    content += '\n';
    content += `// ===== ${file.relativePath} =====\n`;
    content += file.content;
    content += '\n\n';
  }

  content += `/*
---
Questions and Concerns:
1. Should the generator be integrated into the build process?
2. How frequently should the types file be regenerated?
3. Are there any sensitive types that should be excluded?
4. Should the output format be customizable?
5. How to handle circular dependencies in the dependency analysis?
---
*/`;

  // Generate file index header with correct line numbers
  const indexHeader = generateFileIndexHeader(fileIndex, content);

  // Combine header with content
  const output = indexHeader + content;

  log(`Writing output to ${relative(PROJECT_ROOT, OUTPUT_FILE)}...`);
  writeFileSync(OUTPUT_FILE, output, 'utf8');
}

function cleanup() {
  log('Cleaning up temporary files...');
  try {
    rmSync(TYPES_DIR, { recursive: true, force: true });
  } catch (error) {
    log(`Warning: Could not remove ${TYPES_DIR}: ${error.message}`);
  }
}

function main() {
  try {
    log('Starting project types generation...');

    // Phase 1: Generate declarations
    generateDeclarations();

    // Phase 2-4: Process and concatenate
    generateProjectTypesFile();

    // Phase 5: Cleanup
    cleanup();

    log('Project types generation completed successfully!');
    log(`Output: ${relative(PROJECT_ROOT, OUTPUT_FILE)}`);

  } catch (error) {
    log(`Error: ${error.message}`);
    cleanup();
    process.exit(1);
  }
}

main();