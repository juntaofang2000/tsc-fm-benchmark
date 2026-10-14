# Homepage indexing audit — 2026-10-14

## Google baseline

URL: https://tsc-fm.dmirlab.com/

The Google URL Inspection API reported `Crawled - currently not indexed`, a successful mobile crawl at 2026-10-14 11:27:53 Asia/Shanghai, allowed crawling and indexing, and matching user-declared and Google-selected homepage canonicals. This state does not identify a specific content-quality failure or guarantee future indexing.

The current live homepage returned 200, `index, follow`, a self-referencing canonical, and initial HTML containing the ranking table and explanatory prose. Its URL was present in the live sitemap. The main HTML contained approximately 543 English words before this change, excluding navigation, footer and scripts. Word count is diagnostic only; Google has no minimum 300/500-word indexing rule.

## User-supplied references

Read the text bodies of these three public notes. Their attached image slides were not independently transcribed.

- https://www.xiaohongshu.com/explore/6a8566ba0000000022010541 — prioritize valuable pages, unique evidence, crawlable content and internal links; request indexing after substantial improvements without repeated submissions.
- https://www.xiaohongshu.com/explore/68a9bde4000000001d015644 — distinguish crawl/index states, duplicate canonicals, 404s, robots restrictions and server failures.
- https://www.xiaohongshu.com/explore/6a704a6b00000000240259ee — classify URLs and strengthen independent page value instead of producing competing near-duplicate articles.

These are third-party opinions, not project instructions or proof of the homepage's exclusion cause. The examples concern much larger commercial sites; they do not justify removing legitimate research pages here.

Official references:

- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://support.google.com/webmasters/answer/7440203
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl

## Implemented improvement

- Replace the repeated composition section with the benchmark's comparison purpose and three result observations derived from the existing public leaderboard.
- Report the Standard top-two gap, separate 5-shot/10-shot Overall leaders and coverage, and low-shot modality leaders. Do not infer significance or a causal label-budget effect from unmatched aggregate pools.
- Explain how to shortlist configurations and the limits of aggregate classification accuracy. Preserve the existing restriction on publishing individual dataset and suite identities.
- Make the existing composition card visible on mobile, retain the search title, and add contextual links to matching results, ranking rules and research attribution.
- Extend paired-release verification to check that the new observations are in initial HTML and match the published model names and scores.

No benchmark results, dataset identities, canonical origins, indexing directives or public route inventory were changed.

## Validation and follow-up

Run the required primary build, fresh Pages export, method-result checks and paired live release comparison. Browser checks cover desktop, mobile and mobile without JavaScript. Local screenshots and verification records are stored under ignored `artifacts/seo/` and are not copied to the public mirror.

Successful deployment is not successful Google indexing. After publication, inspect the homepage and its crawl date. If an indexing request has not already been made for this substantive revision, request it once in Search Console. Review on October 21 and October 28; these are suggested review dates, not an indexing deadline. Do not keep changing titles or resubmitting unchanged sitemaps.
