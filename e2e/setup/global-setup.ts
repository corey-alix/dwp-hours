import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function globalSetup() {
  try {
    // Run lint
    execSync("pnpm run lint", {
      cwd: path.join(__dirname, "..", ".."),
      stdio: "inherit",
    });

    // Run build
    execSync("pnpm run build", {
      cwd: path.join(__dirname, "..", ".."),
      stdio: "inherit",
    });

    // Build test assets
    execSync("pnpm run build:test-assets", {
      cwd: path.join(__dirname, "..", ".."),
      stdio: "inherit",
    });
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  }

  // Database seeding is now handled per test via /api/test/seed
}
