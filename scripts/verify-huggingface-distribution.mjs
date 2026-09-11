import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const files = (directory) => readdirSync(join(root, directory), { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]
);

const spaceReadme = read("hf-space/README.md");
const cardReadme = read("hf-organization-card/README.md");
const html = read("hf-space/index.html");
const app = read("hf-space/app.js");
const route = read("src/app/api/public/space-summary/route.ts");
const workflow = read(".github/workflows/sync-huggingface.yml");
const leaderboard = JSON.parse(read("src/data/official/public-leaderboards.json"));
const identity = JSON.parse(read("src/config/site-identity.json"));
for (const [label, content] of [["Space", html], ["Organization Card", cardReadme]]) {
  assert.ok(content.includes("DMIR Lab") && content.includes("Huawei Noah’s Ark Lab"), `${label}: joint release attribution is missing`);
  assert.match(content, /[Mm]aintained by[\s\S]{0,150}Juntao Fang/, `${label}: maintainer must be Juntao Fang`);
  assert.ok(!/Submit (?:benchmark )?results/.test(content), `${label}: submission link should describe submitting a model`);
}

assert.match(spaceReadme, /^---[\s\S]*?sdk: static[\s\S]*?---/, "Space README must configure the static SDK");
assert.match(cardReadme, /^---[\s\S]*?title: README[\s\S]*?sdk: static[\s\S]*?---/, "Organization Card must be a README Static Space");
assert.ok(html.includes(`<title>${identity.title}</title>`), "Space title must match the official full title");
for (const [label, content] of [["Space", html], ["Space README", spaceReadme], ["Organization Card", cardReadme]]) {
  assert.ok(content.includes(identity.subtitle), `${label}: shared subtitle is missing`);
  assert.ok(!/Submit (?:benchmark )?results/.test(content), `${label}: submission link should describe submitting a model`);
}
assert.match(html, /rel="canonical" href="https:\/\/tsc-fm\.dmirlab\.com\/"/, "Space canonical URL must point to the official site");
assert.match(app, /https:\/\/tsc-fm\.dmirlab\.com\/api\/public\/space-summary/, "Space must read the official summary endpoint");
assert.match(app, /cache: "no-store"/, "Space must bypass browser cache for benchmark data");
assert.match(app, /content\.classList\.add\("is-hidden"\)/, "Space must hide results after a live-data failure");
assert.match(route, /contentRevision: release\.contentRevision/, "Public summary must expose the official content revision");
assert.match(route, /getLeaderboard\(\{ track: "Overall", limit: 5 \}\)/, "Public summary must derive its Top 5 from the official leaderboard");
assert.match(workflow, /huggingface_repo_id: TSC-FM\/benchmark/, "Workflow target for the Space is wrong");
assert.match(workflow, /huggingface_repo_id: TSC-FM\/README/, "Workflow target for the Organization Card is wrong");
assert.match(workflow, /vars\.HF_SYNC_ENABLED == 'true'/, "Workflow must stay disabled until both public HF repositories exist");

for (const path of [...files("hf-space"), ...files("hf-organization-card")]) {
  assert.notEqual(extname(path).toLowerCase(), ".json", `${path}: bundled JSON can drift from the official site`);
}

const shippedUi = `${html}\n${app}`;
for (const row of leaderboard.standard.Overall.slice(0, 5)) {
  assert.ok(!shippedUi.includes(row.method), `Space UI embeds the current result ${row.method}`);
}

console.log("PASS: HF Space contains UI only, validates live schema, and hides unverifiable data.");
console.log("PASS: Organization Card and guarded GitHub-to-Hub sync targets are configured.");
