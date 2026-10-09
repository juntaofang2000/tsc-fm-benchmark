import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const staticOnly = process.argv.includes("--export");
const source = readFileSync("src/data/official/methods.ts", "utf8");
const slugs = [...source.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
const aliases = JSON.parse(readFileSync("src/config/method-aliases.json", "utf8"));
const data = JSON.parse(readFileSync("src/data/official/public-leaderboards.json", "utf8"));
const modelSlug = (name) => name.toLowerCase().replace(/\+/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const canonical = (name) => aliases[modelSlug(name)] ?? modelSlug(name);
const metric = (value) => value === null ? "—" : value.toFixed(2);
const text = (value) => value.replace(/<!--.*?-->/gs, "").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

for (const slug of slugs) {
  const filename = staticOnly ? `out/methods/${slug}/index.html` : `.next/server/app/methods/${slug}.html`;
  const html = readFileSync(filename, "utf8").replace(/<script\b[^>]*>.*?<\/script>/gs, "");
  const groups = [...html.matchAll(/<section\b[^>]*data-result-setting="([^"]+)"[^>]*data-result-scope="([^"]+)"[^>]*>(.*?)<\/section>/gs)];
  const expected = [];
  for (const [setting, scopes] of Object.entries({ Standard: data.standard, ...data.lowShot })) {
    for (const [scope, entries] of Object.entries(scopes)) {
      const matches = entries.filter((row) => canonical(row.method) === slug);
      if (matches.length) expected.push({ setting, scope, comparisonCount: entries.length, entries: matches });
    }
  }
  assert.equal(groups.length, expected.length, `${slug}: missing or duplicate visible settings/scopes`);
  groups.forEach(([, setting, scope, body], i) => {
    const target = expected[i];
    assert.equal(setting, target.setting, `${slug}: setting differs`);
    assert.equal(scope, target.scope, `${slug}: scope differs`);
    assert.ok(text(body).includes(`Comparison set: ${target.comparisonCount} configurations`), `${slug}: comparison set differs`);
    const tbody = body.match(/<tbody>(.*?)<\/tbody>/s)?.[1];
    assert.ok(tbody, `${slug}: scores are absent from initial HTML`);
    const rows = [...tbody.matchAll(/<tr\b[^>]*>(.*?)<\/tr>/gs)].map(([, row]) =>
      [...row.matchAll(/<(?:td|th)\b[^>]*>(.*?)<\/(?:td|th)>/gs)].map(([, cell]) => text(cell)));
    assert.deepEqual(rows, target.entries.map((entry) => [entry.method, String(entry.rank), metric(entry.avgAccuracy), metric(entry.avgRank), entry.coverage]), `${slug}: visible results drifted from the public leaderboard`);
    const highest = target.entries.filter((entry) => entry.avgAccuracy !== null).sort((a, b) => b.avgAccuracy - a.avgAccuracy)[0];
    if (highest) assert.ok(text(body).includes(`highest reported average accuracy among this model's configurations in this setting is ${metric(highest.avgAccuracy)}%`), `${slug}: summary disagrees with table scores`);
  });
  if (["tic-fm", "tict"].includes(slug)) assert.ok(groups.every((group) => group[2] === "Univariate"), `${slug}: univariate result mislabeled as Overall`);
  console.log(`PASS ${slug}: ${groups.length} visible setting/scope groups match the leaderboard`);
}
