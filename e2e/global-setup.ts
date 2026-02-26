import { cpSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Copy test fixture data into the data/ directory so the dev server
 * picks them up via import.meta.glob during e2e tests.
 */
export default function globalSetup() {
  const fixturesDir = resolve(__dirname, "fixtures");
  const dataDir = resolve(__dirname, "..", "data");

  cpSync(resolve(fixturesDir, "test-vocab.json"), resolve(dataDir, "test-vocab.json"));
  cpSync(resolve(fixturesDir, "test-grammar.json"), resolve(dataDir, "test-grammar.json"));
}
