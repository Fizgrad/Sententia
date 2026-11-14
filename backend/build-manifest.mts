/** Only public vocabulary identifiers are sent to the API, never personal data. */
import { writeFile } from 'node:fs/promises';
import { words, topics } from '../src/lib/corpus';

const document = {
  schemaVersion: 1,
  words: Object.fromEntries(words.map(word => [word.id, word.sentenceIds])),
  topics: topics.map(topic => topic.id),
};
await writeFile(new URL('./vocabulary-manifest.json', import.meta.url), JSON.stringify(document) + '\n');
console.log(`Wrote public validation identifiers for ${words.length} cards.`);
