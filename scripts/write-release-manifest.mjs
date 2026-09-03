import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join, relative } from "node:path";

const root = resolve(import.meta.dirname, "..");
const hash = createHash("sha256");
function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
    const filename = join(directory, entry.name);
    if (entry.isDirectory()) visit(filename);
    else add(filename);
  }
}
function add(filename) {
  hash.update(relative(root, filename).replaceAll("\\", "/"));
  hash.update("\0");
  const bytes = readFileSync(filename);
  hash.update(/\.(ts|tsx|mjs|json|css|svg|txt)$/.test(filename) ? bytes.toString("utf8").replaceAll("\r\n", "\n") : bytes);
  hash.update("\0");
}
visit(join(root, "src"));
visit(join(root, "scripts"));
for (const name of ["next.config.ts", "package.json", "pnpm-lock.yaml"]) add(join(root, name));
// Public assets matter too, but the manifest must not hash itself.
for (const entry of readdirSync(join(root, "public"), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
  if (entry.name === "release.json") continue;
  if (entry.isDirectory()) visit(join(root, "public", entry.name));
  else add(join(root, "public", entry.name));
}
const identity = JSON.parse(readFileSync(join(root, "src/config/site-identity.json"), "utf8"));
const primaryUrl = new URL(process.env.NEXT_PUBLIC_PRIMARY_SITE_URL || identity.primaryUrl).origin;
hash.update(primaryUrl);
const manifest = { schemaVersion: 1, contentRevision: hash.digest("hex"), primaryUrl };
mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(join(root, "public/release.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Release content revision: ${manifest.contentRevision}`);
