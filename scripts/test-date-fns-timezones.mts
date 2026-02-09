import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const vitestEntry = path.resolve("node_modules", "vitest", "vitest.mjs");
const testFile = path.resolve("shared", "__tests__", "date-fns.test.ts");

const timezones = ["UTC", "Pacific/Honolulu", "Australia/Sydney"];

for (const tz of timezones) {
  // Node reads TZ at startup; run a fresh process for each timezone.
  const result = spawnSync(process.execPath, [vitestEntry, "--run", testFile], {
    stdio: "inherit",
    env: {
      ...process.env,
      TZ: tz,
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
