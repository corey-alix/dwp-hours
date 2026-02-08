# Worktree Development Setup

This project supports multiple worktrees with automatic port assignment to avoid conflicts.

## Quick Start

### For Worktree Development
```bash
# Start dev server with automatically assigned port
pnpm run dev:worktree

# Or manually:
pnpm run worktree:port  # See assigned port
export PORT=<assigned-port>
pnpm run dev:external
```

### For Testing in Worktrees
```bash
# Set the port and run tests
export PORT=<worktree-port>
pnpm run test
```

## How Port Assignment Works

- **Planet-based ports**: Worktrees named after planets get ports 3000 + planet number
- **Main/Master branches**: Port 3000 (base)
- **Other worktrees**: Hash-based assignment for consistency

## Manual Port Control

You can override the automatic port assignment:

```bash
# Use a specific port
export PORT=3001
pnpm run dev:external

# Use default port (3000)
pnpm run dev:external
```

## Worktree Examples

| Worktree Branch | Assigned Port | Reasoning |
|----------------|---------------|-----------|
| main/master   | 3000         | Base port |
| mercury       | 3001         | 1st planet |
| venus         | 3002         | 2nd planet |
| earth         | 3003         | 3rd planet |
| mars          | 3004         | 4th planet |
| jupiter       | 3005         | 5th planet |
| saturn        | 3006         | 6th planet |
| feature/auth  | 3052         | Hash-based |
| bugfix/ui     | 3078         | Hash-based |

## Scripts

- `pnpm run worktree:port` - Show current worktree's assigned port
- `pnpm run dev:worktree` - Start dev server with worktree-specific port
- `pnpm run dev:external` - Start dev server (respects PORT env var)