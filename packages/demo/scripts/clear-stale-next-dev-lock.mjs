import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const demoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const lockPath = join(demoRoot, ".next", "dev", "lock");

if (!existsSync(lockPath)) process.exit(0);

try {
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  const pid = lock?.pid;
  if (typeof pid !== "number" || Number.isNaN(pid)) {
    unlinkSync(lockPath);
    process.exit(0);
  }
  try {
    process.kill(pid, 0);
  } catch {
    unlinkSync(lockPath);
  }
} catch {
  try {
    unlinkSync(lockPath);
  } catch {
    /* ignore */
  }
}
