import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

process.chdir(resolve(import.meta.dirname, ".."));
const identity = JSON.parse(readFileSync("src/config/site-identity.json", "utf8"));
const origin = new URL(identity.primaryUrl);
const key = readFileSync("public/indexnow-key.txt", "utf8").trim();
assert.match(key, /^[a-zA-Z0-9-]{8,128}$/, "Invalid IndexNow key");
const keyLocation = new URL("/indexnow-key.txt", origin).href;
const routes = [...readFileSync("src/config/seo-pages.ts", "utf8").matchAll(/path:\s*"([^"]+)"/g)].map((match) => match[1]);
const slugs = [...readFileSync("src/data/official/methods.ts", "utf8").matchAll(/slug:\s*"([^"]+)"/g)].map((match) => match[1]);
const paths = process.argv.filter((arg) => arg.startsWith("--path=")).map((arg) => arg.slice(7));
const allowed = [...routes, ...slugs.map((slug) => `/methods/${slug}`)];
for (const path of paths) assert.ok(allowed.includes(path), `${path}: not a canonical public page`);
const urlList = [...new Set((paths.length ? paths : allowed).map((path) => new URL(path, origin).href))];
const endpoint = "https://api.indexnow.org/indexnow";
if (!process.argv.includes("--submit")) {
  console.log(JSON.stringify({ mode: "dry-run", endpoint, host: origin.hostname, keyLocation, urlList }, null, 2));
  process.exit(0);
}
const checked = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), redirect: "error" });
  assert.equal(response.status, 200, `${url}: HTTP ${response.status}`);
  return response;
};
// Notify only after both deployments are verified against the local manifest.
const expected = JSON.parse(readFileSync("public/release.json", "utf8"));
const verification = JSON.parse(readFileSync("artifacts/seo/live-verification.json", "utf8"));
assert.equal(verification.result, "passed");
assert.equal(verification.contentRevision, expected.contentRevision, "Run verify:release for this source before notifying search engines");
assert.deepEqual(await (await checked(new URL("/release.json", origin))).json(), expected, "Primary release changed");
assert.deepEqual(await (await checked("https://juntaofang2000.github.io/tsc-fm-benchmark-public/release.json")).json(), expected, "Mirror release changed");
assert.equal((await (await checked(keyLocation)).text()).trim(), key, "Published key is missing or stale");
const sitemap = await (await checked(new URL("/sitemap.xml", origin))).text();
for (const url of urlList) assert.ok(sitemap.includes(`<loc>${url}</loc>`), `${url}: not in live sitemap`);
const response = await fetch(endpoint, {
  method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: origin.hostname, key, keyLocation, urlList }),
  signal: AbortSignal.timeout(30000),
});
const body = await response.text();
const record = { submittedAt: new Date().toISOString(), endpoint, contentRevision: expected.contentRevision, status: response.status, body, urlList, result: response.status === 200 ? "received" : response.status === 202 ? "received-key-validation-pending" : "failed" };
mkdirSync("artifacts/seo", { recursive: true });
writeFileSync("artifacts/seo/indexnow-submission.json", `${JSON.stringify(record, null, 2)}\n`);
assert.ok([200, 202].includes(response.status), `IndexNow HTTP ${response.status}: ${body}`);
console.log(`IndexNow ${response.status}: ${urlList.length} canonical URLs received${response.status === 202 ? "; key validation pending" : ""}. Receipt is not proof of indexing or ranking. Google is not covered by this submission.`);
