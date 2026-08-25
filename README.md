# ChorusTIC Benchmark

## Overview

ChorusTIC Benchmark is a professional research benchmark and leaderboard demo for Time Series Classification Foundation Models (TSC-FMs). The current release is a static, presentation-ready frontend. Its architecture separates page components from data access so the future evaluation backend can be introduced without rebuilding the product interface.

## Features

- Unified Overall, Standard, Low-shot, OOD, Training-Free / ICL, and Frozen-Probe leaderboard views
- Sortable, searchable, filterable, paginated TanStack tables
- UCR-128, UEA-30, MVCore66, and OOD benchmark pages
- Method registry and dynamic method detail pages
- Scientific evaluation protocol and planned pipeline
- Persistent model submission form with immutable GitHub and Hugging Face revisions
- Responsive navigation, mobile tables, and Light / Dark / System themes
- Explicit Demo Data labelling and null-safe metric display

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
    benchmarks/[slug]/
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
  data/demo/                 Illustrative demo records
  lib/data/                  Replaceable data-access functions
  types/                     Strict benchmark domain types
```

## Demo Data

The Overall leaderboard uses verified per-dataset UCR-128 and UEA-30 accuracy records. It is the unweighted mean over all 158 datasets, and only methods with complete 158/158 coverage are ranked. Other unfinished surfaces, including low-shot curves and small benchmark-detail samples, remain explicitly labelled Demo Data.

## Deployment

1. Push this directory to a Git repository.
2. Import the repository in Vercel.
3. Keep the detected framework as Next.js.
4. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
5. Configure the Supabase submission variables described below.
6. Deploy using the default build command (`next build`).

## GitHub Pages Static Mirror

The repository includes an independent, read-only GitHub Pages deployment. Every push to `main` runs `.github/workflows/deploy-pages.yml`, exports the public Next.js routes, and publishes the generated `out/` directory.

The mirror includes Home, Leaderboard, Capability Map, Benchmarks, Methods, Evaluation, and every statically generated benchmark and method route. GitHub Pages does not run a Next.js server, so `/api/submissions` is intentionally absent and the mirror submission page links to the interactive Vercel site. Vercel Web Analytics is also disabled in the mirror.

### First-time GitHub setup

1. Push this project to the public `juntaofang2000/tsc-fm-benchmark` repository using the `main` branch.
2. Open **Repository Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open the repository **Actions** tab and wait for **Deploy GitHub Pages mirror** to finish.
5. Visit `https://juntaofang2000.github.io/tsc-fm-benchmark/`.

No custom domain is required. The build determines the repository subpath automatically, so internal navigation and static assets work below `/tsc-fm-benchmark/`.

To verify the mirror locally:

```bash
pnpm run build:pages
```

The static files are written to `out/`. The normal `pnpm build` command remains unchanged for Vercel.

## Analytics

The site uses Vercel Web Analytics for privacy-friendly aggregate traffic statistics. It is integrated once in the root App Router layout, so normal page views and dynamic benchmark and method routes are covered automatically without tracking cookies.

To enable collection after deployment, open the project in the Vercel dashboard, select **Analytics**, and choose **Enable Web Analytics**. No page-level analytics setup is required.

## Model Submission Backend

The `/submit` form stores metadata only. It does not upload or execute third-party files. Every submission must identify:

- a public GitHub repository and its full 40-character commit SHA;
- a public Hugging Face model repository and its full 40-character revision SHA;
- contact, license, environment, and evaluation-track metadata.

The fixed revisions make later review and evaluation reproducible even if a repository's default branch changes.

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

## Updating Leaderboard Data

The canonical public result source is:

```text
benchmark-data/standard/ucr-uea/source/results_long.csv
```

Suite membership and the reproducible aggregation script are stored alongside it under `suites/` and `scripts/`. Regenerate the checked reports after changing facts or suite membership:

```bash
python benchmark-data/standard/ucr-uea/scripts/build_results.py --no-release-wide
```

The GitHub Pages workflow reruns this command and rejects deployment if the checked generated tables do not match the long table. Do not edit files under `benchmark-data/standard/ucr-uea/generated/` manually.

The site-facing TypeScript snapshot is under `src/data/official/leaderboard.ts` and must only be refreshed from the generated CSV reports. Remaining illustrative interface data is under:

```text
src/data/demo/
```

Pages read data through `src/lib/data/leaderboard.ts`, `benchmarks.ts`, and `methods.ts`. When the backend arrives, replace the implementations of those functions rather than rewriting page components.

## Capability Map

`/capability-map` analyses the verified per-dataset UCR/UEA accuracy facts by task condition. It reports mean accuracy, mean rank, dataset-level 95% bootstrap confidence intervals, win/tie/loss counts, and actual coverage. Missing method-dataset results are excluded and are never converted to zero.

The static page bundle is generated by:

```text
../时序基模发布/release/ChorusTIC/UCR_UEA_per_dataset_results/scripts/build_capability_map.py
```

On the first run, pass the UCR and UEA archive roots so the script can create `generated/capability_dataset_metadata.csv`. Later result-only updates can reuse that metadata cache and only regenerate the aggregate JSON. The website copy is stored at `src/data/official/capability-map.json`.

The current task buckets are documented in the generated bundle. Domain labels deliberately remain empty until a reviewed taxonomy is provided. Low-shot, OOD, and MVCore66 remain marked Demo and are not mixed with official UCR/UEA results.

Directional “advantage” summaries require at least 10 paired datasets, a paired-bootstrap 95% interval above zero, and a two-sided exact sign test with Holm correction below 0.05. Model-origin lenses can overlap, so significance claims are restricted to the mutually exclusive decision-interface paradigms.

## Future Architecture

- Frontend: Vercel + Next.js
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Submission metadata: Supabase
- Artifacts: Object Storage / Hugging Face
- Evaluation API: FastAPI
- Evaluation Queue: Redis-based queue
- Evaluation Worker: Independent GPU Server
- Sandbox: Docker

```text
Browser
  -> Next.js
  -> Supabase
  -> Evaluation Queue
  -> GPU Worker
  -> Official Evaluation Script
  -> Results
  -> Supabase
  -> Leaderboard
```

The first Supabase integration is limited to submission intake and manual review. Public accounts, status lookup, artifact uploads, automatic queues, and GPU execution remain future work.

## License

TODO: Select and add an explicit project license before public release.
