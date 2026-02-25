---
name: low-memory-deployment
description: Guides memory-safe implementation patterns for the DWP Hours Tracker deployed on a 512MB DigitalOcean droplet.
---

# Low-Memory Deployment Skill

## Description

The DWP Hours Tracker production server runs on a DigitalOcean droplet with **457MB total RAM, no swap**. Node.js gets ~200MB usable after OS and PM2 overhead. This skill captures hard-won patterns for avoiding OOM kills.

## Trigger

Activate this skill when:

- Implementing features that process large files (Excel, CSV, images)
- Adding middleware or libraries that buffer request/response bodies
- Changing PM2 or server configuration
- Debugging SIGKILL crashes on the production server
- Working on bulk data operations (imports, exports, report generation)

## Server Environment

| Resource             | Value                                 |
| -------------------- | ------------------------------------- |
| Total RAM            | 457 MB                                |
| Swap                 | None                                  |
| Available to Node.js | ~200 MB                               |
| PM2 mode             | Cluster (single instance)             |
| OS                   | Ubuntu on DigitalOcean                |
| Node.js heap default | ~256 MB (V8 default for <2GB systems) |

## Response Pattern

### 1. Identify Memory Hotspots

Before implementing, estimate peak memory usage:

- **File uploads**: multer `memoryStorage()` holds entire file in RAM
- **Library parsing**: ExcelJS `readFile()` / `load(buffer)` expands compressed xlsx to full object model (~10–50x file size)
- **Database**: sql.js holds entire SQLite DB in memory
- **Accumulated objects**: Large result arrays, logging buffers

### 2. Apply Streaming Patterns

Process data incrementally instead of loading everything at once:

- Use `multer.diskStorage()` instead of `memoryStorage()` — write uploads to `/tmp`, clean up in `finally` block
- Use ExcelJS `WorkbookReader` streaming API instead of `readFile()` (see exceljs skill)
- Process items one at a time, releasing references between iterations
- For database bulk operations, disable autoSave and persist once at the end

### 3. Clean Up Aggressively

- Delete temp files in `finally` blocks
- Null out large objects after use
- Release worksheet references after processing each sheet
- Use `workbook.removeWorksheet(ws.id)` if using non-streaming ExcelJS

## Proven Patterns

### File Upload: Disk Instead of Memory

```typescript
// BAD — holds entire file in Node.js memory
const upload = multer({ storage: multer.memoryStorage() });

// GOOD — writes to disk, stays off the heap
const upload = multer({
  storage: multer.diskStorage({
    destination: "/tmp",
    filename: (_req, file, cb) => {
      cb(null, `upload-${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Always clean up temp files
try {
  await processFile(req.file.path);
  res.json({ success: true });
} finally {
  fs.unlink(req.file.path, () => {});
}
```

### Excel: Stream One Sheet at a Time

```typescript
// BAD — loads all 68 sheets into memory at once (~200MB+)
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(filePath);

// GOOD — streams one sheet at a time (~5MB peak per sheet)
const reader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
  worksheets: "emit",
  sharedStrings: "cache",
  styles: "cache",
  hyperlinks: "cache",
});

for await (const wsReader of reader) {
  const ws = await materialiseWorksheet(wsReader); // one sheet in memory
  processSheet(ws);
  // ws is GC'd on next iteration
}
```

### Bulk DB Operations: Single Save

```typescript
// BAD — sql.js autoSave writes entire DB to disk on every insert
for (const item of items) {
  await repo.save(item); // triggers disk write each time
}

// GOOD — disable autoSave, batch all writes, save once
const driver = dataSource.driver as any;
const originalAutoSave = driver.options?.autoSave;
driver.options.autoSave = false;

try {
  for (const item of items) {
    await repo.save(item); // in-memory only
  }
} finally {
  driver.options.autoSave = originalAutoSave;
  await driver.save(); // single disk write
}
```

## Debugging OOM on Production

### Symptoms

- PM2 shows increasing restart count (↺ column)
- Process exits with SIGKILL (not SIGINT or SIGTERM)
- No error in application logs — process killed mid-operation
- `dmesg` may show OOM killer messages (requires root access)

### Diagnosis Steps

1. `ssh deploy@server "pm2 status"` — check restart count and uptime
2. `ssh deploy@server "pm2 logs --nostream --lines 100"` — find last operation before crash
3. `ssh deploy@server "free -m"` — check available memory
4. Look for the pattern: operation starts → no completion log → server restarts

### Common Culprits

| Operation                    | Memory Risk               | Fix                              |
| ---------------------------- | ------------------------- | -------------------------------- |
| Excel import (68 sheets)     | ~200MB+ with `readFile()` | Use streaming `WorkbookReader`   |
| File upload                  | File size × 1             | Use `diskStorage()`              |
| Report generation            | Depends on data volume    | Stream output, limit batch sizes |
| Multiple concurrent requests | Additive                  | Queue heavy operations           |

## PM2 Configuration Notes

- The server runs in **cluster mode** with a single instance
- Each cluster worker is a full Node.js process
- On 512MB, never run more than 1 instance
- Consider `--max-memory-restart 200M` as a safety net

## Additional Context

- This skill complements the `exceljs` skill (streaming patterns) and `sql-js-database-assistant` skill (bulk operations)
- The production server has no swap partition — when memory is exhausted, the OOM killer acts immediately with SIGKILL
- Always test memory-intensive operations with realistic data volumes before deploying
