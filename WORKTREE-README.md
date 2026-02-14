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

## Planet Workflow Integration

Worktrees are integrated with the Planet Branch Workflow for isolated development environments:

### Planet Worktrees

| Planet  | Worktree Path | Port | Purpose           | Urgency/Effort                      |
| ------- | ------------- | ---- | ----------------- | ----------------------------------- |
| Mercury | `../mercury`  | 3001 | Urgent fixes      | High urgency, any effort            |
| Mars    | `../mars`     | 3002 | Experimental      | Medium urgency, medium effort       |
| Earth   | `../earth`    | 3003 | Stable features   | Medium urgency, small/medium effort |
| Jupiter | `../jupiter`  | 3005 | Major features    | Low urgency, large effort           |
| Saturn  | `../saturn`   | 3006 | Standard features | Low urgency, small/medium effort    |

### Workflow Commands in Worktrees

```bash
# In any planet worktree
cd ../mars  # Switch to Mars worktree

# Start feature development
pnpm run feature:start  # Creates feature/mars/name

# Develop and test on isolated port (3002)
pnpm run dev:worktree

# Complete feature
pnpm run feature:finish  # Merges to mars planet

# Team testing on mars worktree
# Then promote when ready
git checkout mars
pnpm run planet:promote
```

### Worktree Workflow Benefits

- **Isolated Testing**: Each planet has dedicated port and environment
- **Parallel Development**: Multiple features can develop simultaneously
- **Staging Environments**: Planet worktrees serve as pre-main staging
- **Conflict Prevention**: Separate environments prevent interference

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

| Worktree Branch | Assigned Port | Reasoning                 |
| --------------- | ------------- | ------------------------- |
| main/master     | 3000          | Base port                 |
| mercury         | 3001          | 1st planet                |
| mars            | 3002          | 4th planet (venus unused) |
| earth           | 3003          | 3rd planet                |
| jupiter         | 3005          | 5th planet                |
| saturn          | 3006          | 6th planet                |
| feature/auth    | 3052          | Hash-based                |
| bugfix/ui       | 3078          | Hash-based                |

## Scripts

- `pnpm run worktree:port` - Show current worktree's assigned port
- `pnpm run dev:worktree` - Start dev server with worktree-specific port
- `pnpm run dev:external` - Start dev server (respects PORT env var)

## Planet Workflow Scripts

- `pnpm run feature:start` - Create new feature with planet selection
- `pnpm run feature:finish` - Merge feature to planet
- `pnpm run planet:promote` - Promote planet to main
- `pnpm run workflow:status` - Show workflow position

See [WORKFLOW.md](WORKFLOW.md) for complete planet workflow documentation.
