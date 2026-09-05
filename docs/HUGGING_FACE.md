# Hugging Face distribution

The Hugging Face presence is a discovery layer for the official TSC-FM Benchmark. It does not become a second result store.

## Public repositories

- Organization: `TSC-FM`
- Organization Card: public Static Space `TSC-FM/README`, sourced from `hf-organization-card/`
- Compact benchmark Space: public Static Space `TSC-FM/benchmark`, sourced from `hf-space/`
- Canonical benchmark and submissions: `https://tsc-fm.dmirlab.com/`

Hugging Face requires the Organization Card Space to be named `README` and public. The compact benchmark Space also stays public.

## How result synchronization works

The Space repository contains HTML, CSS, JavaScript, and brand assets only. It contains no leaderboard or benchmark JSON snapshot. On each page load, `hf-space/app.js` requests:

`https://tsc-fm.dmirlab.com/api/public/space-summary`

The official endpoint derives the summary from the same benchmark modules used by the primary website and includes `schemaVersion` plus `contentRevision`. The Space accepts only schema version 1. If the request fails, times out, or returns an incompatible payload, the Space hides all result-dependent sections and links to the official leaderboard. It never renders an older local fallback.

Changing benchmark data therefore requires only the normal paired website release. Once the new primary deployment is live, the Space reads the new summary without a separate Hugging Face upload. Changes to the Space layout or Organization Card are synchronized separately through GitHub Actions.

## Initial publication

1. Create the public Hugging Face organization `TSC-FM`.
2. Create the public Static Spaces `TSC-FM/README` and `TSC-FM/benchmark`.
3. Create a Hugging Face token with write access to those two repositories and store it in the source GitHub repository as the `HF_TOKEN` Actions secret.
4. Set the source GitHub repository Actions variable `HF_SYNC_ENABLED` to `true`.
5. Run the `Sync Hugging Face entry points` workflow once and verify both public pages.
6. Update the primary website's Hugging Face link to `https://huggingface.co/TSC-FM` only after the organization page exists.

The workflow is guarded by `HF_SYNC_ENABLED`. Before setup, pushes are skipped rather than failing or publishing to an unverified namespace.

## Release checks

Run `pnpm run verify:hf` before committing changes to either Hugging Face directory. For benchmark data changes, complete the normal Vercel and GitHub Pages paired release first, then verify the live endpoint and the rendered Space show the same `contentRevision`.
