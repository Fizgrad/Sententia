import { expect, test, type Page } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { paraphraseGroups, sentenceMap, wordMap, words } from '../src/lib/corpus';
import { corpusStatistics, frequencyMap, sortByCorpusPriority } from '../src/lib/frequency';
import { previewSchedule } from '../src/lib/scheduler';
import type { AppData } from '../src/lib/types';

const runtimeErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '把单词，读进记忆里。' })).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(4);
});

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) || [], 'browser runtime errors').toEqual([]);
});

async function navigate(page: Page, label: '拾句台' | '回响' | '词脉' | '句匣' | '词库与词频') {
  const navigation = page.getByRole('navigation', { name: '主导航' });
  const menu = page.getByRole('button', { name: '打开导航', exact: true });
  if (await menu.isVisible() && !await page.getByRole('button', { name: '关闭导航', exact: true }).isVisible()) await menu.click();
  if (label === '词库与词频') await page.getByRole('button', { name: /^词库与词频/ }).click();
  else await navigation.getByRole('button', { name: new RegExp(`^${label}`) }).click();
}

async function openWord(page: Page, id: string, reviewing=false) {
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog', { name: '查找词汇', exact: true });
  await dialog.getByRole('textbox', { name: '查找词汇或释义', exact: true }).fill(id);
  await dialog.getByRole('button', { name: new RegExp('^'+id+'\\b') }).click();
  await expect(dialog).toBeHidden();
  if(reviewing) await expect(page.locator('.cloze-blank')).toBeVisible();
  else await expect(page.locator('.context-sentence mark')).toHaveText(new RegExp('^(?:'+[id,...wordMap[id].forms].join('|')+')$','i'));
}

async function chooseCorrectMeaning(page: Page, id: string) {
  await page.getByText(wordMap[id].definitionEN, { exact: true }).click();
  await expect(page.getByRole('radio', { name: wordMap[id].definitionEN, exact: true })).toBeChecked();
  await page.getByRole('button', { name: '确认选择', exact: true }).click();
  await expect(page.getByText('答对了，语境读懂了。', { exact: true })).toBeVisible();
}

async function continueLearning(page: Page, previousId: string) {
  await page.getByRole('button', { name: '继续拾句', exact: true }).click();
  await expect(page.locator('.context-sentence mark')).not.toHaveText(previousId);
  await expect(page.getByRole('radio')).toHaveCount(4);
}

async function addSentence(page: Page, text: string, options: { source?: string; topic?: string; enqueue?: boolean } = {}) {
  await navigate(page, '句匣');
  await page.getByRole('button', { name: '拾一句', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: /英文原句/ }).fill(text);
  if (options.source) await dialog.getByRole('textbox', { name: /阅读来源/ }).fill(options.source);
  if (options.topic) await dialog.getByRole('combobox', { name: /归入话题/ }).selectOption(options.topic);
  if (options.enqueue === false) await dialog.getByRole('checkbox', { name: /把命中的新词加入回响/ }).uncheck();
  await dialog.getByRole('button', { name: '收入句匣', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.archive-sentence')).toContainText(text);
}

async function settings(page: Page) {
  await navigate(page, '拾句台');
  const plan = page.getByRole('button', { name: '我的学习计划', exact: true });
  if (await plan.isVisible()) await plan.click();
  else {
    if (!await page.getByRole('button', { name: '关闭导航', exact: true }).isVisible()) await page.getByRole('button', { name: '打开导航', exact: true }).click();
    await page.getByRole('button', { name: /终身学习，始于一句/ }).click();
  }
  const dialog = page.getByRole('dialog', { name: '阅读偏好' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function readBackup(page: Page): Promise<AppData> {
  const dialog = await settings(page);
  await dialog.getByRole('tab', { name: '数据与备份' }).click();
  const downloading = page.waitForEvent('download');
  await dialog.getByRole('button', { name: '导出', exact: true }).click();
  const download = await downloading;
  const path = await download.path();
  expect(path).toBeTruthy();
  const data = JSON.parse(await readFile(path!, 'utf8')) as AppData;
  await dialog.getByRole('button', { name: '完成', exact: true }).click();
  await expect(dialog).toBeHidden();
  return data;
}

test('paper and study themes, responsive layout, and product screenshots', async ({ page }, info) => {
  await expect(page.locator('.context-sentence mark')).toHaveCount(1);
  await expect(page.locator('.definition-cn')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { message: 'page must fit the physical layout viewport' }).toBeLessThanOrEqual(1);
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: `artifacts/${info.project.name}-paper.png`, fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: '切换到书房模式', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.waitForTimeout(250);
  await page.screenshot({ path: `artifacts/${info.project.name}-study.png`, fullPage: true, animations: 'disabled' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: '切换到宣纸模式', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('learn confirms a meaning before revealing, switches contexts, saves, and persists its rating', async ({ page }) => {
  await openWord(page, 'mitigate');
  await page.getByRole('button', { name: '收藏此句', exact: true }).click();
  await expect(page.getByRole('button', { name: '已收入句匣', exact: true })).toBeDisabled();
  await page.locator('.context-sentence').click();
  await page.keyboard.press('Space');
  await expect(page.locator('.definition-cn')).toHaveCount(0);
  await expect(page.locator('.guess-feedback')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '确认选择', exact: true })).toBeDisabled();
  await page.getByText(wordMap.mitigate.definitionEN, { exact: true }).click();
  await expect(page.getByRole('radio', { name: wordMap.mitigate.definitionEN, exact: true })).toBeChecked();
  await expect(page.locator('.definition-cn')).toHaveCount(0);
  await expect(page.locator('.guess-feedback')).toHaveCount(0);
  await page.getByRole('button', { name: '确认选择', exact: true }).click();
  await expect(page.getByText('答对了，语境读懂了。', { exact: true })).toBeVisible();
  await expect(page.locator('.definition-cn')).toHaveText('缓解；减轻（危害、风险等）');
  await expect(page.locator('.definition-en')).toHaveText('to make something harmful, unpleasant, or bad less severe');
  await page.getByTitle('议论写作', { exact: true }).click();
  await expect(page.locator('.context-sentence')).toContainText('Governments should take practical steps');
  await page.getByTitle('听力对话', { exact: true }).click();
  await expect(page.locator('.context-sentence')).toContainText('plant more trees around the school');
  await continueLearning(page, 'mitigate');
  const nextWord = await page.locator('.context-sentence mark').textContent();
  await page.reload();
  await expect(page.locator('.context-sentence mark')).toHaveText(nextWord!);
  await navigate(page, '句匣');
  await expect(page.locator('.archive-sentence')).toContainText('Cities are investing in green infrastructure');
  await expect(page.locator('.archive-card')).toHaveCount(1);
});

test('learning undo restores the card and removes the previous rating', async ({ page }) => {
  await openWord(page, 'mitigate');
  await page.getByRole('button', { name: '暂时不会，查看解析', exact: true }).click();
  await continueLearning(page, 'mitigate');
  await openWord(page, 'foster');
  await page.getByRole('button', { name: '收藏此句', exact: true }).click();
  await expect(page.getByRole('button', { name: '已收入句匣', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: /撤销上一步/ }).click();
  await expect(page.locator('.context-sentence mark')).toHaveText('mitigate');
  await expect(page.locator('.definition-cn')).toBeVisible();
  await page.reload();
  await openWord(page, 'mitigate');
  await expect(page.locator('.context-sentence mark')).toHaveText('mitigate');
  await navigate(page, '句匣');
  await expect(page.locator('.archive-sentence')).toContainText('Schools that encourage open discussion help foster');
});

test('wrong answers and skips are judged independently and schedule short relearning', async ({ page }) => {
  await openWord(page, 'mitigate');
  const wrong = page.locator('.meaning-option').filter({ hasNotText: wordMap.mitigate.definitionEN }).first();
  const wrongId = await wrong.locator('input').getAttribute('value');
  expect(wrongId).toBeTruthy();
  await wrong.click();
  await expect(wrong.locator('input')).toBeChecked();
  await expect(page.locator('.definition-cn')).toHaveCount(0);
  await expect(page.locator('.guess-feedback')).toHaveCount(0);
  await page.getByRole('button', { name: '确认选择', exact: true }).click();
  await expect(page.getByText('这次选错了，来看看词义的分寸。', { exact: true })).toBeVisible();
  await expect(page.locator('.meaning-option.is-correct')).toContainText(wordMap.mitigate.definitionEN);
  await expect(page.locator('.meaning-option.is-incorrect')).toContainText('你的选择');
  await expect(page.locator('.definition-cn')).toHaveText(wordMap.mitigate.definitionCN);
  for (const radio of await page.getByRole('radio').all()) await expect(radio).toBeDisabled();
  await expect(page.locator('.stat-card').filter({ hasText: '今日拾句' }).locator('.stat-value')).toHaveText(/^0\s*\/\s*10\s*词$/);
  await expect(page.locator('.guess-followup-note')).toContainText('10 分钟后');
  await continueLearning(page, 'mitigate');
  await openWord(page, 'foster');
  await expect(page.getByRole('button', { name: '确认选择', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '暂时不会，查看解析', exact: true }).click();
  await expect(page.getByText('没关系，先在这句话里认识它。', { exact: true })).toBeVisible();
  await expect(page.locator('.guess-followup-note')).toContainText('10 分钟后');
  await continueLearning(page, 'foster');
  const backup = await readBackup(page);
  for (const [id, choiceId] of [['mitigate', wrongId], ['foster', null]] as const) {
    const log = backup.logs.find(item => item.wordId === id)!;
    expect(log.guess).toEqual({ choiceId, correct: false });
    expect(log.rating).toBe(1);
    expect(backup.records[id].card.reps).toBe(1);
    expect(Date.parse(backup.records[id].card.due) - Date.parse(log.at)).toBe(600_000);
  }
});

test('numeric choices and Enter confirmation persist a correctly judged Good schedule', async ({ page }) => {
  await openWord(page, 'mitigate');
  await page.getByRole('heading', { name: '把单词，读进记忆里。' }).click();
  const radios = page.getByRole('radio');
  const correctIndex = await radios.evaluateAll(inputs => inputs.findIndex(input => (input as HTMLInputElement).value === 'mitigate'));
  expect(correctIndex).toBeGreaterThanOrEqual(0);
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press(String(i + 1));
    await expect(radios.nth(i)).toBeChecked();
    await expect(page.locator('.definition-cn')).toHaveCount(0);
  }
  await radios.first().focus();
  await page.keyboard.press(String(correctIndex + 1));
  await expect(radios.nth(correctIndex)).toBeChecked();
  await page.keyboard.press('Enter');
  await expect(page.getByText('答对了，语境读懂了。', { exact: true })).toBeVisible();
  await expect(page.locator('.definition-cn')).toHaveText(wordMap.mitigate.definitionCN);
  await page.keyboard.press('Enter');
  await expect(page.locator('.context-sentence mark')).not.toHaveText('mitigate');
  const backup = await readBackup(page);
  const log = backup.logs.find(item => item.wordId === 'mitigate')!;
  expect(log.guess).toEqual({ choiceId: 'mitigate', correct: true });
  expect(log.rating).toBe(3);
  const predicted = previewSchedule(undefined, backup.preferences.retention, new Date(log.at)).find(item => item.rating === 3)!;
  expect(backup.records.mitigate.card.due).toBe(predicted.due.toISOString());
});

test('archive enqueues a personal context and review supports two hints, answer and rating', async ({ page }, info) => {
  const text = 'We should mitigate it as much as we can.';
  await addSentence(page, text, { source: 'My reading notebook', topic: 'Environment' });
  await navigate(page, '回响');
  await expect(page.getByRole('textbox', { name: '那个词，你还记得吗？' })).toBeVisible();
  await expect(page.locator('.context-sentence')).toContainText('We should');
  await expect(page.locator('.context-sentence mark')).toHaveCount(0);
  await page.getByRole('button', { name: /给我一点提示/ }).click();
  await expect(page.getByText('首字母提示', { exact: true })).toBeVisible();
  await page.getByRole('heading', { name: '让记忆，有回响。' }).click();
  await page.keyboard.press('h');
  await expect(page.locator('.hint-panel')).toContainText('to make something harmful');
  await page.getByRole('textbox', { name: '那个词，你还记得吗？' }).fill('mitigate');
  await page.getByRole('textbox', { name: '那个词，你还记得吗？' }).press('Enter');
  await expect(page.getByText('你想起来了。把这一份记忆留住。', { exact: true })).toBeVisible();
  await expect(page.locator('.rating-button')).toHaveCount(4);
  await expect(page.getByRole('button', { name: /重来.*10 分钟后/ })).toBeVisible();
  await page.screenshot({ path: `artifacts/${info.project.name}-review.png`, fullPage: true, animations: 'disabled' });
  await page.keyboard.press('4');
  await expect(page.getByRole('heading', { name: '这一轮回响，已收好。' })).toBeVisible();
  await page.getByRole('button', { name: /提前复习一个词/ }).click();
  await expect(page.locator('.context-sentence')).not.toContainText('We should');
  await navigate(page, '句匣');
  await page.getByRole('button', { name: /^移除句子：/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确认移除', exact: true }).click();
  await expect(page.locator('.archive-card')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: /让好句子，\s*有处可归。/ })).toBeVisible();
  await expect(page.locator('.storage-error')).toHaveCount(0);
});

test('archive filters, duplicate prevention, manual topics, and confirmed deletion', async ({ page }, info) => {
  const text = 'Schools foster curiosity and enhance learning through open discussion.';
  await addSentence(page, text, { source: 'Education notes', topic: 'Education', enqueue: false });
  await expect(page.locator('.archive-sentence mark')).toHaveText(['foster','enhance','learning','discussion']);
  await page.screenshot({ path: `artifacts/${info.project.name}-archive.png`, fullPage: true, animations: 'disabled' });
  await page.getByRole('textbox', { name: '搜索句匣', exact: true }).fill('missing sentence');
  await expect(page.locator('.archive-card')).toHaveCount(0);
  await page.getByRole('button', { name: '清除搜索', exact: true }).click();
  await expect(page.locator('.archive-card')).toHaveCount(1);
  await page.getByRole('button', { name: /^环境/ }).click();
  await expect(page.locator('.archive-card')).toHaveCount(0);
  await page.getByRole('button', { name: /^教育/ }).click();
  await expect(page.locator('.archive-card')).toHaveCount(1);
  await page.getByRole('button', { name: '拾一句', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: /英文原句/ }).fill(text.toUpperCase());
  await dialog.getByRole('button', { name: '收入句匣', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('这句话已经');
  await dialog.getByRole('button', { name: '再读一会儿', exact: true }).click();
  await page.getByRole('button', { name: /^移除句子：/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: '保留它', exact: true }).click();
  await expect(page.locator('.archive-card')).toHaveCount(1);
  await page.getByRole('button', { name: /^移除句子：/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确认移除', exact: true }).click();
  await expect(page.locator('.archive-card')).toHaveCount(0);
});

test('paraphrase matrix changes clusters and keeps comparison choices distinct', async ({ page }, info) => {
  await navigate(page, '词脉');
  await expect(page.getByRole('heading', { name: /词有近义，\s*用有分寸。/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'mitigate', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'alleviate', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { message: 'default matrix must fit the layout viewport' }).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `artifacts/${info.project.name}-matrix.png`, fullPage: true, animations: 'disabled' });
  await page.getByRole('combobox', { name: '选择对比词 A', exact: true }).selectOption('1');
  await expect(page.locator('.matrix-word-card').first().getByRole('heading', { level: 3 })).toHaveText('alleviate');
  await expect(page.locator('.matrix-word-card').last().getByRole('heading', { level: 3 })).toHaveText('mitigate');
  await page.getByRole('button', { name: /促进与提升/ }).click();
  await expect(page.getByRole('heading', { name: 'foster', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'enhance', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { message: 'switched matrix must fit the layout viewport' }).toBeLessThanOrEqual(1);
});

test('expanded matrix searches meanings and words, formats later groups and opens a learning card', async ({ page }) => {
  await navigate(page,'词脉');
  await expect(page.locator('.matrix-count strong')).toHaveText(String(paraphraseGroups.length));
  await expect(page.locator('.matrix-group')).toHaveCount(100);
  const search=page.getByRole('textbox',{name:'搜索词脉或单词',exact:true});
  await search.fill('  PRECISE  ');
  const accuracy=paraphraseGroups.find(group=>group.words.some(word=>word.word==='precise'))!;
  await expect(page.locator('.matrix-main')).toHaveAttribute('aria-label',accuracy.title);
  expect(await page.locator('.matrix-group').count()).toBeGreaterThan(0);
  await search.fill('准确 precise rigorous objective');
  await expect(page.locator('.matrix-group')).toHaveCount(1);
  await search.fill('zzzz-unmatched-cluster');
  await expect(page.locator('.matrix-group')).toHaveCount(0);
  await expect(page.getByText('还没有匹配的语义簇。',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'查看全部词脉',exact:true}).click();
  await expect(search).toHaveValue('');
  await expect(page.locator('.matrix-group')).toHaveCount(100);
  await page.getByRole('combobox',{name:'词脉分类',exact:true}).selectOption('concept');
  await expect(page.locator('.matrix-group')).toHaveCount(paraphraseGroups.filter(group=>group.category==='concept').length);
  await search.fill('zzzz-category-miss');
  await expect(page.locator('.matrix-group')).toHaveCount(0);
  await expect(page.locator('.matrix-main')).toBeHidden();
  await page.getByRole('button',{name:'查看全部词脉',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'词脉分类',exact:true})).toHaveValue('all');
  await search.fill('coordinate');
  const index=paraphraseGroups.findIndex(group=>group.words.some(word=>word.word==='coordinate'));
  const group=paraphraseGroups[index];
  expect(index).toBeGreaterThanOrEqual(9);
  await expect(page.locator('.matrix-section-heading .eyebrow')).toHaveText(`${String(index+1).padStart(2,'0')} / SEMANTIC CLUSTER`);
  await page.getByRole('combobox',{name:'选择对比词 A',exact:true}).selectOption(String(group.words.findIndex(word=>word.word==='coordinate')));
  await expect(page.locator('.matrix-word-card').first().getByRole('heading')).toHaveText('coordinate');
  const compared=await page.locator('.matrix-word-card h3').allTextContents();
  expect(new Set(compared).size).toBe(2);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.locator('.matrix-word-card').first().getByRole('button',{name:'在拾句台学习',exact:true}).click();
  await expect(page.getByRole('radio')).toHaveCount(4);
  await expect(page.locator('.context-sentence mark')).toHaveText(new RegExp(`^(?:coordinate|${wordMap.coordinate.forms.join('|')})$`,'i'));
});

test('matrix navigation keeps the hundredth group readable with large text on a narrow screen', async ({ page }) => {
  await page.setViewportSize({width:320,height:860});
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  await navigate(page,'词脉');
  const last=paraphraseGroups[paraphraseGroups.length-1];
  await page.getByRole('textbox',{name:'搜索词脉或单词',exact:true}).fill(last.title);
  await page.locator('.matrix-group').filter({hasText:last.title}).click();
  await expect(page.locator('.matrix-section-heading .eyebrow')).toHaveText('100 / SEMANTIC CLUSTER');
  await page.getByRole('button',{name:'清除词脉搜索',exact:true}).click();
  await expect(page.locator('.matrix-group')).toHaveCount(100);
  await expect.poll(()=>page.locator('.matrix-group-list').evaluate(list=>{
    const active=list.querySelector('.matrix-group.active');
    if(!active)return false;
    const area=list.getBoundingClientRect(),item=active.getBoundingClientRect();
    return item.left>=area.left-1&&item.right<=area.right+1&&item.top>=area.top-1&&item.bottom<=area.bottom+1;
  }),{message:'the selected group must remain fully readable inside the navigation strip'}).toBe(true);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('word library exposes the expanded corpus with inspectable frequencies, filters, and learning priority', async ({ page }, info) => {
  await navigate(page, '词库与词频');
  await expect(page.getByRole('heading', { name: /词汇的轻重，\s*有迹可循。/ })).toBeVisible();
  await expect(page.locator('.vocabulary-metrics > div').filter({ hasText: '核心学习词' }).locator('strong')).toHaveText(String(words.length));
  await expect(page.locator('.vocabulary-row')).toHaveCount(Math.min(50,words.length));
  await expect(page.locator('.frequency-scope strong')).toHaveText('这是一份官方公开样题词频，帮助决定学习先后。');
  await expect(page.locator('.frequency-scope')).toContainText('覆盖 22 个内容单元');
  await expect(page.locator('.vocabulary-metrics > div').filter({ hasText: '去重内容单元' }).locator('strong')).toHaveText(String(corpusStatistics.summary.documentCount));
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `artifacts/${info.project.name}-vocabulary.png`, animations: 'disabled' });
  await expect(page.getByRole('navigation', { name: '词库分页' })).toContainText(`共 ${words.length} 词`);
  await page.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(page.locator('.page-count')).toHaveText(`2 / ${Math.ceil(words.length/50)}`);
  await page.getByRole('combobox', { name: '词库排序', exact: true }).selectOption('alphabet');
  await expect(page.locator('.page-count')).toHaveText(`1 / ${Math.ceil(words.length/50)}`);
  await expect(page.locator('.vocabulary-row').first().getByRole('heading')).toHaveText([...words].sort((a,b)=>a.word.localeCompare(b.word))[0].word);
  await page.getByRole('combobox', { name: '词库话题', exact: true }).selectOption('Education');
  const educationWords = words.filter(word => sentenceMap[word.sentenceIds[0]].topic === 'Education');
  await expect(page.locator('.vocabulary-row')).toHaveCount(Math.min(50,educationWords.length));
  await page.getByRole('checkbox', { name: '只看本次语料中出现的词', exact: true }).check();
  await expect(page.locator('.vocabulary-row')).toHaveCount(Math.min(50,educationWords.filter(word => (frequencyMap.get(word.id)?.count ?? 0) > 0).length));
  await page.getByRole('checkbox', { name: '只看本次语料中出现的词', exact: true }).uncheck();
  await page.getByRole('combobox', { name: '词库话题', exact: true }).selectOption('all');
  await page.getByRole('textbox', { name: '搜索词库', exact: true }).fill('ubiquitous');
  await expect(page.locator('.vocabulary-row')).toHaveCount(1);
  await expect(page.locator('.vocabulary-frequency b')).toHaveText(String(frequencyMap.get('ubiquitous')!.count));
  await page.getByRole('heading', { name: '每一个数字，都有来处。', exact: true }).click();
  await expect(page.locator('.frequency-source-list a')).toHaveCount(corpusStatistics.summary.sourceCount);
  await expect(page.locator('.frequency-source-content')).toContainText('官方公开样题');
  await page.getByText('查看可复算的优先级公式', { exact: true }).click();
  await expect(page.locator('.frequency-method')).toContainText(corpusStatistics.method.priorityFormula);
  await page.locator('.vocabulary-row').getByRole('button', { name: '去学习', exact: true }).click();
  await expect(page.locator('.context-sentence mark')).toHaveText('ubiquitous');
  await expect(page.locator('.definition-cn')).toHaveCount(0);
  await page.getByRole('combobox', { name: '学习顺序', exact: true }).selectOption('original');
  await expect(page.locator('.context-sentence mark')).toHaveText('mitigate');
  await page.getByRole('combobox', { name: '学习顺序', exact: true }).selectOption('priority');
  await expect(page.locator('.context-sentence mark')).toHaveText(sortByCorpusPriority(words)[0].word);
});

test('new academic words keep three contexts, objective choices and saved progress', async ({ page }) => {
  for (const id of ['analyse','criterion','consequently']) {
    await openWord(page,id);
    await expect(page.getByRole('radio')).toHaveCount(4);
    await expect(page.locator('.definition-cn')).toHaveCount(0);
    await chooseCorrectMeaning(page,id);
    await expect(page.locator('.definition-cn')).toHaveText(wordMap[id].definitionCN);
    await page.getByTitle('议论写作',{exact:true}).click();
    await expect(page.locator('.context-sentence')).toHaveText(sentenceMap[wordMap[id].sentenceIds[1]].text);
    await page.getByTitle('听力对话',{exact:true}).click();
    await expect(page.locator('.context-sentence')).toHaveText(sentenceMap[wordMap[id].sentenceIds[2]].text);
    await continueLearning(page,id);
  }
  const backup=await readBackup(page);
  for(const id of ['analyse','criterion','consequently']) {
    expect(backup.records[id].card.reps).toBe(1);
    expect(backup.logs.find(log=>log.wordId===id)?.guess).toEqual({choiceId:id,correct:true});
  }
  await page.reload();
  await openWord(page,'criterion',true);
  await expect(page.getByRole('textbox',{name:'那个词，你还记得吗？'})).toBeVisible();
});

test('source-backed additions keep attribution, three usable contexts and scheduled recall', async ({ page }) => {
  const word=words.find(item=>item.contextOrigin==='Tatoeba')!;
  expect(word).toBeTruthy();
  await openWord(page,word.id);
  await expect(page.getByRole('radio')).toHaveCount(4);
  await chooseCorrectMeaning(page,word.id);
  const first=sentenceMap[word.sentenceIds[0]];
  await page.locator('.sentence-credit summary').click();
  await expect(page.locator('.sentence-credit')).toContainText(first.source!.author);
  await expect(page.locator('.sentence-credit a').first()).toHaveAttribute('href',first.source!.sourceUrl);
  await page.getByRole('button',{name:'收藏此句',exact:true}).click();
  for(const index of [1,2]) {
    await page.getByTitle(`语境例句 ${index+1}`,{exact:true}).click();
    await expect(page.locator('.context-sentence')).toHaveText(sentenceMap[word.sentenceIds[index]].text);
  }
  await continueLearning(page,word.id);
  const backup=await readBackup(page);
  expect(backup.records[word.id].lastSentenceId).toBe(word.sentenceIds[2]);
  expect(backup.records[word.id].card.reps).toBe(1);
  expect(backup.archive[0].sentenceId).toBe(first.id);
  await openWord(page,word.id,true);
  await expect(page.locator('.context-sentence')).not.toHaveText(sentenceMap[word.sentenceIds[2]].text);
  await navigate(page,'句匣');
  await expect(page.locator('.archive-card .sentence-credit')).toBeVisible();
});

test('preferences, backup download, invalid import, reset and restore round-trip', async ({ page }) => {
  await openWord(page, 'mitigate');
  await chooseCorrectMeaning(page, 'mitigate');
  await continueLearning(page, 'mitigate');
  let dialog = await settings(page);
  await dialog.getByRole('textbox', { name: /如何称呼你/ }).fill('阅读者');
  await dialog.getByRole('button', { name: /^5 词$/ }).click();
  await dialog.getByRole('combobox', { name: /目标记忆保留率/ }).selectOption('0.95');
  await dialog.getByRole('button', { name: '保存偏好', exact: true }).click();
  await expect(dialog).toBeHidden();
  dialog = await settings(page);
  await expect(dialog.getByRole('textbox', { name: /如何称呼你/ })).toHaveValue('阅读者');
  await dialog.getByRole('tab', { name: '数据与备份' }).click();
  const downloadEvent = page.waitForEvent('download');
  await dialog.getByRole('button', { name: '导出', exact: true }).click();
  const download = await downloadEvent;
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const backup = await readFile(downloadPath!, 'utf8');
  const parsed = JSON.parse(backup);
  expect(parsed.preferences.name).toBe('阅读者');
  expect(parsed.records.mitigate.card.reps).toBe(1);
  expect(parsed.logs.find((log: AppData['logs'][number]) => log.wordId === 'mitigate').guess).toEqual({ choiceId: 'mitigate', correct: true });
  expect(parsed.logs.find((log: AppData['logs'][number]) => log.wordId === 'mitigate').rating).toBe(3);
  await dialog.getByLabel('导入拾句备份', { exact: true }).setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"schemaVersion":2}') });
  await expect(page.locator('.toast')).toContainText('备份格式不正确');
  await expect(dialog.getByText('备份已通过检查', { exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: '清空数据', exact: true }).click();
  await expect(dialog.getByRole('button', { name: '确认清空', exact: true })).toBeDisabled();
  await dialog.getByRole('textbox', { name: '输入拾句确认清空', exact: true }).fill('拾句');
  await dialog.getByRole('button', { name: '确认清空', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('radio')).toHaveCount(4);
  await expect(page.locator('.stat-card').filter({ hasText: '词汇足迹' }).locator('.stat-value')).toHaveText(/^0\s*词已相识$/);
  dialog = await settings(page);
  await expect(dialog.getByRole('textbox', { name: /如何称呼你/ })).toHaveValue('阅读者');
  await dialog.getByRole('tab', { name: '数据与备份' }).click();
  await dialog.getByLabel('导入拾句备份', { exact: true }).setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
  await expect(dialog.getByText('备份已通过检查', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '确认恢复', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.context-sentence mark')).not.toHaveText('mitigate');
  const restoredNext = await page.locator('.context-sentence mark').textContent();
  await page.reload();
  await expect(page.locator('.context-sentence mark')).toHaveText(restoredNext!);
});

test('search supports keyboard launch and routes a vocabulary result to study', async ({ page }) => {
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog', { name: '查找词汇', exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: '查找词汇或释义', exact: true }).fill('ubiquitous');
  await dialog.getByRole('button', { name: /ubiquitous/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.context-sentence mark')).toHaveText('ubiquitous');
  await page.getByRole('button', { name: '键盘快捷键与帮助', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '把专注，留给阅读。' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('stale tabs cannot overwrite another tab’s completed learning', async ({ page, context }) => {
  await openWord(page, 'mitigate');
  const second = await context.newPage();
  await second.goto('/');
  await expect(second.getByRole('radio')).toHaveCount(4);
  await openWord(second, 'mitigate');
  await chooseCorrectMeaning(page, 'mitigate');
  await continueLearning(page, 'mitigate');
  const nextWord = await page.locator('.context-sentence mark').textContent();
  await second.getByRole('button', { name: '暂时不会，查看解析', exact: true }).click();
  await second.getByRole('button', { name: '继续拾句', exact: true }).click();
  await expect(second.getByText('另一个窗口保存了新内容。重新载入后即可继续。', { exact: true })).toBeVisible();
  await second.getByRole('button', { name: '重新载入', exact: true }).click();
  await expect(second.locator('.context-sentence mark')).toHaveText(nextWord!);
  await page.reload();
  await expect(page.locator('.context-sentence mark')).toHaveText(nextWord!);
  await second.close();
});

test('installed production shell reloads and saves learning while offline', async ({ page, context }) => {
  test.skip(process.env.SENTENTIA_OFFLINE_QA !== '1', 'Service workers are intentionally disabled during development.');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 25_000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: '把单词，读进记忆里。' })).toBeVisible();
    await openWord(page, 'mitigate');
    await chooseCorrectMeaning(page, 'mitigate');
    await continueLearning(page, 'mitigate');
    const nextWord = await page.locator('.context-sentence mark').textContent();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('.context-sentence mark')).toHaveText(nextWord!);
    await addSentence(page, 'A coherent argument connects evidence to a clear claim.', { source: 'Offline notebook', enqueue: false });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('.archive-sentence')).toContainText('A coherent argument connects evidence to a clear claim.');
  } finally {
    await context.setOffline(false);
  }
});

test('a future-day reload resets the daily goal and makes scheduled learning due', async ({ page }) => {
  await openWord(page, 'mitigate');
  await page.getByRole('button', { name: '暂时不会，查看解析', exact: true }).click();
  await continueLearning(page, 'mitigate');
  const nextWord = await page.locator('.context-sentence mark').textContent();
  await expect(page.locator('.stat-card').filter({ hasText: '今日拾句' }).locator('.stat-value')).toHaveText(/^1\s*\/\s*10\s*词$/);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await page.clock.install({ time: tomorrow });
  await page.reload();
  await expect(page.locator('.context-sentence mark')).toHaveText(nextWord!);
  await expect(page.locator('.stat-card').filter({ hasText: '今日拾句' }).locator('.stat-value')).toHaveText(/^0\s*\/\s*10\s*词$/);
  await expect(page.locator('.stat-card').filter({ hasText: '等待回响' }).locator('.stat-value')).toHaveText(/^1\s*词待复习$/);
  await navigate(page, '回响');
  await expect(page.getByRole('textbox', { name: '那个词，你还记得吗？' })).toBeVisible();
  await expect(page.locator('.context-sentence')).not.toContainText('Cities are investing in green infrastructure');
  await page.getByRole('textbox', { name: '那个词，你还记得吗？' }).fill('mitigate');
  await page.getByRole('textbox', { name: '那个词，你还记得吗？' }).press('Enter');
  await expect(page.getByText('你想起来了。把这一份记忆留住。', { exact: true })).toBeVisible();
});
