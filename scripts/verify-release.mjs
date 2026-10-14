import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
process.chdir(root);
const refresh = spawnSync(process.execPath, ["scripts/write-release-manifest.mjs"], { stdio: "inherit" });
assert.equal(refresh.status, 0, "Could not determine current source revision");
const expected = JSON.parse(readFileSync("public/release.json", "utf8"));
const identity = JSON.parse(readFileSync("src/config/site-identity.json", "utf8"));
assert.equal(identity.title, `${identity.name}: ${identity.subtitle}`, "Full title must follow the shared naming rule");
const args = process.argv.slice(2);
const staticOnly = args.includes("--export");
const primary = args.find((arg) => arg.startsWith("--primary="))?.slice(10) || expected.primaryUrl;
const mirror = args.find((arg) => arg.startsWith("--mirror="))?.slice(9) || "https://juntaofang2000.github.io/tsc-fm-benchmark-public";
const routes = [...readFileSync("src/config/seo-pages.ts", "utf8").matchAll(/path:\s*"([^"]+)"/g)].map((match) => match[1]);
const slugs = [...readFileSync("src/data/official/methods.ts", "utf8").matchAll(/slug:\s*"([^"]+)"/g)].map((match) => match[1]);
const paths = [...routes, ...slugs.map((slug) => `/methods/${slug}`)];
assert.equal(new Set(paths).size, paths.length, "Duplicate canonical routes");
assert.ok(paths.length >= 17, "Canonical route discovery is incomplete");
const aliases = JSON.parse(readFileSync("src/config/method-aliases.json", "utf8"));
const canonical = (path) => new URL(path, expected.primaryUrl).toString();
const decode = (text) => text.replace(/&amp;/g, "&").replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
function attributes(tag) { return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], decode(m[2])])); }
function inspect(html, path) {
  const metas = [...html.matchAll(/<meta\s[^>]*>/g)].map((m) => attributes(m[0]));
  const meta = (name) => metas.find((m) => m.name === name || m.property === name)?.content;
  const title = decode(html.match(/<title>(.*?)<\/title>/s)?.[1] || "");
  assert.ok(title && meta("description"), `${path}: missing title/description`);
  assert.equal(meta("og:title"), title, `${path}: OG title mismatch`);
  assert.equal(meta("twitter:title"), title, `${path}: Twitter title mismatch`);
  if (path === "/") assert.equal(title, identity.seoTitle, "Homepage search title must use the shared SEO title");
  const footer = html.match(/<footer\b[^>]*>(.*?)<\/footer>/s)?.[1] || "";
  assert.ok(footer.includes(identity.subtitle), `${path}: footer subtitle mismatch`);
  const links = [...html.matchAll(/<link\s[^>]*>/g)].map((m) => attributes(m[0]));
  assert.equal(new URL(links.find((l) => l.rel === "canonical")?.href || "about:blank").toString(), canonical(path), `${path}: canonical mismatch`);
  assert.equal(new URL(meta("og:url") || "about:blank").toString(), canonical(path), `${path}: OG URL mismatch`);
  assert.equal(meta("twitter:card"), "summary_large_image", `${path}: missing large social card`);
  const image = meta("og:image");
  assert.ok(image?.startsWith(`${expected.primaryUrl}/social/`), `${path}: social image must be on canonical origin`);
  assert.ok(!meta("robots")?.includes("noindex"), `${path}: unexpectedly noindex`);
  assert.match(meta("robots") || "", /\bindex\b/, `${path}: missing index directive`);
  assert.match(meta("googlebot") || "", /max-image-preview:large/, `${path}: missing large image preview permission`);
  assert.ok(!meta("googlebot")?.includes("noindex"), `${path}: Googlebot unexpectedly noindex`);
  const schemas = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
  assert.ok(schemas.some((s) => s["@type"] === "WebSite"), `${path}: missing WebSite schema`);
  const main = html.match(/<main\b[^>]*>(.*?)<\/main>/s)?.[1];
  assert.ok(main, `${path}: no prerendered main content`);
  if (path === "/leaderboard") {
    assert.ok(main.includes("Time Series Classification Leaderboard") && main.includes("<table"), "Leaderboard heading and results must render in main without a JavaScript reveal");
    assert.ok(!main.includes('aria-label="Loading table"'), "Leaderboard main must not be a loading placeholder");
    for (const marker of ["server-summary-standard", "server-summary-5-shot", "server-summary-10-shot", "server-summary-modality"]) {
      assert.ok(main.includes(`data-testid="${marker}"`), `Leaderboard must prerender ${marker}`);
    }
    assert.ok((main.match(/<table\b/g) || []).length >= 4, "Leaderboard must prerender the interactive table and three setting summaries");
    assert.ok(main.includes("Protocol v0.1") && main.includes("How ranking works"), "Leaderboard must publish its version and ranking definition");
    assert.ok(schemas.some((s) => s["@type"] === "Dataset" && s.url === canonical(path) && String(s.citation).includes("https://www.preprints.org/manuscript/202609.2097")), "Leaderboard results dataset must cite the benchmark paper");
  }
  if (path === "/") {
    assert.ok(schemas.some((s) => s["@type"] === "CollectionPage" && s.isPartOf?.["@id"] === `${expected.primaryUrl}/#website`), "Homepage resource collection must reference the canonical website");
    assert.ok(schemas.some((s) => s["@type"] === "CollectionPage" && s.citation?.url === "https://www.preprints.org/manuscript/202609.2097"), "Homepage must associate the benchmark with the verified paper");
    assert.ok(main.includes("time series classification benchmark"), "Homepage must explain the benchmark topic in visible text");
    assert.ok(main.includes("https://www.preprints.org/manuscript/202609.2097"), "Homepage must link to the verified benchmark paper");
    const findings = main.match(/<div data-testid="home-research-findings"[^>]*>(.*?)<\/section>/s)?.[1];
    assert.ok(findings, "Homepage research observations must be present in initial HTML");
    const published = JSON.parse(readFileSync("src/data/official/public-leaderboards.json", "utf8"));
    const observations = [published.standard.Overall[0], published.standard.Overall[1], ...Object.values(published.lowShot).flatMap((scopes) => [scopes.Overall[0], scopes.Univariate[0], scopes.Multivariate[0]])];
    for (const row of observations) {
      assert.ok(decode(findings).includes(row.method) && findings.includes(row.avgAccuracy.toFixed(2)), "Homepage observations must match the published leaderboard");
    }
    assert.ok(findings.includes("does not establish statistical significance") && findings.includes("would not isolate the effect of adding labels"), "Homepage must qualify aggregate and cross-budget comparisons");
  }
  if (path.startsWith("/methods/")) {
    assert.ok(main.includes("data-result-setting=") && main.includes("<table"), `${path}: model results must render without opening a tab`);
    assert.ok(main.includes('id="resources"'), `${path}: source resources must be directly accessible`);
  }
  const text = decode(main.replace(/<script\b[^>]*>.*?<\/script>|<style\b[^>]*>.*?<\/style>/gs, "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  return { title, description: meta("description"), image, text };
}
async function fetchChecked(url, status = 200, redirect = "follow") {
  const response = await fetch(url, { redirect, signal: AbortSignal.timeout(30000), headers: { "Cache-Control": "no-cache" } });
  assert.equal(response.status, status, `${url}: HTTP ${response.status}, expected ${status}`);
  return response;
}
const endpoint = (base, path) => `${base.replace(/\/$/, "")}${path === "/" ? "/" : path}`;
const exportRead = (path) => readFileSync(join("out", path === "/" ? "index.html" : path.slice(1), path === "/" ? "" : "index.html"), "utf8");
function checkPng(buffer, label) {
  assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${label}: not PNG`);
  assert.equal(buffer.readUInt32BE(16), 1200, `${label}: width`);
  assert.equal(buffer.readUInt32BE(20), 630, `${label}: height`);
}
const records = [];
if (staticOnly) {
  assert.deepEqual(JSON.parse(readFileSync("out/release.json", "utf8")), expected, "Static export uses stale source");
} else {
  for (const base of [primary, mirror]) {
    const manifest = await (await fetchChecked(endpoint(base, "/release.json"))).json();
    assert.deepEqual(manifest, expected, `${base}: deployed revision does not match current source`);
  }
}
for (const path of paths) {
  if (staticOnly) {
    const data = inspect(exportRead(path), path);
    checkPng(readFileSync(join("out", new URL(data.image).pathname.slice(1))), data.image);
    records.push({ path, ...data });
  } else {
    const pages = await Promise.all([primary, mirror].map(async (base) => inspect(await (await fetchChecked(endpoint(base, path))).text(), path)));
    for (const field of ["title", "description", "image", ...(path === "/submit" ? [] : ["text"])]) {
      assert.equal(pages[0][field], pages[1][field], `${path}: primary/mirror ${field} differs`);
    }
    if (path === "/submit") {
      assert.ok(pages[0].text.includes("Model Information"), "Primary submission form is missing");
      assert.ok(pages[1].text.includes("Open submission form"), "Mirror submission handoff is missing");
    }
    checkPng(Buffer.from(await (await fetchChecked(pages[0].image)).arrayBuffer()), pages[0].image);
    records.push({ path, ...pages[0] });
  }
  console.log(`PASS ${path}`);
}
assert.equal(new Set(records.map((r) => r.title)).size, paths.length, "Duplicate page titles");
assert.equal(new Set(records.map((r) => r.description)).size, paths.length, "Duplicate descriptions");
for (const base of staticOnly ? ["export"] : [primary, mirror]) {
  const sitemap = staticOnly ? readFileSync("out/sitemap.xml", "utf8") : await (await fetchChecked(endpoint(base, "/sitemap.xml"))).text();
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => decode(m[1])).sort();
  assert.deepEqual(urls, paths.map(canonical).sort(), `${base}: sitemap does not match canonical pages`);
  const demo = staticOnly ? exportRead("/submissions/demo") : await (await fetchChecked(endpoint(base, "/submissions/demo"))).text();
  assert.match(demo, /<meta name="robots" content="noindex, follow"/, `${base}: demo must be noindex and crawlable`);
}
for (const [alias, slug] of Object.entries(aliases)) {
  if (staticOnly) {
    const html = exportRead(`/methods/${alias}`);
    assert.ok(html.includes(`content="0;url=${canonical(`/methods/${slug}`)}"`), `${alias}: static redirect missing`);
  } else {
    const response = await fetchChecked(endpoint(primary, `/methods/${alias}`), 308, "manual");
    assert.equal(new URL(response.headers.get("location"), primary).pathname, `/methods/${slug}`);
  }
}
if (!staticOnly) for (const base of [primary, mirror]) for (const path of ["/benchmarks/ucr", "/benchmarks/uea", "/benchmarks/mvcore66"]) await fetchChecked(endpoint(base, path), 404);
mkdirSync("artifacts/seo", { recursive: true });
writeFileSync(`artifacts/seo/${staticOnly ? "export" : "live"}-verification.json`, JSON.stringify({ checkedAt: new Date().toISOString(), ...expected, primary, mirror, canonicalPages: paths.length, aliases: Object.keys(aliases).length, result: "passed" }, null, 2));
console.log(`PASS: ${paths.length} canonical pages, ${Object.keys(aliases).length} aliases, matching release ${expected.contentRevision}`);

