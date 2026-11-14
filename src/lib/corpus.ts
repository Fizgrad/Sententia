import type { ContextSentence, ParaphraseGroup, Topic, VocabCard } from './types';
import { extraSeeds } from './corpus-extra';
import { academicVerbSeeds } from './corpus-academic-verbs';
import { academicNounSeeds } from './corpus-academic-nouns';
import { descriptorSeeds } from './corpus-descriptors';
import { actionParaphraseGroups } from './paraphrase-action-groups';
import { qualityParaphraseGroups } from './paraphrase-quality-groups';
import { extendedActionGroups } from './paraphrase-extended-actions';
import { extendedQualityGroups } from './paraphrase-extended-qualities';
import { extendedConceptGroups } from './paraphrase-extended-concepts';
import importedLexicon from '../../data/lexicon-import.json';
import advancedLexicon from '../../data/advanced-vocabulary.json';
import vocabularyTags from '../../data/vocabulary-tags.json';
import type { LexiconEvidence } from './types';
import { createWordMatcher } from './word-matching';

export const topics: { id: Topic; label: string; short: string }[] = [
  { id: 'Environment', label: '自然与环境', short: '环境' },
  { id: 'Education', label: '教育与成长', short: '教育' },
  { id: 'Technology', label: '科技与未来', short: '科技' },
  { id: 'Society', label: '社会与生活', short: '社会' },
  { id: 'Economy', label: '经济与发展', short: '经济' },
  { id: 'Health', label: '健康与身心', short: '健康' },
  { id: 'Culture', label: '文化与传承', short: '文化' },
  { id: 'Government', label: '政府与政策', short: '政府' },
];
export const registerLabels = { Reading: '学术阅读', Writing: '议论写作', Listening: '听力对话', Example: '语境例句' };

export type Seed = [string, string, string, string, string, 6 | 7 | 8, Topic, string, [string, string, string], [string, string, string], [string, string, string], string?];
// Original learning material; these sentences are not quotations from publications.
const seeds: Seed[] = [
  ['mitigate', '/ˈmɪt.ɪ.ɡeɪt/', 'v.', 'to make something harmful, unpleasant, or bad less severe', '缓解；减轻（危害、风险等）', 7, 'Environment', 'mitigates,mitigated,mitigating',
    ['Cities are investing in green infrastructure to mitigate the adverse effects of climate change.', 'Governments should take practical steps to mitigate the risks associated with rapid urbanisation.', 'We could plant more trees around the school to mitigate the summer heat.'],
    ['各城市正在投资绿色基础设施，以减轻气候变化的不利影响。', '政府应采取切实措施，减轻快速城市化带来的风险。', '我们可以在学校周围多种一些树，来缓解夏季的炎热。'],
    ['mitigate the adverse effects', 'mitigate the risks', 'mitigate the summer heat'], 'relieve'],
  ['foster', '/ˈfɒs.tə/', 'v.', 'to encourage the development or growth of something', '促进；培养', 7, 'Education', 'fosters,fostered,fostering',
    ['Schools that encourage open discussion help foster a sense of curiosity in young learners.', 'Public libraries can foster lifelong learning by making knowledge accessible to everyone.', 'Our weekly reading group is a good way to foster friendships across different departments.'],
    ['鼓励公开讨论的学校有助于培养年轻学习者的好奇心。', '公共图书馆让每个人都能获取知识，从而促进终身学习。', '我们每周的阅读小组是增进不同部门之间友谊的好方法。'],
    ['foster a sense of curiosity', 'foster lifelong learning', 'foster friendships'], 'promote'],
  ['ubiquitous', '/juːˈbɪk.wɪ.təs/', 'adj.', 'seeming to be present or found everywhere', '无处不在的；普遍存在的', 8, 'Technology', '',
    ['Smartphones have become so ubiquitous that many everyday services now assume everyone owns one.', 'Although digital devices are ubiquitous, access to reliable information remains unequal.', 'Contactless payment is ubiquitous here, so you probably will not need much cash.'],
    ['智能手机已经如此普及，以至于许多日常服务都假设人人拥有一部。', '尽管数字设备无处不在，可靠信息的获取仍不平等。', '这里到处都能使用非接触支付，所以你大概不需要带太多现金。'],
    ['become ubiquitous', 'ubiquitous digital devices', 'ubiquitous payment'], 'widespread'],
  ['alleviate', '/əˈliː.vi.eɪt/', 'v.', 'to make pain, suffering, or a difficult situation less intense', '缓解；减轻（痛苦、贫困等）', 7, 'Health', 'alleviates,alleviated,alleviating',
    ['Regular physical activity can alleviate stress and improve the quality of sleep.', 'Investment in affordable housing could alleviate some of the pressure on low-income families.', 'The doctor suggested a few gentle stretches to alleviate the pain in my back.'],
    ['经常运动可以缓解压力并改善睡眠质量。', '投资保障性住房可以减轻低收入家庭的部分压力。', '医生建议做一些轻柔的伸展运动来缓解我的背痛。'],
    ['alleviate stress', 'alleviate the pressure', 'alleviate the pain'], 'relieve'],
  ['sustainable', '/səˈsteɪ.nə.bəl/', 'adj.', 'able to continue over time without exhausting resources or causing lasting harm', '可持续的；能长期维持的', 6, 'Environment', '',
    ['A sustainable food system must meet present needs without damaging the land future generations will depend on.', 'Cities should prioritise sustainable transport rather than build ever more roads.', 'Do you think cycling to work would be a sustainable change for you?'],
    ['可持续的粮食体系必须满足当下需求，同时不损害后代赖以生存的土地。', '城市应优先发展可持续交通，而不是不断修建更多道路。', '你觉得骑车上班会是一个你能长期坚持的改变吗？'],
    ['a sustainable food system', 'sustainable transport', 'a sustainable change']],
  ['substantial', '/səbˈstæn.ʃəl/', 'adj.', 'large enough in amount, size, or importance to be significant', '大量的；重大的', 6, 'Economy', '',
    ['The transition to clean energy will require substantial investment in both technology and skills.', 'A substantial share of public spending should be directed towards basic education.', 'There is a substantial discount if we book the train tickets a month in advance.'],
    ['向清洁能源转型需要对技术和技能进行大量投资。', '公共支出中应有相当大的部分用于基础教育。', '如果提前一个月订火车票，就能享受很大的折扣。'],
    ['substantial investment', 'a substantial share', 'a substantial discount'], 'significant'],
  ['resilient', '/rɪˈzɪl.i.ənt/', 'adj.', 'able to recover or adapt after difficulty or change', '有韧性的；适应力强的', 7, 'Society', '',
    ['Communities with strong social ties tend to be more resilient when faced with unexpected crises.', 'A resilient economy depends on a diverse range of industries rather than a single export.', 'The plants are surprisingly resilient; they survived the whole week without water.'],
    ['社会联系紧密的社区在遭遇突发危机时往往更有韧性。', '有韧性的经济依赖多种产业，而非单一出口品。', '这些植物的生命力出奇地强，整整一周没浇水还活着。'],
    ['resilient communities', 'a resilient economy', 'resilient plants']],
  ['allocate', '/ˈæl.ə.keɪt/', 'v.', 'to give a particular amount of time, money, or resources to a purpose', '分配；拨给', 7, 'Government', 'allocates,allocated,allocating',
    ['Local authorities must allocate limited resources to the services that residents need most.', 'More funding should be allocated to preventive healthcare in rural areas.', 'Can we allocate twenty minutes at the end of the meeting for questions?'],
    ['地方政府必须把有限资源分配给居民最需要的服务。', '应向农村地区的预防性医疗拨付更多资金。', '我们能在会议结束前留出二十分钟提问吗？'],
    ['allocate limited resources', 'allocate funding', 'allocate time']],
  ['preserve', '/prɪˈzɜːv/', 'v.', 'to keep something safe from damage, loss, or unwanted change', '保护；保存；保留', 6, 'Culture', 'preserves,preserved,preserving',
    ['Digital archives offer new ways to preserve languages that are no longer widely spoken.', 'Economic development should not come at the expense of efforts to preserve cultural heritage.', 'We are trying to preserve the original wooden floor when we renovate the house.'],
    ['数字档案为保存已不再广泛使用的语言提供了新方法。', '经济发展不应以牺牲文化遗产保护为代价。', '装修房子时，我们正尽量保留原来的木地板。'],
    ['preserve languages', 'preserve cultural heritage', 'preserve the original floor']],
  ['enhance', '/ɪnˈhɑːns/', 'v.', 'to improve the quality, value, or effectiveness of something', '提高；增强；改善', 6, 'Technology', 'enhances,enhanced,enhancing',
    ['Carefully designed technology can enhance learning without replacing the role of a teacher.', 'Access to green spaces can enhance the quality of life in densely populated cities.', 'Adding a little lemon juice will enhance the flavour of the soup.'],
    ['精心设计的技术可以提升学习效果，而不取代教师的作用。', '获得绿色空间能改善人口密集城市的生活质量。', '加一点柠檬汁会让汤的味道更好。'],
    ['enhance learning', 'enhance the quality of life', 'enhance the flavour'], 'promote'],
  ['inevitable', '/ɪˈnev.ɪ.tə.bəl/', 'adj.', 'certain to happen and impossible to avoid', '不可避免的；必然发生的', 7, 'Society', '',
    ['Some degree of change is inevitable as cities grow and the needs of their residents evolve.', 'Job losses are not an inevitable consequence of technological progress if workers receive adequate support.', 'A few delays are inevitable when the station is this busy.'],
    ['随着城市发展、居民需求演变，某种程度的变化不可避免。', '如果劳动者得到充分支持，技术进步并不必然导致失业。', '车站这么忙，有些延误是难免的。'],
    ['inevitable change', 'an inevitable consequence', 'inevitable delays']],
  ['diminish', '/dɪˈmɪn.ɪʃ/', 'v.', 'to become smaller or less important, or to make something do so', '减少；削弱；降低', 7, 'Environment', 'diminishes,diminished,diminishing',
    ['As natural habitats diminish, many species find it increasingly difficult to survive.', 'The convenience of private cars does not diminish the need for reliable public transport.', 'My interest in the course began to diminish when all the lessons became repetitive.'],
    ['随着自然栖息地减少，许多物种发现生存越来越困难。', '私家车的便利并不会削弱人们对可靠公共交通的需求。', '当所有课程都变得重复时，我对它的兴趣开始减退。'],
    ['habitats diminish', 'diminish the need', 'interest begins to diminish'], 'reduce'],
  ['facilitate', '/fəˈsɪl.ɪ.teɪt/', 'v.', 'to make an action or process easier or more likely to happen', '促进；使便利', 7, 'Education', 'facilitates,facilitated,facilitating',
    ['Small group activities can facilitate meaningful discussion among students with different perspectives.', 'Clear regulations can facilitate innovation by reducing uncertainty for new businesses.', 'The new online form should facilitate the registration process.'],
    ['小组活动可以促进观点不同的学生进行有意义的讨论。', '明确的法规可以减少新企业面临的不确定性，从而促进创新。', '新的在线表格应该能让注册流程更方便。'],
    ['facilitate meaningful discussion', 'facilitate innovation', 'facilitate the registration process'], 'promote'],
  ['disparity', '/dɪˈspær.ə.ti/', 'n.', 'a noticeable and often unfair difference between groups or things', '差距；悬殊', 8, 'Society', 'disparities',
    ['The disparity in access to healthcare is particularly visible between urban and rural communities.', 'Closing the income disparity requires long-term investment in education and skills.', 'There is quite a disparity between the two estimates we received.'],
    ['城乡社区之间在医疗获取上的差距尤为明显。', '缩小收入差距需要对教育和技能进行长期投资。', '我们收到的两个报价之间差距相当大。'],
    ['disparity in access', 'income disparity', 'a disparity between estimates']],
  ['scarce', '/skeəs/', 'adj.', 'available only in small amounts and not enough to meet demand', '稀缺的；不足的', 7, 'Environment', '',
    ['Clean drinking water is becoming scarce in regions affected by prolonged drought.', 'Governments need to use scarce public resources as efficiently as possible.', 'Parking spaces are scarce near the library, so I would take the bus.'],
    ['在长期干旱的地区，清洁饮用水正变得稀缺。', '政府需要尽可能高效地利用稀缺的公共资源。', '图书馆附近停车位很少，所以我会坐公交车去。'],
    ['scarce drinking water', 'scarce public resources', 'scarce parking spaces']],
  ['undergo', '/ˌʌn.dəˈɡəʊ/', 'v.', 'to experience a process, change, or treatment', '经历；经受', 7, 'Technology', 'undergoes,underwent,undergone,undergoing',
    ['The way people work has begun to undergo a profound transformation as digital tools improve.', 'All new medical treatments must undergo rigorous testing before they become widely available.', 'The old station will undergo major repairs over the summer.'],
    ['随着数字工具进步，人们的工作方式已开始经历深刻变革。', '所有新的医疗方法在广泛应用前都必须经过严格测试。', '旧车站将在夏季进行大修。'],
    ['undergo a transformation', 'undergo rigorous testing', 'undergo major repairs']],
  ['empirical', '/ɪmˈpɪr.ɪ.kəl/', 'adj.', 'based on observation or experience rather than theory alone', '以观察或实验为依据的；实证的', 8, 'Education', '',
    ['The researchers collected empirical evidence to test whether smaller classes improved learning outcomes.', 'Education policy should be informed by empirical research rather than assumptions alone.', 'Have you found any empirical data to support the main argument in your essay?'],
    ['研究人员收集了实证证据，以检验小班教学是否改善学习成果。', '教育政策应以实证研究为依据，而不能只凭假设。', '你找到实证数据来支持论文的主要论点了吗？'],
    ['empirical evidence', 'empirical research', 'empirical data']],
  ['incentive', '/ɪnˈsen.tɪv/', 'n.', 'something that encourages a person or organisation to take action', '激励；刺激；奖励', 7, 'Government', 'incentives',
    ['Financial incentives can encourage households to install energy-efficient heating systems.', 'Tax incentives may help small businesses invest in cleaner production methods.', 'The company offers a travel allowance as an incentive to cycle to work.'],
    ['经济激励可以鼓励家庭安装节能供暖系统。', '税收优惠可能帮助小企业投资更清洁的生产方式。', '公司提供交通补助，鼓励员工骑车上班。'],
    ['financial incentives', 'tax incentives', 'an incentive to cycle']],
  ['profound', '/prəˈfaʊnd/', 'adj.', 'very great, deep, or strongly felt', '深刻的；深远的', 7, 'Culture', '',
    ['Migration has had a profound influence on the language and food of many modern cities.', 'Access to education can have a profound impact on a person’s future opportunities.', 'Visiting the museum gave me a profound respect for the skill of those early builders.'],
    ['移民对许多现代城市的语言和饮食产生了深远影响。', '接受教育可以对一个人未来的机会产生深远影响。', '参观博物馆让我对早期建造者的技艺产生了深深的敬意。'],
    ['a profound influence', 'a profound impact', 'a profound respect'], 'significant'],
  ['vulnerable', '/ˈvʌl.nər.ə.bəl/', 'adj.', 'easily harmed or affected because of limited protection', '脆弱的；易受伤害的', 7, 'Health', '',
    ['Older adults are particularly vulnerable to the health effects of extreme heat.', 'Public policy should provide a safety net for the most vulnerable members of society.', 'The young trees are still vulnerable to strong winds, so we need to support them.'],
    ['老年人尤其容易受到极端高温对健康的影响。', '公共政策应为社会中最脆弱的群体提供安全网。', '这些小树仍容易受到强风损害，所以我们需要支撑它们。'],
    ['vulnerable to heat', 'vulnerable members of society', 'vulnerable to strong winds']],
  ['detrimental', '/ˌdet.rɪˈmen.təl/', 'adj.', 'causing harm or damage', '有害的；不利的', 8, 'Health', '',
    ['Long periods of inactivity can be detrimental to both physical and mental health.', 'Excessive screen time may have a detrimental effect on children’s sleep patterns.', 'Would working late every night be detrimental to your recovery?'],
    ['长期缺乏活动会损害身心健康。', '过多的屏幕时间可能对儿童睡眠规律产生不利影响。', '每晚工作到很晚会不会对你的康复有害？'],
    ['detrimental to health', 'a detrimental effect', 'detrimental to recovery']],
  ['viable', '/ˈvaɪ.ə.bəl/', 'adj.', 'able to work successfully in practice', '可行的；能成功的', 7, 'Economy', '',
    ['For many rural communities, small-scale solar power is now a viable alternative to diesel generators.', 'A policy is only viable if its long-term costs can be met without cutting essential services.', 'Taking the overnight train might be a viable option if the flights are too expensive.'],
    ['对许多农村社区而言，小型太阳能发电如今是柴油发电机的可行替代方案。', '只有在不削减基本服务的情况下负担长期成本，政策才可行。', '如果机票太贵，乘坐夜班火车或许是可行的选择。'],
    ['a viable alternative', 'a viable policy', 'a viable option']],
  ['diverse', '/daɪˈvɜːs/', 'adj.', 'including many different kinds of people or things', '多样的；不同的', 6, 'Culture', '',
    ['A diverse workforce brings a wider range of experiences to the process of solving problems.', 'Schools should introduce students to diverse cultural perspectives through literature.', 'The market has a diverse selection of food from all over the world.'],
    ['多元化的员工队伍在解决问题时能带来更广泛的经验。', '学校应通过文学让学生接触不同的文化视角。', '市场有来自世界各地的多样食物可供选择。'],
    ['a diverse workforce', 'diverse cultural perspectives', 'a diverse selection']],
  ['advocate', '/ˈæd.və.keɪt/', 'v.', 'to publicly support or recommend an idea or course of action', '提倡；主张；拥护', 7, 'Government', 'advocates,advocated,advocating',
    ['Urban planners increasingly advocate compact neighbourhoods where daily needs can be reached on foot.', 'Some educators advocate replacing high-stakes exams with continuous assessment.', 'I would advocate starting with a smaller project before we commit the whole budget.'],
    ['城市规划者越来越提倡紧凑型社区，让人们步行即可满足日常需求。', '一些教育者主张用持续评估取代高风险考试。', '我主张在投入全部预算前先从一个较小的项目开始。'],
    ['advocate compact neighbourhoods', 'advocate replacing exams', 'advocate starting small']],
  ['conventional', '/kənˈven.ʃən.əl/', 'adj.', 'following traditional or widely accepted methods or beliefs', '传统的；常规的', 7, 'Technology', '',
    ['Electric vehicles generally require less routine maintenance than conventional petrol cars.', 'Online education can reach learners who have limited access to conventional classrooms.', 'The new cooker uses less electricity than a conventional oven.'],
    ['电动汽车通常比传统燃油汽车需要更少的日常维护。', '在线教育可以覆盖难以进入传统课堂的学习者。', '新炊具比传统烤箱耗电更少。'],
    ['conventional petrol cars', 'conventional classrooms', 'a conventional oven']],
  ['coherent', '/kəʊˈhɪə.rənt/', 'adj.', 'clear, logical, and with parts that fit together well', '连贯的；条理清晰的', 7, 'Education', '',
    ['A coherent argument connects each piece of evidence to a clearly stated central claim.', 'Governments need a coherent strategy that links housing, transport, and employment policies.', 'Your ideas are strong, but try to arrange them in a more coherent order.'],
    ['连贯的论证会将每一条证据与明确陈述的中心观点联系起来。', '政府需要一项将住房、交通和就业政策联系起来的连贯战略。', '你的想法很好，但试着把它们安排得更有条理。'],
    ['a coherent argument', 'a coherent strategy', 'a coherent order']],
  ['exacerbate', '/ɪɡˈzæs.ə.beɪt/', 'v.', 'to make an existing problem or bad situation worse', '使恶化；加剧', 8, 'Environment', 'exacerbates,exacerbated,exacerbating',
    ['The loss of tree cover can exacerbate flooding by reducing the soil’s ability to absorb rain.', 'Poorly planned housing developments may exacerbate existing social inequalities.', 'Skipping meals can exacerbate the headaches, according to my doctor.'],
    ['树木覆盖的减少会降低土壤吸收雨水的能力，从而加剧洪水。', '规划不当的住房开发可能加剧现有的社会不平等。', '我的医生说，不按时吃饭会加重头痛。'],
    ['exacerbate flooding', 'exacerbate social inequalities', 'exacerbate headaches']],
  ['retain', '/rɪˈteɪn/', 'v.', 'to keep or continue to have something', '保留；保持；记住', 6, 'Education', 'retains,retained,retaining',
    ['Learners tend to retain new vocabulary more effectively when they use it in meaningful contexts.', 'Cities can modernise while continuing to retain their distinctive cultural character.', 'Please retain your receipt in case you need to return the headphones.'],
    ['学习者在有意义的语境中使用新词时，往往能更有效地记住它们。', '城市可以在现代化的同时保持其独特的文化特征。', '请保留收据，以便需要时退还耳机。'],
    ['retain new vocabulary', 'retain cultural character', 'retain your receipt']],
  ['constraint', '/kənˈstreɪnt/', 'n.', 'a limit or restriction that controls what can be done', '限制；约束', 7, 'Economy', 'constraints',
    ['Budget constraints often force small organisations to find creative solutions to practical problems.', 'Time constraints should not be used as a reason to ignore environmental assessments.', 'Our main constraint is the size of the room, so we cannot invite more than thirty people.'],
    ['预算限制经常迫使小型机构创造性地解决实际问题。', '时间限制不应成为忽视环境评估的理由。', '我们的主要限制是房间大小，所以不能邀请超过三十人。'],
    ['budget constraints', 'time constraints', 'the main constraint']],
  ['predominant', '/prɪˈdɒm.ɪ.nənt/', 'adj.', 'more common, powerful, or important than others', '占主导地位的；主要的', 8, 'Economy', '',
    ['Tourism has become the predominant source of income for many coastal communities.', 'Private cars remain the predominant form of transport in areas with limited public services.', 'Blue is the predominant colour in the artist’s early paintings.'],
    ['旅游业已成为许多沿海社区的主要收入来源。', '在公共服务有限的地区，私家车仍是主要交通方式。', '蓝色是这位艺术家早期画作的主色调。'],
    ['the predominant source of income', 'the predominant form of transport', 'the predominant colour']],
];

export const words: VocabCard[] = [];
export const sentences: ContextSentence[] = [];
for (const [word, phoneticUK, partOfSpeech, definitionEN, definitionCN, ieltsBand, topic, forms, texts, translations, collocations, group] of [...seeds, ...extraSeeds, ...academicVerbSeeds, ...academicNounSeeds, ...descriptorSeeds]) {
  const sentenceIds = texts.map((_, i) => `${word}-${i}`);
  words.push({ id: word, word, forms: forms ? forms.split(',') : [], phoneticUK, partOfSpeech, definitionEN, definitionCN, ieltsBand, sentenceIds, paraphraseGroupId: group });
  texts.forEach((text, i) => {
    const variants = [word, ...(forms ? forms.split(',') : [])].sort((a, b) => b.length - a.length);
    const match = new RegExp(`\\b(${variants.join('|')})\\b`, 'i').exec(text);
    if (!match) throw new Error(`Missing target in ${word}-${i}`);
    sentences.push({ id: sentenceIds[i], wordId: word, topic, register: (['Reading', 'Writing', 'Listening'] as const)[i], text, translation: translations[i], targetSpan: [match.index, match.index + match[0].length], collocation: collocations[i] });
  });
}

export const curatedWords = [...words];
const sourcePack=importedLexicon as unknown as { words:VocabCard[];sentences:ContextSentence[];curatedEvidence:Record<string,LexiconEvidence> };
for(const word of words)if(sourcePack.curatedEvidence[word.id])word.lexiconSource=sourcePack.curatedEvidence[word.id];
const knownWordIds=new Set(words.map(word=>word.id));
for(const word of sourcePack.words){if(knownWordIds.has(word.id))throw new Error(`Duplicate learning word ${word.id}`);knownWordIds.add(word.id);words.push(word);}
const knownSentenceIds=new Set(sentences.map(sentence=>sentence.id));
for(const sentence of sourcePack.sentences){if(!knownWordIds.has(sentence.wordId)||knownSentenceIds.has(sentence.id))throw new Error(`Invalid source sentence ${sentence.id}`);knownSentenceIds.add(sentence.id);sentences.push(sentence);}

const advancedPack = advancedLexicon as unknown as { words: VocabCard[]; sentences: ContextSentence[] };
for (const word of advancedPack.words) {
  if (knownWordIds.has(word.id)) throw new Error(`Duplicate advanced word ${word.id}`);
  knownWordIds.add(word.id);
  words.push(word);
}
for (const sentence of advancedPack.sentences) {
  if (!knownWordIds.has(sentence.wordId) || knownSentenceIds.has(sentence.id)) throw new Error(`Invalid advanced sentence ${sentence.id}`);
  knownSentenceIds.add(sentence.id);
  sentences.push(sentence);
}
const tagsByWord = vocabularyTags as Record<string, string[]>;
for (const word of words) if (word.lexiconSource && tagsByWord[word.id]) word.lexiconSource.examTags = tagsByWord[word.id];

export const wordMap = Object.fromEntries(words.map(w => [w.id, w]));
export const sentenceMap = Object.fromEntries(sentences.map(s => [s.id, s]));

export const paraphraseGroups: ParaphraseGroup[] = [
  { id: 'relieve', title: '缓解与减轻', subtitle: 'When things get a little lighter.', words: [
    { word: 'mitigate', meaning: '减轻危害与风险', collocations: ['risks', 'adverse effects', 'climate change'], example: 'Planting trees can mitigate the effects of urban heat.', note: '常用于正式、学术语境，强调降低负面影响的严重程度。' },
    { word: 'alleviate', meaning: '缓解痛苦与困境', collocations: ['pain', 'poverty', 'stress'], example: 'Access to affordable housing can alleviate financial stress.', note: '侧重人的痛苦、压力或不良处境，让负担变轻。' },
    { word: 'ameliorate', meaning: '改善不良的状况', collocations: ['conditions', 'a situation', 'social problems'], example: 'The programme aims to ameliorate living conditions in the area.', note: '较正式，强调通过行动使不好的状态有所改善。' },
    { word: 'ease', meaning: '使不适或困难缓和', collocations: ['tension', 'congestion', 'restrictions'], example: 'More frequent trains would ease congestion during rush hour.', note: '适用范围广，可用于日常交流，语气更自然。' },
  ], tip: '写作时先看搭配对象：风险和危害常用 mitigate；疼痛、贫困和压力常用 alleviate。' },
  { id: 'promote', title: '促进与提升', subtitle: 'Small changes. Meaningful progress.', words: [
    { word: 'foster', meaning: '培养长期发展', collocations: ['creativity', 'cooperation', 'a sense of belonging'], example: 'Shared public spaces can foster a sense of belonging.', note: '像培育植物一样，强调为成长提供适宜条件。' },
    { word: 'enhance', meaning: '提升已有的品质', collocations: ['quality', 'performance', 'understanding'], example: 'Regular feedback can enhance students’ understanding of difficult scientific concepts.', note: '已有的事物变得更好，常搭配品质、价值与能力。' },
    { word: 'facilitate', meaning: '让过程更顺畅', collocations: ['communication', 'access', 'learning'], example: 'A shared digital platform can facilitate communication between teachers and families.', note: '强调移除障碍、提供便利，使某件事更容易发生。' },
    { word: 'promote', meaning: '推动或提倡', collocations: ['growth', 'awareness', 'healthy habits'], example: 'Schools can promote healthy habits through daily routines.', note: '使用广泛，既可指推动发展，也可指公开倡导。' },
  ], tip: 'foster 关注培育，enhance 关注品质，facilitate 关注过程，promote 关注推动。' },
  { id: 'significant', title: '重要与显著', subtitle: 'Finding the weight of a word.', words: [
    { word: 'substantial', meaning: '数量或程度很大', collocations: ['investment', 'evidence', 'a proportion'], example: 'The new transport project requires substantial investment in staff training.', note: '常强调数量、规模或价值上可观。' },
    { word: 'profound', meaning: '影响深刻而长远', collocations: ['impact', 'change', 'understanding'], example: 'The internet has had a profound impact on communication.', note: '常用于深层次影响、感情、变化或理解。' },
    { word: 'significant', meaning: '值得注意或有意义', collocations: ['difference', 'progress', 'a factor'], example: 'The study found a significant difference between the groups.', note: '可指重要、明显；在研究中也可能特指统计显著。' },
    { word: 'considerable', meaning: '相当多或相当大', collocations: ['effort', 'time', 'experience'], example: 'Learning a new language requires considerable effort and regular practice.', note: '常用于不可数名词，强调程度或数量不可忽视。' },
  ], tip: 'substantial investment 强调投资规模；profound impact 强调影响深度，不能随意互换。' },
  { id: 'reduce', title: '减少与削弱', subtitle: 'Less, with more precision.', words: [
    { word: 'diminish', meaning: '逐渐减少或削弱', collocations: ['importance', 'resources', 'confidence'], example: 'Trust can diminish when public promises are repeatedly broken.', note: '可以不及物，常表示逐渐变小或变得不重要。' },
    { word: 'reduce', meaning: '使数量或程度降低', collocations: ['costs', 'emissions', 'waste'], example: 'Better insulation can reduce the energy needed to heat homes.', note: '最通用的及物表达，可以使用 reduce by / reduce to。' },
    { word: 'curb', meaning: '控制不良事物的增长', collocations: ['pollution', 'spending', 'inflation'], example: 'The new measures aim to curb excessive energy use.', note: '侧重限制、抑制，搭配需要控制的负面趋势。' },
    { word: 'deplete', meaning: '大量消耗使接近耗尽', collocations: ['resources', 'reserves', 'energy'], example: 'Overfishing can rapidly deplete fish stocks in coastal waters.', note: '程度较重，常用于资源、库存或能量。' },
  ], tip: '一般的减少用 reduce；抑制不良增长用 curb；资源接近耗尽则用 deplete。' },
  { id: 'widespread', title: '普遍与广泛', subtitle: 'How far does an idea reach?', words: [
    { word: 'ubiquitous', meaning: '几乎无处不在', collocations: ['smartphones', 'advertising', 'digital devices'], example: 'Wireless internet is now ubiquitous in many city centres.', note: '强调到处都能见到，比 widespread 的程度更强。' },
    { word: 'widespread', meaning: '分布广泛的', collocations: ['support', 'concern', 'use'], example: 'The proposal received widespread support from residents across the city.', note: '强调范围广、涉及人数多，并非每个地方都有。' },
    { word: 'prevalent', meaning: '在特定群体或时期盛行', collocations: ['a belief', 'a disease', 'an attitude'], example: 'This belief was prevalent among earlier generations in many rural communities.', note: '常用于现象、疾病、观点在某一范围内常见。' },
    { word: 'common', meaning: '常见或共有的', collocations: ['practice', 'a problem', 'knowledge'], example: 'It is common practice to compare several sources.', note: '中性且日常，适合听力与口语表达。' },
  ], tip: 'ubiquitous 表示近乎无处不在；prevalent 通常需要给出时间、地区或人群范围。' },
];

for (const group of paraphraseGroups) group.category = ['relieve', 'promote', 'reduce'].includes(group.id) ? 'action' : 'quality';
paraphraseGroups.push(
  ...actionParaphraseGroups.map(group => ({ ...group, category: 'action' as const })),
  ...qualityParaphraseGroups.map(group => ({ ...group, category: group.words.every(item => wordMap[item.word]?.partOfSpeech === 'n.') ? 'concept' as const : 'quality' as const })),
  ...extendedActionGroups.map(group => ({ ...group, category: 'action' as const })),
  ...extendedQualityGroups.map(group => ({ ...group, category: 'quality' as const })),
  ...extendedConceptGroups.map(group => ({ ...group, category: 'concept' as const })),
);

export const findWordMatches = createWordMatcher(words);
export function detectWords(text: string): string[] {
  const found = new Set(findWordMatches(text).map(match => match.wordId));
  return words.filter(word => found.has(word.id)).map(word => word.id);
}

const topicKeywords: Record<Topic, RegExp> = {
  Environment: /\b(?:climat\w*|environment\w*|pollution|carbon|sustainab\w*|energy|green|trees?|water|species|flood\w*)\b|环境|气候/i,
  Education: /\b(?:school\w*|student\w*|learn\w*|education\w*|teacher\w*|classroom\w*|universit\w*)\b|学习|教育/i,
  Technology: /\b(?:digital|technolog\w*|internet|smartphone\w*|artificial|software|online)\b|科技|人工智能/i,
  Society: /\b(?:communit\w*|societ\w*|social\w*|housing|urban\w*|famil\w*|inequal\w*)\b|城市|社会/i,
  Economy: /\b(?:econom\w*|invest\w*|financial\w*|business\w*|income\w*|market\w*|budget\w*)\b|经济|投资/i,
  Health: /\b(?:health\w*|pains?|doctor\w*|medical\w*|sleep\w*|stress\w*|exercis\w*)\b|健康|医疗/i,
  Culture: /\b(?:cultur\w*|heritage|museum\w*|arts?|artists?|artistic|language\w*|tradition\w*)\b|文化|遗产/i,
  Government: /\b(?:government\w*|polic\w*|authorit\w*|regulat\w*|public spending)\b|政府|政策/i,
};
export function detectTopic(text: string): Topic {
  const scores = topics.map(t => ({ id: t.id, score: (text.match(new RegExp(topicKeywords[t.id].source, 'gi')) || []).length }));
  return scores.sort((a, b) => b.score - a.score)[0]?.score ? scores[0].id : 'Society';
}

export function getReviewSentence(word: VocabCard, lastId?: string, seen: string[] = [], archive: ArchiveEntryLike[] = []): ContextSentence {
  const personal = archive.filter(a => a.wordIds.includes(word.id)).flatMap(a => {
    const match = findWordMatches(a.text, [word.id])[0];
    const original=a.sentenceId?sentenceMap[a.sentenceId]:undefined;
    return match ? [{ id: `archive-${a.id}-${word.id}`, wordId: word.id, topic: a.topic, register: original?.source?'Example' as const:'Reading' as const, text: a.text, translation: original?.text===a.text?original.translation:'', targetSpan: [match.start, match.end] as [number, number], collocation: '', ...(original?.text===a.text&&original.source?{source:original.source}:{}) }] : [];
  });
  const originals = word.sentenceIds.map(id => sentenceMap[id]);
  const normalise = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim();
  const all = [...personal, ...originals];
  const last = all.find(sentence => sentence.id === lastId);
  const seenIds = new Set(seen);
  const seenTexts = new Set(all.filter(sentence => seenIds.has(sentence.id)).map(sentence => normalise(sentence.text)));
  const originalTexts = new Set(originals.map(sentence => normalise(sentence.text)));
  const unique = new Map<string, ContextSentence>();
  for (const sentence of [...personal.filter(sentence => !originalTexts.has(normalise(sentence.text))), ...originals]) {
    const text = normalise(sentence.text);
    if (!unique.has(text)) unique.set(text, sentence);
  }
  const pool = [...unique.values()];
  const available = pool.filter(sentence => sentence.id !== lastId && (!last || normalise(sentence.text) !== normalise(last.text)));
  return available.find(sentence => !seenTexts.has(normalise(sentence.text))) ?? available[seen.length % available.length] ?? pool[0];
}
interface ArchiveEntryLike { id: string; text: string; topic: Topic; wordIds: string[]; sentenceId?: string }
