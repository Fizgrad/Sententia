# Source-backed example sentences

Run from the repository root. Raw archives, decompression helpers, and retained
alternatives stay under the ignored `.npm-cache/sentences/` directory.

```powershell
npm install --prefix .npm-cache/sentences/tools --no-audit --no-fund --ignore-scripts unbzip2-stream@1.4.3 wink-pos-tagger@2.2.2
node scripts/sentences/build.mjs
```

The input is `data/lexicon-candidates.json`. The output is
`data/sources/tatoeba-sentences.json`, with `examples` keyed by dictionary
headword. Each qualifying headword has three complete, unchanged sentences,
source IDs, author attribution, source links, a license identifier, and the
exact target form and character span. Genuine aligned Mandarin translations
retain a separate sentence ID and author. Missing translations are empty
strings. Imported contexts use the neutral `Example` register.

The source registry records download URLs, compressed byte counts, SHA-256
hashes, license links, and the original ManyThings notice. The Tatoeba weekly
downloads can change; hashes identify the actual cached snapshot used here.
The build downloads missing archives, but does not silently replace a cache.

`--bilingual-only` profiles the Mandarin pairs without scanning the English
export. `--reuse-pools` reselects from the retained alternatives and rechecks
current dictionary forms, part of speech, safety, and diversity. To produce
the final approved subset, supply a JSON array of words or objects with a
`word` field:

```powershell
node scripts/sentences/build.mjs --reuse-pools --selected-words data/lexicon-selected.json
```

Full builds retain up to 30 alternatives per headword in
`.npm-cache/sentences/retained-pools.json`. They can be inspected during sense
review without distributing the entire source corpus. `--output` supports a
different generated-example destination; `--candidates` supports a different
dictionary candidate file.

Selection requires 8–32 English words, exactly one occurrence among the
headword and its known forms, and three different sentences. Token overlap
and ordered-token edit distance reject close substitutions. Filters suppress
names, hostile and adult material, threats, obvious literary archaisms,
metalinguistic glosses, and several kinds of unsuitable fictional contexts.
An English author must have self-reported native proficiency in the official
export or occur in the checked ManyThings English pair collection.

Wink's POS tags and additional noun/adjective phrase checks reduce grammar
errors. Definition-word overlap influences ranking. These are fallible
filters: they do not establish a dictionary sense or independently prove
naturalness or factual correctness. Review the selected English contexts
against their precise English and Chinese definitions before approving a
headword. Imported sentences are community language examples, not IELTS
exam extracts, frequency evidence, or independently assigned academic genres.

Source documentation: [Tatoeba downloads](https://tatoeba.org/en/downloads)
and [ManyThings bilingual pairs](https://www.manythings.org/anki/).
Sentence material is attributed under
[CC BY 2.0 France](https://creativecommons.org/licenses/by/2.0/fr/).
