import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function setup() {
  try {
    // Run the seed script to reset database to clean state
    execSync("npm run seed", {
      cwd: path.join(__dirname, "..", ".."),
      stdio: "pipe", // Use pipe to suppress output
    });
  } catch (error) {
    console.error("❌ Failed to reset database:", error);
    throw error;
  }
}
