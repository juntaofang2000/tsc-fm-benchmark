# Paired website release

The primary Vercel site and the public GitHub Pages mirror are one release. A release is **not complete** until both deployments succeed and the live comparison passes.

## Required sequence

1. Make changes in this source repository. Run the existing data generators, lint and `npm run build`.
2. Run `npm run build:pages` and `node scripts/verify-release.mjs --export`. The export script archives any previous `out` before building and rejects missing/stale exports.
3. Commit and push the same source state. Deploy Vercel production.
4. Run `npm run sync:mirror` to copy only the verified fresh `out` into the sibling `tsc-fm-benchmark-public` checkout. The script verifies its remote and clean working tree, archives old generated files, and preserves `.git` and README. Never merge new assets into stale pages/assets. Never copy source, raw benchmark data, environment files, dependencies or caches.
5. Commit/push the mirror and wait for **successful** GitHub Pages deployment. A successful git push is not proof of deployment. Inspect a failed workflow and retry transient deployment failures.
6. Run `npm run verify:release`. It checks the current source fingerprint against **both live sites**, all canonical page titles/descriptions, social cards, rendered content, sitemap, demo noindex, old method redirects and removed benchmark routes. Any mismatch fails the command. Do not report publication complete until it passes.

The manifest at `/release.json` contains only a deterministic SHA-256 content fingerprint and the canonical origin. It does not expose source paths, raw datasets, credentials, or the private mapping. Source text line endings are normalized so Windows/Linux builds match. No build timestamp is part of the fingerprint.

## Allowed hosting differences

- The mirror uses its GitHub repository base path; the primary does not.
- The mirror is static and sends users to the primary submission form. Only Vercel serves the submission backend and analytics.
- Old method URLs use HTTP 308 on Vercel and zero-delay canonical redirect documents on Pages.
- Canonical URLs and social images on **both** sites point to the corresponding primary page, never a not-yet-configured domain.

Research data, calculations, copy, model catalog and SEO metadata must remain consistent. Dynamic submission records are stored centrally, not duplicated into the mirror.

## SEO configuration and future domain change

The primary canonical origin is `https://tsc-fm.dmirlab.com`. The previous `tsc-fm-benchmark.vercel.app` host stays attached to the same Vercel project and serves host-specific HTTP 301 redirects to matching new URLs, including direct alias-to-canonical redirects. Query parameters are preserved. Keep these redirects for at least one year after the September 3, 2026 migration, preferably longer.

The old host's `/robots.txt` and `/google97f75c01e0f4500a.html` remain directly accessible for crawling and ownership checks. `/api` paths are excluded so existing submission clients preserve their request methods and bodies. Do not replace this configuration with a blanket Vercel domain redirect, which would also redirect verification and API paths. GitHub Pages stays a content mirror with canonical URLs pointing to the new primary.

`src/config/site-identity.json` is the default canonical origin; `NEXT_PUBLIC_PRIMARY_SITE_URL` can override it. Do not set a future domain until DNS, TLS and primary hosting are verified. Then redirect the old primary, update the shared origin, rebuild/redeploy both sites and rerun the live check.

`src/config/seo-pages.ts` defines public page metadata; `src/config/method-aliases.json` defines consolidated method routes. The sitemap includes canonical model pages and omits demo/alias pages. Share cards are generated at build time, not fetched from an external image service.

Search Console ownership supports the owner's HTML file upload verification through `public/google97f75c01e0f4500a.html`. Preserve the original filename and contents in both deployments. Verify that the primary root URL `/google97f75c01e0f4500a.html` returns HTTP 200 and the exact file contents without authentication or a redirect. Keep the file published after verification because Google periodically checks ownership.

The optional `GOOGLE_SITE_VERIFICATION` environment variable supports the separate HTML meta-tag verification method (a public verification token, not an API secret). Obtain a meta-tag token from the owner's Google account; never derive it from a verification filename or invent one. A published verification file is not proof of completed ownership verification: confirm success in Search Console, then submit `/sitemap.xml` and record indexing/performance baselines. Search traffic and field Core Web Vitals may have insufficient data on a new site; do not report this as a passing measurement.
