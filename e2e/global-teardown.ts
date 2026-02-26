import { rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Remove test fixture data from the data/ directory after e2e tests.
 */
export default function globalTeardown() {
  const dataDir = resolve(__dirname, "..", "data");

  rmSync(resolve(dataDir, "test-vocab.json"), { force: true });
  rmSync(resolve(dataDir, "test-grammar.json"), { force: true });
}
