import assert from "node:assert/strict";
import { readdirSync, readFileSync, mkdirSync, renameSync, cpSync, realpathSync } from "node:fs";
import { resolve, join, sep } from "node:path";
import { spawnSync, execFileSync } from "node:child_process";

const root = realpathSync(resolve(import.meta.dirname, ".."));
process.chdir(root);
const output = realpathSync(join(root, "out"));
const mirror = realpathSync(resolve(root, "../tsc-fm-benchmark-public"));
assert.equal(mirror, resolve(root, "../tsc-fm-benchmark-public"), "Unexpected mirror path or symlink");
assert.equal(output, join(root, "out"), "Unexpected export path or symlink");
const git = process.env.GIT_EXECUTABLE || "git";
const remote = execFileSync(git, ["-c", `safe.directory=${mirror}`, "-C", mirror, "remote", "get-url", "origin"], { encoding: "utf8" }).trim();
assert.match(remote, /github\.com[:/]juntaofang2000\/tsc-fm-benchmark-public(?:\.git)?$/, "Wrong mirror repository");
const status = execFileSync(git, ["-c", `safe.directory=${mirror}`, "-C", mirror, "status", "--porcelain"], { encoding: "utf8" });
assert.equal(status.trim(), "", "Mirror has uncommitted changes; review them before syncing");
const check = spawnSync(process.execPath, ["scripts/verify-release.mjs", "--export"], { stdio: "inherit" });
assert.equal(check.status, 0, "Export verification failed; nothing was moved");
const incoming = readdirSync(output);
const allowed = new Set([...incoming, "_next", "_not-found", "404", "benchmarks", "capability-map", "evaluation", "leaderboard", "methods", "submissions", "submit", "__next.__PAGE__.txt", "__next._full.txt", "__next._index.txt", "__next._tree.txt", ".nojekyll", "404.html", "favicon.ico", "favicon.svg", "file.svg", "globe.svg", "index.html", "index.txt", "next.svg", "robots.txt", "sitemap.xml", "vercel.svg", "window.svg"]);
const old = readdirSync(mirror).filter((name) => name !== ".git" && name !== "README.md");
for (const name of old) assert.ok(allowed.has(name), `Unrecognized mirror item: ${name}; review before moving`);
for (const name of incoming) assert.ok(!name.startsWith(".env") && ![".git", "README.md", "node_modules", "benchmark-data", "src"].includes(name), `Disallowed public export item: ${name}`);
const backup = resolve(root, "artifacts/seo", `mirror-backup-${Date.now()}`);
assert.ok(backup.startsWith(join(root, "artifacts", "seo") + sep));
mkdirSync(backup, { recursive: true });
for (const name of old) {
  const target = resolve(mirror, name);
  assert.ok(target.startsWith(mirror + sep), "Move target is outside mirror");
  assert.equal(realpathSync(target), target, "Refusing to move a symlink/junction");
  renameSync(target, join(backup, name));
}
for (const name of incoming) cpSync(join(output, name), join(mirror, name), { recursive: true, errorOnExist: true, force: false });
assert.equal(readFileSync(join(mirror, "release.json"), "utf8"), readFileSync(join(output, "release.json"), "utf8"));
console.log(`Synced verified static files to ${mirror}. Old generated files are recoverable at ${backup}.`);
