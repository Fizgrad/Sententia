import type { ParaphraseGroup } from './types';

// Original examples compare near meanings, easily confused forms, and useful
// contrasts. Membership never means that every word is interchangeable.
export const extendedQualityGroups: ParaphraseGroup[] = [
  {
    id: 'quality-effectiveness', title: '有效、高效与多产', subtitle: 'Results reached, resources saved, and output produced.',
    words: [
      { word: 'effective', meaning: '达到预期效果的', collocations: ['an effective method', 'effective communication', 'effective at reducing waste'], example: 'Clear signs are an effective way to help visitors find the correct platform.', note: '关注是否取得预期效果，不说明耗时或成本多少；常用 effective in / at doing。' },
      { word: 'efficient', meaning: '少浪费资源而运作良好的', collocations: ['an efficient system', 'energy efficient', 'efficient use of resources'], example: 'An efficient booking system reduces the time staff spend on routine tasks.', note: '关注时间、金钱或能源的利用效率；一种方法可能有效却耗费很多资源。' },
      { word: 'productive', meaning: '产出多或能产生有用成果的', collocations: ['a productive meeting', 'productive work', 'a productive discussion'], example: 'A productive discussion should leave the team with clear actions to take.', note: '着重产出或成果；productive 不自动表示单位资源消耗低，也不必只指制造产品。' },
      { word: 'successful', meaning: '实现目标或取得成功的', collocations: ['a successful project', 'a successful application', 'a successful outcome'], example: 'The successful project encouraged other schools to start their own reading groups.', note: '评价某次行动或整体结果是否成功；不直接说明靠何种方法或效率取得成功。' },
    ],
    tip: 'effective 看效果，efficient 看资源效率，productive 看产出，successful 看目标是否实现。它们可能同时成立，却不是同一个判断。',
  },
  {
    id: 'quality-economy-cost', title: '经济、节约与开支', subtitle: 'Similar forms, different questions about money.',
    words: [
      { word: 'economic', meaning: '与经济活动有关的', collocations: ['economic growth', 'economic development', 'economic policy'], example: 'Economic growth can create new jobs while also increasing demand for housing.', note: '描述经济、贸易和资源配置相关事项；economic growth 不是“省钱的增长”。' },
      { word: 'economical', meaning: '节约金钱或其他资源的', collocations: ['an economical car', 'economical to run', 'economical use of materials'], example: 'A smaller printer may be more economical to run in a shared office.', note: '强调使用成本低、少浪费；“节约燃料的汽车”用 economical，不是 economic car。' },
      { word: 'monetary', meaning: '涉及货币或金钱的', collocations: ['monetary policy', 'monetary value', 'monetary support'], example: 'The report considers both the monetary value and the cultural importance of the collection.', note: '限定为货币或金钱层面；economic 的范围更广，还可涉及生产、就业和贸易。' },
      { word: 'costly', meaning: '价格高或需要很大开支的', collocations: ['costly repairs', 'a costly project', 'costly equipment'], example: 'Regular maintenance can help small schools avoid costly repairs to old equipment.', note: '此处按词卡的高费用义使用；与 economical 对照，不是 economic 的近义词。' },
    ],
    tip: 'economic 是“经济相关”，economical 是“节约资源”，monetary 限定金钱或货币；costly 表示开支高。拼写接近也要先看含义。',
  },
  {
    id: 'quality-complexity-detail', title: '复杂、详尽与全面', subtitle: 'Many parts, rich detail, full coverage, careful work.',
    words: [
      { word: 'complex', meaning: '部分相互关联、难以简单理解的', collocations: ['a complex system', 'a complex issue', 'a complex relationship'], example: 'A city transport network is a complex system with many connected services.', note: '强调组成部分或关系多而复杂；不表示介绍它的报告一定全面或详细。' },
      { word: 'elaborate', meaning: '细节丰富、制作或设计精细的', collocations: ['an elaborate design', 'an elaborate plan', 'an elaborate structure'], example: 'The museum displays an elaborate model showing how the ancient water system worked.', note: '本词卡是形容词，强调设计或细节繁复；不要把它当成“详细说明”的动词来使用。' },
      { word: 'comprehensive', meaning: '涵盖全部或几乎全部重要部分的', collocations: ['a comprehensive review', 'a comprehensive overview', 'comprehensive training'], example: 'The course provides a comprehensive overview of the main issues in environmental policy.', note: '重点是覆盖面广，不等于每个细节都十分复杂或每项工作都执行得细致。' },
      { word: 'thorough', meaning: '做得仔细、周全而不疏漏的', collocations: ['a thorough examination', 'a thorough review', 'thorough preparation'], example: 'The building needs a thorough examination before the council decides how to repair it.', note: '评价检查、准备或研究做得是否认真周全；重点是工作细致，而非结构复杂。' },
    ],
    tip: 'complex 说结构，elaborate 说细节设计，comprehensive 说覆盖范围，thorough 说完成工作的周全程度。',
  },
  {
    id: 'quality-expression-clarity', title: '表达清晰与过程透明', subtitle: 'How ideas fit together and how decisions can be examined.',
    words: [
      { word: 'coherent', meaning: '内容衔接合理、条理清楚的', collocations: ['a coherent argument', 'a coherent explanation', 'a coherent structure'], example: 'A coherent argument connects each example to the central point of the essay.', note: '重在各部分逻辑相连；单句都语法正确，也未必能组成 coherent argument。' },
      { word: 'articulate', meaning: '能清楚、流畅表达想法的', collocations: ['an articulate speaker', 'an articulate explanation', 'an articulate account'], example: 'An articulate speaker can explain a difficult idea without relying on technical language.', note: '此处是形容词，常评价表达者或表达清楚有力；本词卡不使用同形动词义。' },
      { word: 'explicit', meaning: '把意思清楚直接说出的', collocations: ['explicit instructions', 'explicit consent', 'an explicit explanation'], example: 'The handbook gives explicit instructions about how students should submit their work.', note: '强调已明说、无需推测；与 implicit 相对，不保证整篇文章逻辑连贯。' },
      { word: 'transparent', meaning: '公开清楚、可供理解与审查的', collocations: ['a transparent process', 'transparent decision making', 'a transparent system'], example: 'A transparent process allows residents to understand how public funding decisions are made.', note: '按词卡取制度或过程公开可审查的含义，此处不教玻璃透光的物理意义。' },
    ],
    tip: 'coherent 看逻辑衔接，articulate 看表达是否清楚流畅，explicit 看是否明说，transparent 看过程是否公开可审查。',
  },
  {
    id: 'quality-relevance-fit', title: '相关、适当与相容', subtitle: 'Connected to the issue, suited to the task, able to work together.',
    words: [
      { word: 'relevant', meaning: '与正在讨论的问题密切相关的', collocations: ['relevant evidence', 'relevant experience', 'relevant to the discussion'], example: 'The essay should include evidence that is relevant to the question being discussed.', note: '先判断是否切题或与事项有关；相关的信息也未必适合向所有受众公开。' },
      { word: 'appropriate', meaning: '适合某种场合、对象或条件的', collocations: ['appropriate language', 'an appropriate response', 'appropriate for the audience'], example: 'Teachers should choose language that is appropriate for the age of their students.', note: '常关注场合、受众和判断上的得体；不只表示事物在技术上可以使用。' },
      { word: 'suitable', meaning: '适合特定用途或对象的', collocations: ['suitable materials', 'a suitable location', 'suitable for beginners'], example: 'The library provides quiet rooms that are suitable for individual study.', note: '常用 suitable for + 名词，强调符合某项用途或对象的实际要求。' },
      { word: 'compatible', meaning: '能一起使用或共存而不冲突的', collocations: ['compatible software', 'compatible goals', 'compatible with existing equipment'], example: 'Schools need software that is compatible with the computers they already own.', note: '强调两者能否配合或共存，常用 compatible with；不同于单独评价某物是否合用。' },
    ],
    tip: 'relevant to 表示有关联，suitable / appropriate for 表示适用，compatible with 表示能配合；写作中别只按“合适”一个中文意思选词。',
  },
  {
    id: 'quality-duration', title: '暂时、持久与进行中', subtitle: 'How long it lasts is different from whether it is happening now.',
    words: [
      { word: 'temporary', meaning: '只持续有限时间的', collocations: ['a temporary solution', 'temporary accommodation', 'a temporary closure'], example: 'The council opened a temporary library while the main building was being repaired.', note: '说明预计只维持一段有限时间；这段时间不一定非常短。' },
      { word: 'permanent', meaning: '长期持续而不作临时安排的', collocations: ['a permanent change', 'a permanent position', 'permanent accommodation'], example: 'Residents want a permanent solution to the frequent flooding near the station.', note: '与 temporary 对照，强调持久或固定的安排；不表示世上任何条件下都不会变化。' },
      { word: 'persistent', meaning: '持续存在或面对困难仍不停止的', collocations: ['a persistent problem', 'persistent efforts', 'persistent delays'], example: 'Persistent delays make it difficult for local shops to plan their deliveries.', note: '常描述反复或长期不消失的问题，也可形容坚持的努力；不等于正式的长期安排。' },
      { word: 'ongoing', meaning: '目前仍在进行的', collocations: ['an ongoing debate', 'ongoing research', 'an ongoing project'], example: 'The report describes an ongoing debate about the best use of public land.', note: '强调此刻尚在进行；ongoing research 可能很快结束，不保证 permanent 或 persistent。' },
    ],
    tip: 'temporary / permanent 比较安排的时长，persistent 强调持续或反复不止，ongoing 只说明目前仍在进行。',
  },
  {
    id: 'quality-change-pattern', title: '变化的速度、幅度与积累', subtitle: 'Fast, gradual, striking, or built up over time?',
    words: [
      { word: 'rapid', meaning: '在较短时间内发生的', collocations: ['rapid growth', 'rapid development', 'a rapid increase'], example: 'Rapid growth in online shopping has increased demand for local delivery services.', note: '强调变化速度快，不单独说明起点、终点或总幅度有多大。' },
      { word: 'gradual', meaning: '通过小幅变化慢慢发生的', collocations: ['a gradual change', 'a gradual increase', 'a gradual improvement'], example: 'The survey shows a gradual increase in the number of people cycling to work.', note: '强调渐进过程；可以持续很久并最终形成很大的变化。' },
      { word: 'dramatic', meaning: '变化或效果非常显著的', collocations: ['a dramatic change', 'a dramatic improvement', 'a dramatic increase'], example: 'The new rail link led to a dramatic improvement in journey times.', note: '在本词卡中强调显著、剧烈或突然的效果，不是戏剧艺术的分类形容词。' },
      { word: 'cumulative', meaning: '由多次增加或影响逐步累积的', collocations: ['a cumulative effect', 'cumulative damage', 'a cumulative total'], example: 'Small daily savings can have a cumulative effect on a household budget.', note: '强调各次作用相加形成的总效果；不直接说明每次发生得快还是慢。' },
    ],
    tip: 'rapid 看速度，dramatic 看显著程度，gradual 看渐进过程，cumulative 看多次作用相加。描述图表时先确定你在评价哪一方面。',
  },
  {
    id: 'quality-frequency', title: '频繁、定期与罕见', subtitle: 'Frequency needs both the right meaning and the right word form.',
    words: [
      { word: 'frequent', meaning: '形容词：经常发生的', collocations: ['frequent delays', 'frequent visits', 'a frequent problem'], example: 'Frequent changes to the timetable make public transport harder for passengers to use.', note: '本词卡是形容词，用来修饰名词；不能把 frequent 直接放在动词后当副词使用。' },
      { word: 'daily', meaning: '形容词：每天发生或使用的', collocations: ['a daily routine', 'daily activities', 'a daily service'], example: 'A daily bus service connects the village with the nearest railway station.', note: '本词卡按形容词学习，修饰名词表示每日的；daily 在其他句型中也可作副词。' },
      { word: 'regularly', meaning: '副词：经常或按一定间隔地', collocations: ['meet regularly', 'check regularly', 'regularly updated information'], example: 'Staff regularly check the equipment to identify small problems before they become serious.', note: '副词，常修饰动作；按固定间隔进行不必等于次数很多，月度活动也可 regularly occur。' },
      { word: 'rarely', meaning: '副词：很少发生地', collocations: ['rarely used', 'rarely occur', 'rarely seen'], example: 'The narrow path is rarely used because most walkers prefer the riverside route.', note: '表示频率低，而非完成程度低；通常不再加 not，避免无意中把意思反过来。' },
    ],
    tip: 'frequent / daily 在本组按形容词修饰名词，regularly / rarely 按副词修饰动作。定期、频繁、每天和很少是不同的频率信息。',
  },
  {
    id: 'quality-large-amounts', title: '数量可观与体量巨大', subtitle: 'Large amounts, many separate items, and very large scale.',
    words: [
      { word: 'substantial', meaning: '数量或程度达到可观规模的', collocations: ['substantial funding', 'a substantial proportion', 'substantial progress'], example: 'The programme needs substantial funding to reach schools across the whole region.', note: '常修饰资金、比例和进展，强调规模可观；并不表示数量正好足够。' },
      { word: 'considerable', meaning: '数量、程度或重要性相当大的', collocations: ['considerable time', 'considerable expense', 'considerable interest'], example: 'Planning a new public park takes considerable time and consultation with residents.', note: '语气较克制而正式，常与时间、费用、经验等搭配。' },
      { word: 'numerous', meaning: '个数很多的', collocations: ['numerous examples', 'numerous studies', 'numerous opportunities'], example: 'The library offers numerous opportunities for residents to develop their digital skills.', note: '修饰复数可数名词；可以说 numerous studies，不说 numerous information。' },
      { word: 'massive', meaning: '规模、数量或影响非常巨大的', collocations: ['massive investment', 'a massive increase', 'a massive building'], example: 'Repairing the damaged bridge will require massive investment over several years.', note: '通常比“相当多”更强，可描述物体体量或投入规模；不要为追求强烈语气夸大数据。' },
    ],
    tip: '先看数量类型：numerous 接复数可数名词，其他词常描述总体数量或规模。massive 的语气很强，不等于所有场景中的 many。',
  },
  {
    id: 'quality-degree-approximation', title: '比较、大约与接近程度', subtitle: 'A comparison is not the same as an estimate.',
    words: [
      { word: 'relatively', meaning: '与某个参照相比地', collocations: ['relatively low', 'relatively simple', 'relatively small'], example: 'Housing costs remain relatively low here compared with those in nearby cities.', note: '需要明确或可推知的比较基准；relatively cheap 不等于对每个人都便宜。' },
      { word: 'approximately', meaning: '数值大约、近似地', collocations: ['approximately equal', 'approximately half', 'approximately ten minutes'], example: 'The walk from the station to the museum takes approximately ten minutes.', note: '用于估计数量、时间或距离；不能把它当作“相对而言”去评价一个方案。' },
      { word: 'virtually', meaning: '几乎完全或实际效果上近乎地', collocations: ['virtually impossible', 'virtually empty', 'virtually unchanged'], example: 'The lecture hall was virtually empty when the final speaker arrived.', note: '常接近某种整体状态，不是虚拟现实中“以虚拟方式”的意思。' },
      { word: 'barely', meaning: '勉强达到；几乎没有地', collocations: ['barely enough', 'barely visible', 'barely able to'], example: 'The room has barely enough space for the equipment needed by the class.', note: '强调最低程度或差点达不到；barely enough 的量接近不足，不是数量充裕。' },
    ],
    tip: 'relatively 需要比较，approximately 估计数值，virtually 接近某种整体状态，barely 强调几乎没有或勉强达到。',
  },
  {
    id: 'quality-earlier-stages', title: '最初、初步与先前', subtitle: 'Locate an event before choosing a time adjective.',
    words: [
      { word: 'initial', meaning: '位于过程最开始的', collocations: ['an initial response', 'an initial stage', 'initial costs'], example: 'The initial response to the new recycling scheme was more positive than expected.', note: '指过程开始时的情况，不表示调查或安排尚未完成准备工作。' },
      { word: 'preliminary', meaning: '主活动之前的预备或初步的', collocations: ['a preliminary study', 'preliminary findings', 'a preliminary assessment'], example: 'The preliminary study will help the team design a larger survey next year.', note: '常用于预备调查或暂时的发现，通常暗示后续还有更完整的研究或决定。' },
      { word: 'prior', meaning: '在另一个事件之前的', collocations: ['prior experience', 'prior permission', 'prior to the meeting'], example: 'Visitors need prior permission before they can examine items in the private collection.', note: 'prior 可修饰名词，prior to 表示在某事之前；它不必指整个过程最早的一步。' },
      { word: 'previous', meaning: '先于当前所讨论对象的', collocations: ['the previous year', 'a previous study', 'previous experience'], example: 'The previous study used a smaller sample and examined only one neighbourhood.', note: '常与当前年份、版本或研究相对照；previous 与 prior 接近，但固定结构不同。' },
    ],
    tip: 'initial 定位开始，preliminary 定位预备阶段，prior / previous 定位相对于另一件事的先后。表示“在某事之前”时常用 prior to 或 before，不要仅按词义接近机械套用结构。',
  },
  {
    id: 'quality-foundation-nature', title: '根本、固有与核心', subtitle: 'Foundations, natural properties, and central roles.',
    words: [
      { word: 'fundamental', meaning: '作为基础、其他部分赖以成立的', collocations: ['a fundamental principle', 'a fundamental question', 'fundamental to learning'], example: 'Access to reliable information is fundamental to informed discussion about public policy.', note: '强调基础地位或根本层面，不只是众多因素中比较显眼的一项。' },
      { word: 'inherent', meaning: '随事物本身而存在的', collocations: ['inherent risks', 'an inherent difficulty', 'inherent in the process'], example: 'The report examines the inherent risks of relying on a single water source.', note: '常用于风险、困难或性质，强调是事物本身带有的，常接 inherent in。' },
      { word: 'intrinsic', meaning: '属于事物自身而非外部赋予的', collocations: ['intrinsic value', 'intrinsic motivation', 'intrinsic to the activity'], example: 'The course aims to develop intrinsic motivation rather than dependence on external rewards.', note: '强调内在来源或自身价值；与 external / extrinsic 对照，不单纯表示地位重要。' },
      { word: 'central', meaning: '在作用或位置上居于核心的', collocations: ['a central role', 'a central issue', 'central to the argument'], example: 'Affordable transport plays a central role in connecting people with employment opportunities.', note: '本例取核心作用义，中心位置也是词卡义项；central 不等于某种性质天生固有。' },
    ],
    tip: 'fundamental 讲根基，central 讲核心作用，inherent / intrinsic 讲事物本身具有的性质；不能把“重要”与“内在”当成同一含义。',
  },
  {
    id: 'quality-distance', title: '偏远、遥远与相邻', subtitle: 'Distance from people, distance in space, or direct proximity.',
    words: [
      { word: 'remote', meaning: '远离人口聚居地的', collocations: ['a remote village', 'remote communities', 'a remote area'], example: 'Teachers in remote communities may need additional support to access specialist training.', note: '按词卡取地理偏远义，常联系聚居地或公共服务；本组不扩展到远程办公或可能性很小。' },
      { word: 'distant', meaning: '空间或时间上相距遥远的', collocations: ['a distant town', 'a distant region', 'the distant past'], example: 'The exhibition brings together paintings borrowed from museums in distant parts of the country.', note: '适用空间、时间或关系上的距离，不必意味着远离城市或交通不便。' },
      { word: 'adjacent', meaning: '紧挨着或直接相邻的', collocations: ['adjacent buildings', 'an adjacent room', 'adjacent to the park'], example: 'The new library will occupy the building adjacent to the railway station.', note: '表示近邻，是本组的距离对照词，并非 remote 的同义词；固定搭配为 adjacent to。' },
    ],
    tip: 'remote 常以人口聚居地为参照，distant 泛指距离遥远，adjacent 则表示紧邻。读到 adjacent to 时不要误判为“远离”。',
  },
  {
    id: 'quality-geographic-scope', title: '国内、国际与全球', subtitle: 'Identify the scale before making a comparison.',
    words: [
      { word: 'domestic', meaning: '本国范围内、与国外相对的', collocations: ['the domestic market', 'domestic demand', 'domestic production'], example: 'Local producers supply the domestic market before selling their goods to buyers abroad.', note: '本词卡取国内事务和市场义；此处不教家庭生活或驯养动物的其他用法。' },
      { word: 'national', meaning: '涉及一个国家整体的', collocations: ['national standards', 'a national policy', 'the national economy'], example: 'National standards can help ensure that schools provide a similar quality of education.', note: '强调全国层级或国家整体；与 local / regional 的层级对照不同于国内外对照。' },
      { word: 'international', meaning: '涉及多个国家的', collocations: ['international trade', 'international cooperation', 'an international conference'], example: 'International cooperation allows researchers from several countries to share equipment and compare their findings.', note: '涉及一个国家以上即可，不要求覆盖全世界；不能把任何跨国活动都夸大成 global。' },
      { word: 'global', meaning: '涉及或影响整个世界的', collocations: ['a global challenge', 'the global economy', 'global demand'], example: 'Climate change is a global challenge that requires action at several levels.', note: '强调世界整体范围；global 和 international 有交集，但所主张的覆盖程度不同。' },
    ],
    tip: 'domestic 对照国外，national 对照地方层级，international 涉及多个国家，global 涉及世界整体。描述数据时保留原文范围，勿随意扩大。',
  },
  {
    id: 'quality-vulnerability', title: '脆弱、易受影响与敏感', subtitle: 'Limited protection, easy damage, and a strong response.',
    words: [
      { word: 'vulnerable', meaning: '保护不足、容易受到伤害的', collocations: ['vulnerable communities', 'vulnerable groups', 'vulnerable to flooding'], example: 'Low coastal settlements are particularly vulnerable to flooding when protective barriers are damaged.', note: '常指人群、社区或系统缺少保护，常接 vulnerable to；不局限于物体易碎。' },
      { word: 'fragile', meaning: '容易破碎、受损或被破坏的', collocations: ['fragile objects', 'a fragile ecosystem', 'a fragile agreement'], example: 'Visitors must handle the fragile objects carefully when helping to prepare the exhibition.', note: '可指实物易碎，也可指生态或关系难以承受冲击；重点是结构或状态不坚固。' },
      { word: 'susceptible', meaning: '容易受到某种因素影响或损害的', collocations: ['susceptible to damage', 'susceptible to pressure', 'susceptible to change'], example: 'The old documents are susceptible to damage from bright light and damp air.', note: '通常接 to，说明容易受到哪一种影响；一般不能只靠 susceptible 表达“能理解别人的感情”。' },
      { word: 'sensitive', meaning: '对变化、刺激或感受反应明显的', collocations: ['sensitive equipment', 'sensitive to changes', 'sensitive to other people'], example: 'The laboratory uses sensitive equipment to measure small changes in water temperature.', note: '可表示仪器灵敏，也可表示易受影响或顾及感受；灵敏不一定等于缺乏保护。' },
    ],
    tip: 'vulnerable 强调保护不足，fragile 强调容易损坏，susceptible to 指向特定影响，sensitive 还可能是在肯定灵敏度或体贴。',
  },
  {
    id: 'quality-harm-adversity', title: '有害、不利与破坏', subtitle: 'Separate damage, unfavourable conditions, and destruction.',
    words: [
      { word: 'detrimental', meaning: '造成损害或负面作用的', collocations: ['a detrimental effect', 'detrimental consequences', 'detrimental to local businesses'], example: 'Long delays can have a detrimental effect on small businesses near the station.', note: '较正式，常用于 detrimental effect on 或 detrimental to，强调某事造成的不良作用。' },
      { word: 'harmful', meaning: '造成或可能造成伤害的', collocations: ['harmful waste', 'harmful substances', 'harmful to the environment'], example: 'The factory must prevent harmful waste from entering the river near the village.', note: '使用范围广，可指实际或潜在伤害；比 adverse 更直接地说明有损害。' },
      { word: 'adverse', meaning: '不利于利益或正常发展的', collocations: ['adverse conditions', 'adverse weather', 'an adverse effect'], example: 'Adverse weather conditions forced the organisers to move the event into the school hall.', note: '常用于不利条件、天气或影响；adverse weather 不等于天气有毒，也不必已经造成破坏。' },
      { word: 'destructive', meaning: '造成明显破坏或毁损的', collocations: ['a destructive effect', 'destructive behaviour', 'a destructive force'], example: 'The storm had a destructive effect on several buildings along the coast.', note: '语气通常更强，突出毁坏作用；不要把所有轻微不利影响都描述为 destructive。' },
    ],
    tip: 'adverse 可以只是条件不利，harmful / detrimental 明确涉及损害，destructive 更强调破坏。选择强度时应与实际语境相符。',
  },
  {
    id: 'quality-positive-value', title: '有益、积极与可取', subtitle: 'Helpful effects, constructive attitudes, and desirable aims.',
    words: [
      { word: 'beneficial', meaning: '对某对象产生有益作用的', collocations: ['a beneficial effect', 'beneficial changes', 'beneficial to communities'], example: 'Shared green spaces can have a beneficial effect on relationships between neighbours.', note: '关注帮助或正面作用，通常要能指出对谁有益；常用 beneficial to。' },
      { word: 'positive', meaning: '积极、乐观或表示肯定的', collocations: ['a positive attitude', 'a positive response', 'positive feedback'], example: 'A positive attitude can help learners keep working when a task becomes difficult.', note: '按词卡取乐观、建设性或肯定义；不在这里扩展到检测阳性或数学正数。' },
      { word: 'desirable', meaning: '值得拥有、争取或实现的', collocations: ['a desirable outcome', 'a desirable feature', 'socially desirable'], example: 'Lower noise levels are a desirable outcome of reducing traffic near schools.', note: '表达目标或特征值得追求，不保证已经发生，也不保证现实中一定可行。' },
      { word: 'useful', meaning: '对某个目的有实际帮助的', collocations: ['useful information', 'a useful tool', 'useful for revision'], example: 'A clear summary is a useful tool for reviewing the main ideas in an article.', note: '通常与具体用途相联系，语气直接中性；一种工具有用，不表示一切后果都 beneficial。' },
    ],
    tip: 'beneficial 看对人的作用，positive 可评价态度或反馈，desirable 看目标是否值得追求，useful 看对特定任务是否有帮助。',
  },
  {
    id: 'quality-adaptation-response', title: '灵活、响应与韧性', subtitle: 'Changing, responding, and recovering are different abilities.',
    words: [
      { word: 'flexible', meaning: '能随需要或条件作调整的', collocations: ['a flexible timetable', 'a flexible approach', 'flexible working hours'], example: 'A flexible timetable allows adult learners to combine classes with their work commitments.', note: '强调安排或做法能调整；不一定表示变化频繁，也不等于遇到困难后能恢复。' },
      { word: 'dynamic', meaning: '活跃且不断变化发展的', collocations: ['a dynamic economy', 'a dynamic environment', 'a dynamic process'], example: 'A dynamic economy creates new opportunities but also requires workers to keep learning.', note: '描述活力或变化过程，不单独评价某项安排是否容易修改。' },
      { word: 'responsive', meaning: '能及时回应变化或需求的', collocations: ['responsive services', 'responsive to feedback', 'responsive to local needs'], example: 'Public services should be responsive to the needs of residents in different neighbourhoods.', note: '通常指出回应什么，常接 to；有反馈才作出适当回应是其重点。' },
      { word: 'resilient', meaning: '面对困难后能恢复或适应的', collocations: ['a resilient community', 'a resilient economy', 'resilient infrastructure'], example: 'A resilient community can recover more quickly when essential services are disrupted.', note: '强调承受冲击后恢复和调整的能力；不意味着从来不会受到影响。' },
    ],
    tip: 'flexible 看能否调整，dynamic 看是否活跃变化，responsive 看是否回应需求，resilient 看受冲击后能否恢复。',
  },
  {
    id: 'quality-convention-custom', title: '传统、常规与惯常', subtitle: 'Long traditions are only one kind of normal practice.',
    words: [
      { word: 'conventional', meaning: '依照普遍接受的方法或观念的', collocations: ['conventional methods', 'conventional wisdom', 'a conventional approach'], example: 'The researchers compared the new technique with conventional methods of treating the material.', note: '强调主流或惯用做法，不要求已经传承很多代；常与新方法对照。' },
      { word: 'traditional', meaning: '由长期传承的传统形成的', collocations: ['traditional crafts', 'traditional customs', 'traditional knowledge'], example: 'The museum runs workshops to help younger people learn traditional crafts from local makers.', note: '突出传承与传统来源；传统做法可以仍在使用，并不自动表示落后或无效。' },
      { word: 'customary', meaning: '符合某地或某群体习惯的', collocations: ['a customary practice', 'the customary greeting', 'customary arrangements'], example: 'The guide explains the customary greeting used when visitors enter a local home.', note: '关注某群体的惯例，常见 it is customary to do；不一定是全社会普遍接受的方式。' },
      { word: 'usual', meaning: '平时经常出现或采用的', collocations: ['the usual route', 'usual practice', 'the usual opening hours'], example: 'The library returned to its usual opening hours after the repair work ended.', note: '可只指某个人或机构平常的情况，语气日常，不要求具有传统或文化意义。' },
    ],
    tip: 'traditional 讲传承，conventional 讲广泛接受的常规，customary 讲群体惯例，usual 讲平时通常如此。',
  },
  {
    id: 'quality-originality', title: '原创、新意与当代', subtitle: 'New ideas are not the same as recent dates.',
    words: [
      { word: 'innovative', meaning: '引入有用新方法或新设计的', collocations: ['an innovative approach', 'innovative technology', 'an innovative design'], example: 'The team developed an innovative design that uses less material without reducing strength.', note: '强调引入有用的新想法，不是只要生产日期近就可以称 innovative。' },
      { word: 'original', meaning: '独立创作、有新意而非照搬的', collocations: ['an original idea', 'original research', 'an original design'], example: 'Students are encouraged to develop an original idea rather than copy an existing design.', note: '本例取原创义；词卡也包含最初的意思，要靠搭配判断，不要一律译为“新颖”。' },
      { word: 'contemporary', meaning: '属于当代或近期的', collocations: ['contemporary art', 'contemporary society', 'contemporary architecture'], example: 'The exhibition explores how contemporary art responds to changes in city life.', note: '主要定位时代，不保证作品创新、独特或首次出现。' },
      { word: 'unique', meaning: '独一无二或某对象特有的', collocations: ['a unique feature', 'a unique design', 'unique to the region'], example: 'The building has a unique design inspired by the shape of local leaves.', note: '强调唯一或特有，不意味着新近产生；古老事物也可以 unique。' },
    ],
    tip: 'innovative 讲新方法，original 在此讲独立创作，contemporary 讲年代，unique 讲唯一性。不要用“现代”自动推出“创新”。',
  },
  {
    id: 'quality-scarcity-insufficiency', title: '稀缺、罕见与不足', subtitle: 'Low supply, low frequency, an unmet need, or a small effect.',
    words: [
      { word: 'scarce', meaning: '供应少且难满足需求的', collocations: ['scarce resources', 'scarce water supplies', 'scarce public funding'], example: 'Scarce public funding means that the council must choose which buildings to repair first.', note: '侧重供应与需求之间的不足，常用于资金、水和资源；不同于偶尔才见到某物。' },
      { word: 'rare', meaning: '不常出现或不常发现的', collocations: ['a rare species', 'a rare opportunity', 'a rare event'], example: 'The island provides a protected habitat for several rare species of plants.', note: '强调出现频率或数量少，不一定暗示有人需要更多；稀有物也可能受到珍视。' },
      { word: 'inadequate', meaning: '数量或质量达不到需要的', collocations: ['inadequate funding', 'inadequate facilities', 'inadequate preparation'], example: 'Inadequate facilities can prevent a school from offering a wider range of practical courses.', note: '既可缺数量，也可缺所需品质；有很多设备但不合用途，仍可能 inadequate。' },
      { word: 'marginal', meaning: '数量、影响或重要性很小的', collocations: ['a marginal increase', 'a marginal improvement', 'a marginal difference'], example: 'The new timetable produced only a marginal improvement in average journey times.', note: '按词卡取微小义，不教经济学中的边际量或社会边缘地位；小幅改善不等于资源稀缺。' },
    ],
    tip: 'scarce 是供给不足，rare 是不常见，inadequate 是达不到要求，marginal 在此只是幅度很小。不要把“小”都译成 scarce。',
  },
  {
    id: 'quality-access-eligibility', title: '可获取、易使用与有资格', subtitle: 'An available service may still be hard to access.',
    words: [
      { word: 'available', meaning: '在需要时能够取得或使用的', collocations: ['available resources', 'available information', 'available to the public'], example: 'The report is available to the public on the local council website.', note: '说明存在并可供取得或使用，不保证地点容易到达、语言易懂或使用方便。' },
      { word: 'accessible', meaning: '容易到达、进入、使用或理解的', collocations: ['accessible information', 'an accessible building', 'accessible to everyone'], example: 'An accessible building allows visitors with different mobility needs to enter safely.', note: '强调使用门槛或到达难度低；资料即使 available，也可能因为术语过多而不 accessible。' },
      { word: 'convenient', meaning: '适合实际需要、方便使用的', collocations: ['a convenient location', 'a convenient time', 'convenient for commuters'], example: 'The station offers a convenient meeting point for people arriving from different towns.', note: '评价地点、时间或安排是否省事合用；不是“已有空缺”或“符合申请资格”的意思。' },
      { word: 'eligible', meaning: '符合被选择或接受条件的', collocations: ['eligible applicants', 'eligible for support', 'eligible to apply'], example: 'Applicants must prove that they are eligible before receiving the training grant.', note: '通常评价申请者或候选对象，常用 eligible for / to do；服务可用不表示所有人都有资格使用。' },
    ],
    tip: 'available 说能取得，accessible 说容易取得或使用，convenient 说安排方便，eligible 说对象符合条件。四者评价的主语和维度不同。',
  },
  {
    id: 'quality-dispute-doubt', title: '争议、歧义与可疑', subtitle: 'Disagreement, unclear meaning, and uncertain trust.',
    words: [
      { word: 'controversial', meaning: '引起强烈争论或分歧的', collocations: ['a controversial issue', 'a controversial decision', 'a controversial proposal'], example: 'The controversial proposal led to several public meetings about the future of the park.', note: '表示人们意见分歧，不自动说明提议错误、含糊或缺少证据。' },
      { word: 'ambiguous', meaning: '可能有多种解释而不够清楚的', collocations: ['ambiguous wording', 'an ambiguous statement', 'an ambiguous instruction'], example: 'The ambiguous instruction left students uncertain about how many questions they should answer.', note: '重点是意思不唯一或解释不清；一条清楚明确的规则仍可能 controversial。' },
      { word: 'dubious', meaning: '真实性、可信度或成立与否存疑的', collocations: ['a dubious claim', 'dubious evidence', 'a dubious explanation'], example: 'The article repeats a dubious claim without explaining where the supporting evidence came from.', note: '表示值得怀疑或难以信任，比单纯“大家有分歧”多了一层对可信度的质疑。' },
    ],
    tip: 'controversial 看意见分歧，ambiguous 看语言解释，dubious 看可信度。不能因为一个观点有争议，就直接说它含糊或不可信。',
  },
  {
    id: 'quality-equality-resemblance', title: '相等、相同与相似', subtitle: 'Equal value does not require identical details.',
    words: [
      { word: 'equivalent', meaning: '在价值、数量、意义或功能上相当的', collocations: ['an equivalent qualification', 'equivalent value', 'equivalent to the original'], example: 'The two qualifications are equivalent in level, although their course structures are different.', note: '限定某个比较维度相当，不要求所有细节一致；常用 equivalent to。' },
      { word: 'identical', meaning: '在所比较的细节上完全相同的', collocations: ['identical instructions', 'identical copies', 'identical to the original'], example: 'The two forms contain identical instructions, although their layouts are different.', note: '比 similar 更强；要看完全相同的是哪个对象，本例只是说明文字相同。' },
      { word: 'similar', meaning: '存在相似特征或对应之处的', collocations: ['similar results', 'a similar approach', 'similar to the previous study'], example: 'The two cities face similar transport problems despite having different population sizes.', note: '允许仍有差异；similar to 是常见结构，不必为了避免重复而把它换成 identical。' },
    ],
    tip: 'equivalent 是指定维度相当，identical 是所比细节完全相同，similar 只是有相似之处。阅读中把 similar 换成 identical 可能扩大原意。',
  },
  {
    id: 'quality-logical-links', title: '因此、从而与否则', subtitle: 'Keep the direction of the logic intact.',
    words: [
      { word: 'consequently', meaning: '由前述情况产生结果，因此', collocations: ['consequently reduced demand', 'consequently increased costs', 'and consequently changed'], example: 'The bus service improved; consequently, fewer residents needed to drive into the city.', note: '连接由前文情况产生的结果；可放在独立分句前，注意用句号或分号安排分句。' },
      { word: 'hence', meaning: '基于前述原因或推论，所以', collocations: ['hence the delay', 'hence the need', 'and hence the difference'], example: 'The road was closed; hence, deliveries arrived later than usual that morning.', note: '较简洁正式，可接完整分句，也可接名词短语，如 hence the delay。' },
      { word: 'thereby', meaning: '通过前述做法，从而', collocations: ['thereby reducing costs', 'thereby improving access', 'thereby saving time'], example: 'The school extended library hours, thereby improving access for students who work during the day.', note: '把结果与前面那种做法直接联系，常见 thereby + 动词的 ing 形式；不是任意位置的 therefore。' },
      { word: 'otherwise', meaning: '如果前述条件不满足，否则', collocations: ['otherwise unavailable', 'otherwise impossible', 'otherwise wasted'], example: 'Please confirm your booking today; otherwise, the room may be offered to another group.', note: '本词卡取条件不满足时的“否则”义；它不是“因此”，也不在这里扩展其他方面的意思。' },
    ],
    tip: 'consequently / hence 引出结果，thereby 突出通过前述做法取得结果；otherwise 引出条件未满足时的另一结果，逻辑方向不能混淆。',
  },
];
