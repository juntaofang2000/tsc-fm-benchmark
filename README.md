# TSC-FM Benchmark

Official site: [TSC-FM Benchmark: Benchmarking Foundation Models for Time Series Classification](https://tsc-fm.dmirlab.com/)

## Overview

TSC-FM Benchmark is a research benchmark and leaderboard for Time Series Classification Foundation Models (TSC-FMs). The canonical site publishes verified Standard and Low-shot results, aggregate dataset and capability analysis, method pages, an evaluation protocol, and a live model-submission intake. ChorusTIC is one of the evaluated models; it is not the name of the benchmark.

## Features

- Unified Overall, Standard, Low-shot, Training-Free / ICL, and Frozen-Probe leaderboard views
- Sortable, searchable, filterable, paginated TanStack tables
- Aggregate benchmark-composition and capability-map pages
- Method registry and dynamic method detail pages
- Scientific evaluation protocol with an explicit boundary between active review and planned automated execution
- Persistent model submission form with immutable GitHub and Hugging Face revisions
- Responsive navigation, mobile tables, and Light / Dark / System themes
- Null-safe metric display and a separate noindex form demo for interface testing

## Tech Stack

- Next.js App Router
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui conventions with Radix UI primitives
- TanStack Table
- Recharts
- Lucide React
- next-themes

## Local Development

```bash
npm install
npm run dev
```

The checked-in pnpm lockfile is also supported:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Project Structure

```text
src/
  app/                       Next.js routes
    leaderboard/
    benchmarks/
    methods/[slug]/
    evaluation/
    submit/
    submissions/demo/
  components/
    benchmark/
    leaderboard/
    layout/
    method/
    providers/
    shared/
    ui/
  config/site.ts             External links and site configuration
  data/official/             Published benchmark profiles, methods, leaderboards, and capability aggregates
  data/demo/                 Illustrative records used only by explicitly marked demo surfaces
  lib/data/                  Replaceable data-access functions
  types/                     Strict benchmark domain types
```

## Official and Demo Data

The Standard Overall leaderboard uses verified per-dataset accuracy records. Its deduplicated union contains 198 datasets, with each unique dataset counted once and receiving equal weight. Only methods with complete 198/198 coverage are ranked. The public Low-shot leaderboard is a separate official track with 5- and 10-labels-per-class settings. The source pipeline also generates 1-shot audit tables, but they are not published in the site-facing leaderboard bundle.

## Deployment

1. Push this directory to a Git repository.
2. Import the repository in Vercel.
3. Keep the detected framework as Next.js.
4. The production canonical origin is `https://tsc-fm.dmirlab.com`, configured in `src/config/site-identity.json`. Use `NEXT_PUBLIC_PRIMARY_SITE_URL` only when intentionally overriding it; `NEXT_PUBLIC_SITE_URL` is used for the static mirror's asset origin.
5. Configure the Supabase submission variables described below.
6. Deploy using the default build command (`next build`).

## Public Static Mirror

GitHub Pages for this source repository is retired. The sanitized, read-only export is published from the separate `tsc-fm-benchmark-public` repository, which contains generated static artifacts only and has an independent Git history.

To verify the mirror locally:

```bash
pnpm run build:pages
```

The static files are written to `out/`. The normal `pnpm build` command remains unchanged for Vercel. The mirror has no submission API, and Vercel Web Analytics is disabled there.

## Analytics

The site uses Vercel Web Analytics for privacy-friendly aggregate traffic statistics. It is integrated once in the root App Router layout, so normal page views and dynamic benchmark and method routes are covered automatically without tracking cookies.

To enable collection after deployment, open the project in the Vercel dashboard, select **Analytics**, and choose **Enable Web Analytics**. No page-level analytics setup is required.

## Model Submission Backend

The `/submit` form stores metadata only. It does not upload or execute third-party files. Every initial submission must identify:

- a public GitHub repository, with an optional full 40-character commit SHA;
- a public Hugging Face model repository, with an optional full 40-character revision SHA;
- a contact email and requested evaluation track.

License and environment details are optional during initial intake and can be required during review before publication.

When a revision is omitted, the server resolves the repository's current `main` revision and stores the resulting full SHA. The fixed revisions make later review and evaluation reproducible even if a repository's default branch changes.

### Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run:

```text
supabase/migrations/202608170001_create_model_submissions.sql
```

3. Add these server-only environment variables locally and in Vercel:

```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Do not prefix these variables with `NEXT_PUBLIC_` or commit local environment files. The table has Row Level Security enabled: anonymous requests may only insert confirmed records with `status = pending`, and cannot read, update, or delete submissions. The Next.js route handler performs the stricter URL, commit, email, length, category, and track validation before writing a record.

### Review workflow

Open **Supabase → Table Editor → model_submissions**. New records use `status = pending`. Review the repository URLs, verify that both commits exist and are public, then change the status to one of:

```text
pending → under_review → approved → published
                         ↘ rejected
                         ↘ evaluation_failed
```

Use `review_notes` for private maintainer notes. The submission reference code has the form `TSCFM-YYYYMMDD-XXXXXXXX`.

The evaluation server should fetch the exact values stored in `github_repository`, `github_commit`, `huggingface_repository`, and `huggingface_revision`. It must run submitted code in an isolated environment; the Vercel application only accepts and records submissions.

### Submission email notifications

After Supabase accepts a submission, the route schedules a Resend notification without delaying the success response. Notification failures are logged on the server and never roll back the stored submission or turn the user's successful submission into an error.

Configure these server-only variables locally and in Vercel:

```bash
RESEND_API_KEY=YOUR_RESEND_API_KEY
RESEND_FROM_EMAIL=TSC-FM Benchmark <submissions@YOUR_VERIFIED_DOMAIN>
SUBMISSION_NOTIFICATION_EMAIL=benchmark-owner@example.com
```

`RESEND_FROM_EMAIL` must be an address permitted by the associated Resend account. Keep all three variables unprefixed so they are never included in the browser bundle. The notification contains the submission reference, contact details, evaluation track, repository URLs, and both immutable revisions. Supabase remains the source of truth if delivery fails.

## Updating Leaderboard Data

The canonical Standard result source is:

```text
benchmark-data/standard/ucr-uea/source/results_long.csv
```

Suite membership and the reproducible aggregation script are stored alongside it under `suites/` and `scripts/`. Regenerate the checked reports after changing facts or suite membership:

```bash
python benchmark-data/standard/ucr-uea/scripts/build_results.py --no-release-wide
```

The published Standard scopes are `ucr_128`, `uea_30`, `mvcore66_66`, and the deduplicated `overall_198`. MVCore66 source exports are imported with:

```bash
python benchmark-data/standard/ucr-uea/scripts/import_mvcore66_results.py \
  --source-root "/path/to/results/standard/MVCore66" \
  --overlap-file "/path/to/benchmark_overlap_uea_mvcore66.csv"
```

The importer validates the complete 10 × 66 result matrix, records source hashes, writes the 66-task and 40-MVCore66-only suite lists, and replaces only prior `archive = MVCore66` facts. The frozen Overall rule is:

```text
(128 × UCR mean + 30 × UEA mean + 40 × MVCore66-only mean) / 198
```

The canonical Low-shot result source and its local-source import manifest are:

```text
benchmark-data/low-shot/ucr-uea/source/results_long.csv
benchmark-data/low-shot/ucr-uea/source/dataset_manifest.json
benchmark-data/low-shot/ucr-uea/source/sources_manifest.json
```

To re-import updated local experiment exports and rebuild all Low-shot scopes:

```bash
python benchmark-data/low-shot/ucr-uea/scripts/import_local_results.py --source-root "/path/to/results/few-shot"
python benchmark-data/low-shot/ucr-uea/scripts/build_results.py
```

Low-shot audit rankings are generated independently for every shot budget and benchmark scope. The feasible dataset counts are 158/140/121 for Overall at 1/5/10-shot and 66/63/59 for MVCore66. The public adapter intentionally publishes only 5- and 10-shot results. Missing values remain blank and never become zero. ChorusTIC is imported from its UCR, UEA, and MVCore66 per-dataset files, with the checked `InsectWingbeatSubset` rerun supplement completing UEA coverage. UniShape summary-only files are recorded in the manifest but excluded from official rankings until per-dataset results are available.

The GitHub Pages workflow reruns both Standard and Low-shot aggregation commands and rejects deployment if the checked generated tables do not match the long tables. Do not edit either `generated/` directory manually.

The site-facing adapter at `src/data/official/leaderboard.ts` imports the generated JSON reports directly; there is no separate hand-maintained score snapshot. Remaining illustrative interface data is under:

```text
src/data/demo/
```

Pages read leaderboard and method data through the adapters in `src/lib/data/`. Benchmark-wide published counts and track descriptions live in `src/data/official/benchmark-profile.ts`.

## Capability Map

`/capability-map` analyses the verified per-dataset UCR/UEA accuracy facts by task condition. The public page exposes only fixed-core aggregates: mean accuracy, mean group rank, best/tied-best/other counts, and actual coverage. It does not ship dataset names, source paths, or dataset-level result rows. Missing method-dataset results are excluded and are never converted to zero.

The static page bundle is generated by:

```text
../时序基模发布/release/ChorusTIC/UCR_UEA_per_dataset_results/scripts/build_capability_map.py
```

On the first run, pass the UCR and UEA archive roots so the script can create `generated/capability_dataset_metadata.csv`. Later result-only updates can reuse that metadata cache and only regenerate the aggregate JSON. The sanitized website copy is stored at `src/data/official/public-capability-map.json`.

The current task buckets and reviewed domain taxonomy are documented in the generated bundle. Standard and Low-shot results remain separate from this analysis.

Directional “advantage” summaries require at least 10 paired datasets, a paired-bootstrap 95% interval above zero, and a two-sided exact sign test with Holm correction below 0.05. Model-origin lenses can overlap, so significance claims are restricted to the mutually exclusive decision-interface paradigms.

## Architecture Status

- Active frontend: Vercel + Next.js
- Active submission metadata and manual review: Supabase PostgreSQL
- Active immutable source resolution: GitHub commits and Hugging Face revisions
- Planned public accounts and status lookup: Supabase Auth
- Planned evaluation API: FastAPI
- Planned evaluation queue and GPU worker
- Planned sandboxed execution: Docker

```text
Active:  Browser -> Next.js -> Supabase intake -> Manual review
Planned: Manual review -> Evaluation queue -> GPU worker -> Verified result publication
```

The first Supabase integration is limited to submission intake and manual review. Public accounts, status lookup, artifact uploads, automatic queues, and GPU execution remain future work.

## License

The browser tab icon uses the original DMIR laboratory mark from the [laboratory website](https://dmir.gdut.edu.cn/), stored locally as `public/dmir-lab-icon.png` so it is available on both the primary site and the static mirror without a third-party image request. [Original image](https://dmir.gdut.edu.cn/g_d_g_y_d_x_s_j_w_j_y_x_x_j_s_s_y_s__files/images/dmirlogo.png).

TODO: Select and add an explicit project license before public release.
