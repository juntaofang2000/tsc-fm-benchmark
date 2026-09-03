<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Required paired release (user instruction)

- Every website change must be published to BOTH the Vercel primary site and the `juntaofang2000/tsc-fm-benchmark-public` GitHub Pages mirror from the same source state.
- Use the standard build scripts, which generate `public/release.json`. Never reuse an old static export or copy a server build into the public repository.
- Run `npm run verify:release` after BOTH deployments complete. A pushed commit or a queued Pages workflow is not a successful deployment. If either deployment or the comparison fails, the release is incomplete; fix it or clearly report the blocker.
- Preserve matching research data, copy, metadata, canonical URLs and method pages. Hosting-only differences are allowed: Pages has a repository base path, cannot host the submission backend, and links to the primary submission form; aliases use static redirect documents there.
- Do not copy raw benchmark data, source files, secrets, `.env` files or build caches into the public mirror. Follow `docs/RELEASE.md`.
