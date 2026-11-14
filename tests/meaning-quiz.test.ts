import assert from 'node:assert/strict';
import test from 'node:test';
import { wordMap, words } from '../src/lib/corpus';
import { createMeaningQuestion, judgeMeaning } from '../src/lib/meaning-quiz';
import { defaultData, validateBackup } from '../src/lib/store';
import { schedule } from '../src/lib/scheduler';

test('all learning words receive exactly four distinct choices with the correct definition', () => {
  assert.ok(words.length >= 2000);
  for (const word of words) {
    const question = createMeaningQuestion(word, words);
    assert.equal(question.wordId, word.id);
    assert.equal(question.options.length, 4, word.id);
    assert.equal(new Set(question.options.map(option => option.id)).size, 4, word.id);
    assert.equal(new Set(question.options.map(option => option.definition.toLowerCase().trim())).size, 4, word.id);
    assert.equal(question.options.filter(option => option.id === word.id).length, 1);
    assert.equal(question.options.find(option => option.id === word.id)?.definition, word.definitionEN);
    for (const option of question.options.filter(option => option.id !== word.id)) {
      if (wordMap[option.id]) assert.equal(wordMap[option.id].partOfSpeech, word.partOfSpeech, `${word.id} has wrong-POS distractor ${option.id}`);
      else assert.ok(option.id.startsWith(`fallback-${word.partOfSpeech}-`));
      assert.ok(!/[\u4e00-\u9fff]/.test(option.definition), 'choices must not reveal Chinese definitions');
    }
  }
});

test('correct positions vary across the corpus and questions remain stable during rerenders', () => {
  const counts = [0, 0, 0, 0];
  for (const word of words) {
    const first = createMeaningQuestion(word, words);
    counts[first.options.findIndex(option => option.id === word.id)] += 1;
    assert.deepEqual(createMeaningQuestion(word, words), first);
    assert.deepEqual(createMeaningQuestion(word, [...words].reverse()), first, 'corpus display order must not change a selected question');
  }
  assert.ok(counts.every(count => count >= 10), `correct positions are too concentrated: ${counts.join(',')}`);
});

test('genuine near-equivalent definitions are excluded from distractor choices', () => {
  const exclusions: Record<string, string[]> = {
    mitigate: ['alleviate', 'diminish'],
    foster: ['enhance', 'facilitate', 'contribute', 'enable'],
    significant: ['substantial', 'profound', 'crucial', 'fundamental', 'predominant'],
    acquire: ['obtain', 'derive'],
    assess: ['evaluate'],
    maintain: ['preserve', 'retain'],
    constitute: ['comprise', 'integrate'],
    allocate: ['distribute'],
    indicate: ['demonstrate', 'illustrate', 'imply'],
  };
  for (const [id, related] of Object.entries(exclusions)) {
    const question = createMeaningQuestion(wordMap[id], words);
    for (const option of question.options) assert.ok(!related.includes(option.id), `${id} offered a defensible synonym ${option.id}`);
  }
});

test('adverbs remain judgeable and a limited pool receives matching fallbacks', () => {
  const question = createMeaningQuestion(wordMap.approximately, [wordMap.approximately]);
  assert.equal(question.options.filter(option => option.id.startsWith('fallback-adv.')).length, 3);
  assert.equal(judgeMeaning(question, 'approximately'), true);
  for (const option of question.options.filter(option => option.id !== 'approximately')) {
    assert.equal(judgeMeaning(question, option.id), false);
    assert.ok(!/^to\s/.test(option.definition), 'an adverb fallback must not be a verb definition');
  }
});

test('near-synonyms remain excluded when the pool is too small to hide them by ranking', () => {
  const pairs = [
    ['assess', 'evaluate'], ['acquire', 'obtain'], ['maintain', 'retain'],
    ['demonstrate', 'illustrate'], ['comprise', 'constitute'],
    ['diminish', 'decline'], ['perceive', 'interpret'],
    ['achieve', 'attain'], ['collaborate', 'cooperate'], ['deduce', 'infer'],
    ['differentiate', 'distinguish'], ['conserve', 'preserve'], ['create', 'generate'],
    ['incorporate', 'integrate'], ['adjust', 'adapt'], ['arise', 'emerge'],
    ['adequate', 'sufficient'], ['considerable', 'substantial'], ['essential', 'crucial'],
    ['feasible', 'viable'], ['prevalent', 'ubiquitous'], ['initial', 'preliminary'],
    ['apparent', 'evident'], ['accurate', 'precise'], ['inherent', 'intrinsic'],
    ['inequality', 'disparity'], ['assumption', 'hypothesis'],
  ];
  for (const [left, right] of pairs) {
    for (const [target, synonym] of [[left, right], [right, left]]) {
      const question = createMeaningQuestion(wordMap[target], [wordMap[target], wordMap[synonym]]);
      assert.equal(question.options.length, 4);
      assert.ok(!question.options.some(option => option.id === synonym), `${target} offered equivalent definition ${synonym}`);
    }
  }
});

test('judging distinguishes the correct choice, all wrong choices, a skip and an unknown choice', () => {
  for (const word of words) {
    const question = createMeaningQuestion(word, words);
    assert.equal(judgeMeaning(question, question.correctOptionId), true);
    for (const option of question.options.filter(option => option.id !== question.correctOptionId)) assert.equal(judgeMeaning(question, option.id), false);
    assert.equal(judgeMeaning(question, null), false);
    assert.equal(judgeMeaning(question, 'not-an-option'), false);
  }
});

test('quiz metadata round trips and old backups without quiz history remain compatible', () => {
  const now = new Date('2026-11-13T10:00:00.000Z');
  for (const choiceId of ['mitigate', 'foster', null]) {
    const correct = choiceId === 'mitigate';
    const rating = correct ? 3 : 1;
    const data = defaultData();
    data.records.mitigate = schedule(undefined, 'mitigate', 'mitigate-0', rating, 0.9, now);
    data.logs = [{ id: 'quiz-log', wordId: 'mitigate', sentenceId: 'mitigate-0', mode: 'learn', rating, at: now.toISOString(), guess: { choiceId, correct } }];
    assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(data))), data);
    if (!correct) assert.equal(Date.parse(data.records.mitigate.card.due) - now.getTime(), 600_000);
    const inconsistent = structuredClone(data);
    inconsistent.logs[0].rating = correct ? 1 : 3;
    assert.throws(() => validateBackup(inconsistent));
    const invalidChoice = structuredClone(data);
    invalidChoice.logs[0].guess = { choiceId: 'unknown-word', correct: false };
    assert.throws(() => validateBackup(invalidChoice));
    const legacy = structuredClone(data);
    delete legacy.logs[0].guess;
    assert.deepEqual(validateBackup(legacy), legacy);
  }
});
