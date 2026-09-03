import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "src");
const outputRoot = path.join(projectRoot, "dist");
const requiredEntries = [
  "index.html",
  "f1/index.html",
  "f2/index.html",
  "f3/index.html",
  "f4/index.html",
  "f5/index.html",
  "f6/index.html",
  "f7/index.html",
];

for (const entry of requiredEntries) {
  const entryPath = path.join(sourceRoot, entry);
  if (!fs.existsSync(entryPath)) {
    throw new Error(`Missing required build entry: ${entry}`);
  }
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.cpSync(sourceRoot, outputRoot, { recursive: true });
console.log(`Built ${requiredEntries.length} application entry points into dist/`);
