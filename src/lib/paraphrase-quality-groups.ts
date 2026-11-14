import type { ParaphraseGroup } from './types';

// Original learning material. Related words share a comparison theme, not an
// unrestricted right to replace one another in a sentence.
export const qualityParaphraseGroups: ParaphraseGroup[] = [
  {
    id: 'necessity', title: '必要与关键', subtitle: 'What matters, and why it matters.',
    words: [
      { word: 'essential', meaning: '不可缺少；必需的', collocations: ['essential services', 'essential skills', 'essential for survival'], example: 'Reliable public transport is essential for workers who cannot afford a car.', note: '强调缺了便难以正常运作；常用 essential for + 名词，或 essential to + 名词。' },
      { word: 'crucial', meaning: '对成败起关键作用的', collocations: ['a crucial factor', 'a crucial role', 'a crucial stage'], example: 'Teacher feedback plays a crucial role in helping students improve their writing.', note: '强调某因素、时刻或决定对结果有重大影响，常用 play a crucial role in。' },
      { word: 'fundamental', meaning: '作为根基；基础性的', collocations: ['fundamental principles', 'a fundamental change', 'fundamental to understanding'], example: 'An understanding of basic science is fundamental to informed debate about energy.', note: '指基本原则或根本层面，也可形容彻底的改变；不只是“很重要”的加强版。' },
      { word: 'vital', meaning: '对生存或成功至关重要的', collocations: ['vital information', 'a vital resource', 'vital to the economy'], example: 'Clean water is a vital resource for both households and local farms.', note: '常与生命、安全、必要资源及关键作用相连；也可用于重要的信息和经济活动。' },
    ],
    tip: '先判断你强调的是“不可缺少”“决定成败”还是“作为根基”：essential、crucial、fundamental 的侧重点不同，避免一律替换 important。',
  },
  {
    id: 'feasibility', title: '可能与可行', subtitle: 'An idea can sound right before it can work.',
    words: [
      { word: 'feasible', meaning: '在现有条件下能够实施的', collocations: ['a feasible solution', 'technically feasible', 'economically feasible'], example: 'The council will assess whether a new cycle bridge is technically feasible.', note: '看技术、资金、时间等条件是否允许实施；feasible 不等于值得做或一定会成功。' },
      { word: 'viable', meaning: '能够持续运作或取得成功的', collocations: ['a viable alternative', 'commercially viable', 'a viable business'], example: 'Shared transport can be a viable alternative where regular bus services are limited.', note: '更关注方案能否有效运转、持续存在；commercially viable 尤其关注商业上能否成立。' },
      { word: 'practical', meaning: '在实际使用中有用或适用的', collocations: ['practical advice', 'a practical solution', 'practical experience'], example: 'Students need practical experience as well as knowledge gained from textbooks.', note: '常与理论相对，也可表示解决办法切实有用；practical experience 不能换成 feasible experience。' },
      { word: 'plausible', meaning: '听起来合理、似乎可信的', collocations: ['a plausible explanation', 'a plausible argument', 'a plausible scenario'], example: 'The researchers offered a plausible explanation for the difference between the two groups.', note: '判断解释或说法是否可信，不判断项目能否实施；plausible 也不表示已经证实。' },
    ],
    tip: 'feasible 看“做不做得到”，viable 看“能否运转下去”，practical 看“实际是否有用”；plausible 只说明解释似乎可信。',
  },
  {
    id: 'sufficiency', title: '充分与可观', subtitle: 'Enough for a purpose, or simply a large amount?',
    words: [
      { word: 'adequate', meaning: '达到所需最低标准的', collocations: ['adequate funding', 'adequate protection', 'adequate for the task'], example: 'Every school needs adequate funding to maintain safe classrooms and basic equipment.', note: '表示足够应付某项需要，未必优异或充裕；评价 adequate 时常含“基本合格”的意味。' },
      { word: 'sufficient', meaning: '数量或程度足以满足需要的', collocations: ['sufficient evidence', 'sufficient time', 'sufficient to meet demand'], example: 'The team needs sufficient evidence before it can support the proposed explanation.', note: '重在达到某个目的所需的量或程度；常用 sufficient for 或 sufficient to do。' },
      { word: 'substantial', meaning: '数量、规模或程度可观的', collocations: ['substantial investment', 'a substantial increase', 'substantial evidence'], example: 'The project requires substantial investment in staff training and modern equipment.', note: '说明量大或程度显著，并不保证已满足需求；substantial funding 仍可能 insufficient。' },
      { word: 'considerable', meaning: '相当多；不可忽视的', collocations: ['considerable effort', 'considerable experience', 'a considerable amount'], example: 'Restoring the old library will require considerable effort from the local community.', note: '常修饰时间、努力、经验等，强调数量或程度相当大，不表达“刚好够用”的门槛。' },
    ],
    tip: 'adequate / sufficient 回答“够不够”；substantial / considerable 回答“多不多”。数量可观并不必然足够，不宜直接互换。',
  },
  {
    id: 'accuracy-rigour', title: '准确与严谨', subtitle: 'Truth, detail, method, and viewpoint.',
    words: [
      { word: 'accurate', meaning: '符合事实或实际数值的', collocations: ['accurate information', 'an accurate description', 'accurate measurements'], example: 'Accurate information helps passengers choose the safest route during severe weather.', note: '强调结果与事实相符、没有重要错误；描述、信息、预测和测量都可搭配。' },
      { word: 'precise', meaning: '细节明确；量值精细的', collocations: ['precise instructions', 'a precise definition', 'precise measurements'], example: 'The report gives a precise definition of the services included in the study.', note: '强调界定具体或精细程度高；测量值彼此很接近仍可能有系统偏差，因此 precise 未必 accurate。' },
      { word: 'rigorous', meaning: '过程严密；标准严格的', collocations: ['rigorous testing', 'rigorous analysis', 'a rigorous method'], example: 'New materials undergo rigorous testing before they are used in public buildings.', note: '评价方法、检验或论证是否周密严格；不直接表示某一个数字准确到多少位。' },
      { word: 'objective', meaning: '尽量依据事实、避免个人偏好的', collocations: ['an objective assessment', 'objective evidence', 'an objective approach'], example: 'An objective assessment should consider both the benefits and the costs of a policy.', note: '强调判断不受个人好恶支配；objective 不等于完全没有误差，也不能替代 precise 描述精度。' },
    ],
    tip: 'accurate 看是否接近事实，precise 看是否具体精细，rigorous 看过程是否严密，objective 看判断是否尽量排除个人偏好。',
  },
  {
    id: 'reliability', title: '可靠与稳定', subtitle: 'Can it be trusted, repeated, and sustained?',
    words: [
      { word: 'reliable', meaning: '能够信赖或依靠的', collocations: ['a reliable source', 'reliable information', 'a reliable service'], example: 'Students should compare several reliable sources before drawing conclusions about a public issue.', note: '可形容来源、信息、服务或人，强调其表现或内容值得依赖。' },
      { word: 'consistent', meaning: '表现一贯；结果前后一致的', collocations: ['consistent results', 'consistent quality', 'consistent with the evidence'], example: 'The two experiments produced consistent results despite being conducted in different laboratories.', note: '强调不同时间或对象之间保持一致；consistent with 表示与某事相符，不等于因果关系。' },
      { word: 'stable', meaning: '不易发生大幅变化的', collocations: ['a stable income', 'stable prices', 'a stable environment'], example: 'A stable income allows families to plan their spending more carefully.', note: '强调状态、价格、收入或环境相对平稳；稳定并不自动意味着表现良好或信息真实。' },
      { word: 'robust', meaning: '经受变化或检验后仍较稳健的', collocations: ['robust evidence', 'a robust system', 'robust findings'], example: 'A robust system should continue working when one part temporarily fails.', note: '用于系统、分析和研究结果时，强调不易被小的变化或缺陷推翻；具体含义依语境判断。' },
    ],
    tip: '可靠是 reliable，一贯是 consistent，平稳是 stable，经得起干扰或检验是 robust。重复得到同一个错误结果，也可能 consistent。',
  },
  {
    id: 'clarity', title: '明显与明确', subtitle: 'What can be seen, and what has been stated?',
    words: [
      { word: 'apparent', meaning: '看起来明显或表面上呈现的', collocations: ['an apparent contradiction', 'an apparent advantage', 'become apparent'], example: 'Despite its apparent simplicity, the model requires careful testing before use.', note: '既可表示明显，也可表示“表面看来如此”；是否已证实，要看后文与上下文。' },
      { word: 'evident', meaning: '从迹象或证据中看得出的', collocations: ['an evident need', 'clearly evident', 'evident from the results'], example: 'It became evident from the survey that residents wanted more frequent buses.', note: '常由迹象、结果或观察支持，常见 evident from / in；语气通常比 obvious 更正式。' },
      { word: 'obvious', meaning: '容易注意到或理解的', collocations: ['an obvious difference', 'an obvious advantage', 'obvious to everyone'], example: 'The most obvious difference between the two plans is their overall cost.', note: '强调容易看见或理解；议论文中过度使用 obvious 可能跳过本应解释的理由。' },
      { word: 'explicit', meaning: '被清楚、直接表达出来的', collocations: ['explicit instructions', 'explicit permission', 'an explicit statement'], example: 'Students need explicit instructions about how to acknowledge sources in their work.', note: '针对说明、许可或表述是否明说，与 implicit 相对；不等于某现象很容易被观察到。' },
    ],
    tip: '看到明显差异可以说 obvious / evident difference；规则已明说用 explicit。apparent 还可能暗示“表面如此，实际未必”。',
  },
  {
    id: 'difference-diversity', title: '不同与多样', subtitle: 'Variety, separation, uniqueness, and choice.',
    words: [
      { word: 'diverse', meaning: '由多种不同类型组成的', collocations: ['diverse backgrounds', 'a diverse population', 'diverse interests'], example: 'Public libraries serve people from diverse backgrounds and with different learning needs.', note: '关注集合内部的多样性，常搭配人口、背景、观点或兴趣；不等于某一个对象独一无二。' },
      { word: 'distinct', meaning: '有明显区别；可区分开的', collocations: ['distinct categories', 'a distinct difference', 'distinct from other groups'], example: 'The study separates travel costs into three distinct categories for comparison.', note: '强调界限或差异可以辨认，常用 distinct from；这里不是“种类很多”的意思。' },
      { word: 'unique', meaning: '独一无二；某对象特有的', collocations: ['a unique feature', 'a unique opportunity', 'unique to the region'], example: 'The island provides a habitat for plants that are unique to the region.', note: '强调唯一性或特有性，常用 unique to；严格表达时避免随意用 very unique 表示“很特别”。' },
      { word: 'alternative', meaning: '可供选择的另一种方案', collocations: ['an alternative approach', 'an alternative source', 'an alternative to driving'], example: 'Cycling offers an alternative to driving for many short journeys within the city.', note: '本词卡按名词学习，an alternative to + 名词；也有形容词用法，表示另一种可选方案。' },
    ],
    tip: 'diverse 说集合多样，distinct 说可以区分，unique 说特有或唯一；alternative 必须涉及另一个选择，不能泛指“不同”。',
  },
  {
    id: 'assumptions-claims', title: '假设与论断', subtitle: 'Starting points, testable ideas, and arguments.',
    words: [
      { word: 'assumption', meaning: '暂时当作成立的前提', collocations: ['a basic assumption', 'an underlying assumption', 'challenge an assumption'], example: 'The plan rests on the assumption that demand for housing will continue to rise.', note: '可作为推理或计划的前提，未必经过证明；make an assumption 和 on the assumption that 很常见。' },
      { word: 'hypothesis', meaning: '有待检验的解释或假说', collocations: ['test a hypothesis', 'support a hypothesis', 'an initial hypothesis'], example: 'The researchers designed a new experiment to test their hypothesis about memory.', note: '通常是可用研究检验的命题或解释；复数是 hypotheses，不是 hypothesises。' },
      { word: 'theory', meaning: '解释现象的理论或观点体系', collocations: ['a scientific theory', 'develop a theory', 'theory and practice'], example: 'A scientific theory should explain existing observations and allow further questions to be tested.', note: '学术语境中可指有系统依据的解释框架；不能把 theory 一概理解成未经检验的随意猜想。' },
      { word: 'thesis', meaning: '文章或论证所提出的核心主张', collocations: ['a central thesis', 'support a thesis', 'a thesis statement'], example: 'The central thesis of the essay is that cities should invest more in public transport.', note: '这里指论点或主张；thesis 也可指学位论文，但不是所有“假说”都能换成 thesis。' },
    ],
    tip: 'assumption 是暂当成立的前提，hypothesis 是待检验的解释，theory 可指解释体系，thesis 在此指作者要论证的中心主张。',
  },
  {
    id: 'effects-results', title: '影响与作用', subtitle: 'What follows, what changes, and what helps.',
    words: [
      { word: 'consequence', meaning: '某行为或事件带来的后果', collocations: ['a direct consequence', 'an unintended consequence', 'as a consequence of'], example: 'One unintended consequence of cheaper parking may be an increase in city traffic.', note: '强调先前行为或事件带来的结果，常带负面色彩但并非只能表示坏结果。' },
      { word: 'impact', meaning: '产生的明显影响或冲击', collocations: ['a significant impact', 'the impact on communities', 'assess the impact'], example: 'The study examines the impact of flexible working hours on employee satisfaction.', note: '常着重影响的程度或重要性，结构为 the impact of A on B；此处按名词使用。' },
      { word: 'influence', meaning: '塑造想法、行为或发展的影响力', collocations: ['a strong influence', 'an influence on behaviour', 'under the influence of'], example: 'Family habits can have a lasting influence on how children use their free time.', note: '可指渐进、间接的塑造作用，也可作动词；名词常用 influence on，动词后直接接对象。' },
      { word: 'contribution', meaning: '对某结果或目标所起的作用', collocations: ['a valuable contribution', 'a contribution to society', 'make a contribution'], example: 'Public libraries make a valuable contribution to learning across all age groups.', note: '常表达积极作用或投入，结构为 contribution to；也可客观讨论某因素对问题的促成作用。' },
    ],
    tip: 'consequence 强调后续结果，impact 强调明显影响，influence 常强调塑造作用，contribution 强调对结果或目标的投入与作用；它们不能在每句中互换。',
  },
  {
    id: 'benefits-strengths', title: '益处与价值', subtitle: 'Benefits received, assets held, and practical value.',
    words: [
      { word: 'benefit', meaning: '由行动或安排带来的好处', collocations: ['a clear benefit', 'the benefit of exercise', 'bring benefits to communities'], example: 'One clear benefit of cycling is that it reduces the cost of daily travel.', note: '关注获得的正面结果；作名词常用 the benefit of，作动词则有 benefit from 等结构。' },
      { word: 'asset', meaning: '有价值、可提供帮助的人或事物', collocations: ['a valuable asset', 'an asset to the team', 'a major asset'], example: 'Experienced teachers are a valuable asset to any school serving a growing community.', note: '可指财务资产，也可指有用的人或条件；此处是可数名词，不是“带来的好处”本身。' },
      { word: 'merit', meaning: '某方案、作品或论点本身的优点', collocations: ['the main merit', 'consider the merits', 'judge on merit'], example: 'The main merit of the proposal is its focus on affordable local services.', note: '适合评价方案或论证值得肯定之处；the merits of a proposal 可与其 drawbacks 对照。' },
      { word: 'utility', meaning: '工具、方法或事物的实用性', collocations: ['practical utility', 'the utility of a tool', 'limited utility'], example: 'These offline maps have practical utility for visitors without a mobile signal.', note: '这里指事物能满足实际需要的程度，不是使用后得到的好处本身；其他语境中也可指公用事业服务。' },
    ],
    tip: 'benefit 是得到的好处，asset 是有价值的人或资源，merit 是值得肯定之处，utility 是事物的实用性。它们分别评价结果、资源、优点和用途，不宜直接互换。',
  },
];
