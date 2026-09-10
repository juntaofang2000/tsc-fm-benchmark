import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/data/official/methods.ts", "utf8");
const slugs = [...source.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
const aliases = JSON.parse(readFileSync("src/config/method-aliases.json", "utf8"));
const data = JSON.parse(readFileSync("src/data/official/public-leaderboards.json", "utf8"));
const modelSlug = (name) => name.toLowerCase().replace(/\+/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const canonical = (name) => aliases[modelSlug(name)] ?? modelSlug(name);

for (const slug of slugs) {
  const records = new Map();
  for (const line of readFileSync(`.next/server/app/methods/${slug}.rsc`, "utf8").split("\n")) {
    const split = line.indexOf(":");
    try { records.set(line.slice(0, split), JSON.parse(line.slice(split + 1))); } catch { /* Non-JSON RSC records do not carry result props. */ }
  }
  const resolve = (value) => typeof value === "string" && /^\$[a-f0-9]+$/.test(value) ? resolve(records.get(value.slice(1))) : value;
  let groups;
  function visit(value) {
    if (!value || typeof value !== "object") return;
    if (value.method?.slug === slug && value.results) groups = resolve(value.results);
    for (const child of Object.values(value)) visit(child);
  }
  for (const value of records.values()) visit(value);
  assert.ok(groups?.length, `${slug}: no result groups reached the detail component`);
  const expected = [];
  for (const [setting, scopes] of Object.entries({ Standard: data.standard, ...data.lowShot })) {
    for (const [scope, entries] of Object.entries(scopes)) {
      const matches = entries.filter((row) => canonical(row.method) === slug);
      if (matches.length) expected.push({ setting, scope, comparisonCount: entries.length, entries: matches });
    }
  }
  assert.equal(groups.length, expected.length, `${slug}: missing settings or scopes`);
  groups.forEach((item, i) => {
    const group = resolve(item);
    const target = expected[i];
    assert.equal(group.setting, target.setting);
    assert.equal(group.scope, target.scope);
    assert.equal(group.comparisonCount, target.comparisonCount);
    const entries = resolve(group.entries).map(resolve);
    assert.deepEqual(entries.map((r) => [r.model, r.coverage]), target.entries.map((r) => [r.method, r.coverage]), `${slug}: detail results drifted from leaderboard`);
    entries.forEach((row, index) => {
      // Bundled JSON/RSC may round the last binary floating-point digit.
      for (const metric of ["avgAccuracy", "avgRank"]) assert.ok(Math.abs(row[metric] - target.entries[index][metric]) < 1e-10, `${slug}: ${metric} differs`);
    });
  });
  if (["tic-fm", "tict"].includes(slug)) assert.ok(groups.every((g) => resolve(g).scope === "Univariate"), `${slug}: univariate result mislabeled as Overall`);
  console.log(`PASS ${slug}: ${groups.length} setting/scope groups match the leaderboard`);
}
