# Package.json Command Commenter

## Description
Ensures any new or modified `package.json` script commands include a paired `//` comment entry describing the command.

## Trigger
Activate when the user asks to add, change, or generate `package.json` scripts, or when creating new npm commands in any context.

## Response Pattern
1. Identify each `package.json` script command being added or modified.
2. Add a matching `"<scriptName>//"` comment entry with a concise description for every command created.
3. Keep comments near their associated command and preserve existing ordering/style.
4. Validate that every new command has a corresponding comment entry before finishing.

## Examples
- "Add a new npm script to run lint fixes"
- "Create a build:assets script in package.json"
- "Update the start script to use nodemon"

## Additional Context
- Use the project convention: pair each script with a `//` comment key (e.g., `start//`).
- Keep descriptions short and action-oriented.
- When relevant, reference TASKS priorities and ensure scripts align with project standards.
