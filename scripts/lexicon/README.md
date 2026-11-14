# Dictionary selection evidence

Run `node scripts/lexicon/build-dictionary.mjs --offline` from the repository root to reproduce the checked-in candidate dictionary and the evidence for the 300 authored cards. Without `--offline`, the script downloads the pinned source if its cache is missing.

The source is ECDICT at commit `39cfb9672c0906b63569e0453c2e6abfb9ab182a`. `data/sources/lexicon.json` records the origin, expected bytes, Git blob hash, field meanings and limitations. The complete source CSV stays in the ignored `.npm-cache/lexicon/` directory. Redistribution of the selected dictionary data retains the source's MIT notice in `data/sources/licenses/ECDICT-MIT.txt`.

Outputs:

- `data/lexicon-candidates.json`: filtered dictionary rows available for genuine-context selection; this is a candidate pool, not the final app vocabulary.
- `data/lexicon-curated-evidence.json`: source tags and ranks for all 300 authored headwords, without replacing their reviewed definitions or contexts.
- `data/analysis/lexicon-dictionary-profile.json`: exact source counts, exclusions, source hashes and pool coverage.

The source contains 770,611 rows and 5,040 separate `ielts` tags. A tag means that the independent dictionary marks a headword as IELTS-related. It does not mean IELTS endorsement, recent examination frequency, or membership of an official IELTS vocabulary list. The general corpus ranks (`bnc`, `frq`) also do not measure IELTS examinations. The project's official public-sample counts remain in their separate corpus pipeline.

Selection keeps lower-case single-word lemmas with a pronunciation, a Chinese gloss and an English definition matching the primary dictionary POS. The source's corpus POS distribution is preferred when present; otherwise the first Chinese gloss POS determines the primary sense. Source English POS prefixes are removed. Target-containing asides can be removed without discarding the main definition; self-defining, biographical and unsuitable senses are rejected. Inflections use explicit source exchange entries for the selected POS, without derivational stemming. Source phonetics receive conservative notation cleanup and remain labelled as source pronunciation rather than individually verified UK IPA.

New candidates have a minimum positive general rank of 500. They either carry the source IELTS tag or rank in the first 20,000 in one of the two source rank fields. A named risk set excludes inspected cases with a missing ordinary sense, incompatible examples or a pronunciation tied to another POS. These exclusions do not modify the 300 authored cards.

`rawSenses` preserves usable source alternatives for final context review. POS matching alone does not establish the intended meaning: real sentences must also fit the selected definition. Prefer less polysemous candidates and inspect the final selection. Tatoeba sentences and optional translations retain their own author, ID, URL and licence; their source attribution is separate from the ECDICT dictionary licence.

## Reviewed release assembly

`npm run lexicon:build` reads the explicit approvals in `data/lexicon-reviews/review-*.json` and `core-editorial.json`. Every approved record was inspected against all three contexts; the review may correct the POS, English definition, Chinese gloss, forms, pronunciation, or selected source IDs. `authoredContexts` holds three newly written bilingual examples with Reading/Writing/Listening labels. These have no Tatoeba attribution and are marked `contextOrigin: editorial`.

The assembler preserves the original 300 cards and adds exactly 1,700 approved words. Core-topic supplements are preferred, then the lowest positive general rank; all additions need a positive rank at most 20,000. Inflected forms cannot claim another card's headword or forms. Invalid glosses, target spans, repeated targets, missing source credits and unsuitable lengths prevent a candidate from entering the release. `--check` validates availability without writing a release. Fewer than 2,000 final words aborts assembly.

Outputs include `data/lexicon-import.json` (the app's 1,700 additions, 5,100 contexts and all 300 legacy cards' selection evidence), `data/lexicon-selected-final.json` (the selected approvals and review-file hashes), and `data/analysis/lexicon-quality.json` (coverage, rank cutoffs and context counts). The exact selected community contexts are retained in `data/sources/selected-contexts.json`; a subsequent assembly does not need the ignored 75 MB alternative pool. Already published headwords retain priority on rebuild, and a previously released card cannot silently disappear.

`npm run lexicon:verify` independently compares every redistributed Tatoeba sentence's exact text and author with the hash-locked raw English export, and every provided translation with the actual ManyThings bilingual pair. It writes `data/analysis/sentence-verification.json`. The raw source caches and the isolated `unbzip2-stream@1.4.3` helper must be available; see `scripts/sentences/build.mjs` for source preparation. This check proves source identity, while the separate per-card reviews address meaning and usability.

The official IELTS sample statistics remain independent:

```powershell
npm.cmd run lexicon:build
npm.cmd run lexicon:verify
npm.cmd run corpus:build -- --offline
npm.cmd run corpus:verify
npm.cmd test
npm.cmd run build
```

Do not regenerate the mutable upstream community export and silently reuse old approvals. Sentence text, meaning, POS and attribution must be checked again when its source changes.

## Advanced collection

The advanced collection contains 1,000 reviewed additions. Source CET6, TOEFL or GRE tags are required; school and CET4 tags are excluded. Each word has a positive BNC or contemporary rank within 20,000, three sense-matched contexts, and an explicit approval in `data/advanced-reviews`. The selection prioritises academic concepts, formal expression and IELTS topics.

`npm run lexicon:advanced` reconstructs `data/advanced-vocabulary.json` from the fixed `data/advanced-selection.json`, dictionary candidates, approvals and `data/sources/advanced-contexts.json`. Original bilingual contexts live in the approval records. Source examples retain exact text and attribution. `data/vocabulary-tags.json` supplies the examination-list evidence used by the difficulty filters.

After vocabulary changes, run `npm run lexicon:verify`, `npm run corpus:build -- --offline`, `npm run corpus:verify`, and `node --import tsx backend/build-manifest.mts`, followed by the normal product checks. The public server manifest contains the same 3,000 word IDs and 9,000 context IDs used by the browser.
