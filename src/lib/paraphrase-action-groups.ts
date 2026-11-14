import type { ParaphraseGroup } from './types';

// Original teaching material. Related words share a semantic area, but their
// grammar, usual objects and strength do not make them freely interchangeable.
export const actionParaphraseGroups: ParaphraseGroup[] = [
  {
    id: 'assess-inspect',
    title: '评估与检查',
    subtitle: 'A judgement, a finding, or a closer look.',
    words: [
      { word: 'assess', meaning: '判断程度、风险或需求', collocations: ['assess risks', 'assess the impact', 'assess needs'], example: 'Researchers assess the health risks before recommending changes to the local water supply.', note: '重在综合信息后作出判断，常用于风险、影响、能力与需求，不一定给出精确数值。' },
      { word: 'evaluate', meaning: '按标准评价价值或效果', collocations: ['evaluate effectiveness', 'evaluate evidence', 'evaluate options'], example: 'Schools should evaluate the effectiveness of new teaching methods before expanding their use.', note: '强调根据一定标准考察质量、价值或成效，与 assess 有重叠，但常用于方案与项目评价。' },
      { word: 'determine', meaning: '通过调查或计算确定结果', collocations: ['determine the cause', 'determine the extent', 'determine the outcome'], example: 'Further tests should determine the cause of the damage before engineers begin repairs.', note: '可指经过调查、计算或推理确定事实、原因或范围，也可表示某因素决定结果；不像 evaluate 那样侧重价值判断。' },
      { word: 'inspect', meaning: '仔细检查状态与问题', collocations: ['inspect a building', 'inspect equipment', 'inspect a site'], example: 'Engineers inspect the bridge regularly to identify cracks before they become dangerous.', note: '常指仔细查看实物、场所或设备，以确认状况或发现问题，不直接等于评价政策效果。' },
    ],
    tip: '判断风险用 assess risks，衡量成效用 evaluate effectiveness，查明原因用 determine the cause，检查设备用 inspect equipment。先分清是在评价、确定事实还是检查。',
  },
  {
    id: 'acquire-achieve',
    title: '获得与达成',
    subtitle: 'What you gain, and what you reach.',
    words: [
      { word: 'acquire', meaning: '逐步获得知识、技能或经验', collocations: ['acquire skills', 'acquire knowledge', 'acquire experience'], example: 'Young adults acquire practical skills when they take part in supervised community projects.', note: '常表示通过学习、经历或其他过程获得，也可用于财产与企业；不总是有意争取的结果。' },
      { word: 'obtain', meaning: '设法取得所需事物', collocations: ['obtain permission', 'obtain data', 'obtain funding'], example: 'Researchers must obtain permission before collecting personal information from the participants in a study.', note: '较正式，强调成功取得信息、许可、资金等，不像 acquire knowledge 那样突出逐步积累。' },
      { word: 'attain', meaning: '达到某个水平或标准', collocations: ['attain a high level', 'attain a standard', 'attain maturity'], example: 'With regular practice, most learners can attain the level required for further study.', note: '较正式，常与水平、标准、年龄或成熟状态搭配，强调到达某个程度。' },
      { word: 'achieve', meaning: '经过努力实现目标或结果', collocations: ['achieve a goal', 'achieve success', 'achieve a balance'], example: 'Cities can achieve a better balance between new housing and access to green spaces.', note: '突出通过行动或努力取得成果，常搭配目标、成功、进步与平衡。' },
    ],
    tip: '知识常用 acquire knowledge，许可常用 obtain permission，达到标准用 attain a standard，实现目标用 achieve a goal；不要只根据中文“获得”逐词替换。',
  },
  {
    id: 'interpret-demonstrate',
    title: '阐释与说明',
    subtitle: 'From understanding to clear evidence.',
    words: [
      { word: 'interpret', meaning: '理解或阐释信息的含义', collocations: ['interpret results', 'interpret data', 'interpret a message'], example: 'Students learn to interpret survey results by considering who answered the questions and why.', note: '重在理解数据、言语或行为代表什么；同一信息可能产生不同解读，解读本身不等于证实。' },
      { word: 'clarify', meaning: '把含糊之处讲清楚', collocations: ['clarify a point', 'clarify requirements', 'clarify the meaning'], example: 'Public guidance should clarify which households can apply for help with heating costs.', note: '重点是消除不明确或容易误解之处，例如解释要求、界定问题或说明立场。' },
      { word: 'illustrate', meaning: '用实例或图示说明', collocations: ['illustrate a point', 'illustrate a process', 'illustrate a difference'], example: 'A simple diagram can illustrate how water moves through the different stages of the system.', note: '常通过例子、图表或具体情景使抽象内容更易理解；一个例子不一定足以证明普遍结论。' },
      { word: 'demonstrate', meaning: '清楚展示或用证据表明', collocations: ['demonstrate a skill', 'demonstrate effectiveness', 'demonstrate a link'], example: 'The trial should demonstrate whether the new method works under ordinary classroom conditions.', note: '可指演示技能或过程，也可指用证据清楚表明某事，语气通常比单纯举例更有证明意味。' },
    ],
    tip: 'interpret 关注如何理解，clarify 关注消除含糊，illustrate 关注举例或图示；使用 demonstrate 支持论点时，要有足够清楚的证据。',
  },
  {
    id: 'comprise-integrate',
    title: '构成与整合',
    subtitle: 'The whole, its parts, and their connections.',
    words: [
      { word: 'comprise', meaning: '整体由若干部分组成', collocations: ['comprise three sections', 'comprise several elements', 'comprise four stages'], example: 'The course will comprise three modules covering reading, writing and the use of evidence.', note: '在主动结构中，主语是整体，后面直接接组成部分：the course comprises three modules。' },
      { word: 'constitute', meaning: '若干部分构成整体', collocations: ['constitute the majority', 'constitute the basis', 'constitute a threat'], example: 'Public transport and cycling routes constitute an important part of a connected city.', note: '可表示部分合起来构成某个整体，也可表示“算作、构成”，例如构成威胁或理由。' },
      { word: 'incorporate', meaning: '把某部分纳入已有整体', collocations: ['incorporate feedback', 'incorporate new evidence', 'incorporate local materials'], example: 'Teachers can incorporate student feedback into the design of the next writing task.', note: '常用 incorporate X into Y，强调把信息、材料或想法加入已有方案，未必强调各部分协同。' },
      { word: 'integrate', meaning: '整合各部分使其协调运作', collocations: ['integrate services', 'integrate data', 'integrate technology into lessons'], example: 'Schools should integrate digital tools into lessons where they support clear learning goals.', note: '强调不同部分联系起来并作为整体运作，常用 integrate X into Y 或 integrate X with Y。' },
    ],
    tip: '整体 comprise 部分；部分 constitute 整体。incorporate X into Y 重在纳入，integrate X into Y 更强调协调配合，主语和方向都要看清。',
  },
  {
    id: 'adapt-alter',
    title: '调整与适应',
    subtitle: 'Change with a purpose in mind.',
    words: [
      { word: 'adapt', meaning: '为适应新条件而改变', collocations: ['adapt to change', 'adapt materials', 'adapt a strategy'], example: 'Teachers adapt their materials so that learners with different levels can follow the same lesson.', note: '可指自身适应新环境，用 adapt to；也可指改编材料以适合对象，用 adapt something for someone。' },
      { word: 'adjust', meaning: '调整至更合适的状态', collocations: ['adjust settings', 'adjust a schedule', 'adjust expectations'], example: 'Commuters may adjust their travel times to avoid the busiest services during the morning.', note: '常用于时间、设置、位置或预期的小幅调整，也可用 adjust to 表示逐渐适应。' },
      { word: 'modify', meaning: '修改既有设计或方法', collocations: ['modify a design', 'modify an approach', 'modify a plan'], example: 'Engineers modify the design after testing how the model performs in strong winds.', note: '通常保留原有事物的基本性质，只改变部分内容或做法，常见于设计、方案与行为。' },
      { word: 'alter', meaning: '使某物与原先不同', collocations: ['alter a route', 'alter a pattern', 'alter the balance'], example: 'Road closures can alter the route that buses take through the city centre.', note: '较宽泛地表示改变，变化大小取决于语境，本身不像 adapt 那样明确强调适应某种需要。' },
    ],
    tip: 'adapt to a new environment 是适应环境，adapt materials for beginners 是改编材料。adjust、modify、alter 都能表示改变，但不能仅按固定的“变化大小”排序。',
  },
  {
    id: 'constrain-regulate',
    title: '限制与调节',
    subtitle: 'A boundary, an obstacle, or a guiding rule.',
    words: [
      { word: 'constrain', meaning: '因条件或规则而限制', collocations: ['constrain choices', 'constrain development', 'constrain public spending'], example: 'Limited funding can constrain the range of services available to rural communities.', note: '强调可选空间或行动自由受限，限制常来自时间、资金、资源或规则。' },
      { word: 'inhibit', meaning: '抑制发展、活动或表达', collocations: ['inhibit growth', 'inhibit learning', 'inhibit creativity'], example: 'A fear of making mistakes can inhibit learning in a language classroom.', note: '可用于过程受到抑制，也可用于心理因素使人不愿表达或行动，不一定是外在障碍。' },
      { word: 'impede', meaning: '阻碍前进或使进展变慢', collocations: ['impede progress', 'impede traffic', 'impede recovery'], example: 'Missing information can impede progress when several teams are working on the same project.', note: '侧重阻碍运动、发展或某项工作的推进，常与具体障碍导致的延误相关。' },
      { word: 'regulate', meaning: '按规则控制或调节', collocations: ['regulate temperature', 'regulate traffic', 'regulate financial markets'], example: 'Local authorities regulate traffic near schools to make crossings safer for children.', note: '强调通过规则或调节使活动有序、状态适当，既可用于管理，也可用于系统自动调节。' },
    ],
    tip: 'constrain 常指条件设限，inhibit 侧重抑制，impede 侧重阻碍进展；regulate 是规范或调节，不等于完全禁止。它们只在部分语境中含义接近。',
  },
  {
    id: 'preserve-maintain',
    title: '保护与保持',
    subtitle: 'Keep what matters, in the way it needs.',
    words: [
      { word: 'preserve', meaning: '保护原有事物免遭损坏', collocations: ['preserve cultural heritage', 'preserve old buildings', 'preserve original features'], example: 'Digital records can help preserve local stories when the people who remember them move away.', note: '常强调让有价值的原貌、传统或记录免于损坏、流失与改变。' },
      { word: 'conserve', meaning: '节约或保护有限资源', collocations: ['conserve water', 'conserve energy', 'conserve natural habitats'], example: 'Households can conserve water by repairing leaks and collecting rain for their gardens.', note: '用于水、能源等资源时强调避免浪费；也用于保护自然环境、物种及其栖息地。' },
      { word: 'retain', meaning: '继续拥有或记住', collocations: ['retain information', 'retain skilled staff', 'retain key features'], example: 'Regular recall practice can help learners retain information for longer than passive reading alone.', note: '强调某物没有丢失、被替换或离开，常见于记忆、人员和特征，不一定涉及主动维护。' },
      { word: 'maintain', meaning: '维持状态、标准或正常运作', collocations: ['maintain standards', 'maintain equipment', 'maintain a balance'], example: 'Train operators must maintain their equipment to keep services safe and reliable.', note: '常强调持续采取措施维持某种水平或状态，也可指保养设备，避免功能下降。' },
    ],
    tip: '保护文化遗产常用 preserve，节水节能常用 conserve，留住员工或信息用 retain，维持标准与保养设备用 maintain。不要只用一个中文“保持”覆盖所有对象。',
  },
  {
    id: 'identify-distinguish',
    title: '发现与识别',
    subtitle: 'Notice it, name it, and tell it apart.',
    words: [
      { word: 'identify', meaning: '确定身份、原因或具体问题', collocations: ['identify a problem', 'identify the cause', 'identify a pattern'], example: 'The survey will identify the main problems that residents face when using public transport.', note: '重在确认是什么、是谁或是哪一种问题，通常比单纯注意到其存在更具体。' },
      { word: 'detect', meaning: '察觉不易发现的信号或变化', collocations: ['detect a signal', 'detect a change', 'detect an error'], example: 'Simple sensors can detect small changes in water levels before they are easily visible.', note: '常表示借助观察或设备发现隐蔽、微小或不明显的事物，未必已经确定其完整原因。' },
      { word: 'perceive', meaning: '感知或以某种方式看待', collocations: ['perceive a risk', 'perceive a difference', 'perceive a threat'], example: 'Residents may perceive the same change differently because their daily travel needs are not alike.', note: '可指感官察觉，也可指主观理解或评价；perceive something as 强调把某物看作什么。' },
      { word: 'distinguish', meaning: '分辨不同事物的差别', collocations: ['distinguish between options', 'distinguish fact from opinion', 'distinguish one species from another'], example: 'Careful readers distinguish facts from opinions by checking the evidence behind each claim.', note: '常用 distinguish X from Y，或 distinguish between X and Y，强调区分容易混淆的对象。' },
    ],
    tip: 'detect 常是发现“有变化”，identify 是进一步确定“是什么”；perceive 可以包含个人看法，distinguish 则强调分辨两者的不同。',
  },
  {
    id: 'create-formulate',
    title: '创造与建立',
    subtitle: 'From a new idea to a working system.',
    words: [
      { word: 'create', meaning: '创造或使新事物出现', collocations: ['create opportunities', 'create jobs', 'create a website'], example: 'Public libraries can create opportunities for people from different backgrounds to learn together.', note: '使用范围广，强调原本没有的事物或情况出现，可用于作品、机会、岗位，也可用于问题。' },
      { word: 'generate', meaning: '通过过程产生某种输出', collocations: ['generate electricity', 'generate interest', 'generate data'], example: 'Simple classroom surveys generate data that students can use to practise reading charts.', note: '常突出某个过程产生电力、收入、数据、兴趣等结果，不一定涉及有意识的创作。' },
      { word: 'establish', meaning: '建立体系、机构或联系', collocations: ['establish a link', 'establish a system', 'establish a business'], example: "A local council can establish a clear system for responding to residents' complaints.", note: '常指建立能够持续存在的机构、规则或体系；在研究中还可表示查明、确立某个事实或联系。' },
      { word: 'formulate', meaning: '系统拟定并表达想法或方案', collocations: ['formulate a policy', 'formulate a hypothesis', 'formulate a plan'], example: 'Researchers formulate a hypothesis before deciding which observations could support or challenge it.', note: '较正式，强调经过思考，清楚而系统地提出政策、假设、计划或论点，不用于发电等物理产出。' },
    ],
    tip: 'create 强调新事物出现，generate 强调过程产生的输出，establish 强调建立或确立，formulate 强调把方案或想法组织、表达清楚。',
  },
  {
    id: 'collaborate-participate',
    title: '合作与参与',
    subtitle: 'Work together, organise, or take part.',
    words: [
      { word: 'collaborate', meaning: '共同开展工作或创作', collocations: ['collaborate with researchers', 'collaborate on a project', 'collaborate across departments'], example: 'Teachers collaborate with local artists to design projects that connect reading with creative work.', note: '强调一起完成某项工作、研究或创作，常用 collaborate with someone on something。' },
      { word: 'cooperate', meaning: '相互配合或给予协助', collocations: ['cooperate closely', 'cooperate with staff', 'cooperate on safety'], example: 'Passengers should cooperate with station staff when services are delayed or platforms become crowded.', note: '可指为共同目标合作，也可指配合要求或提供协助，不一定是共同设计或创作。' },
      { word: 'coordinate', meaning: '统筹安排使各方相互配合', collocations: ['coordinate transport', 'coordinate services', 'coordinate a response'], example: 'Schools coordinate their schedules so that shared facilities are available when classes need them.', note: '重在协调时间、任务、资源或多方行动；通常可直接接被协调的对象，也可用 coordinate with。' },
      { word: 'participate', meaning: '参加活动或参与过程', collocations: ['participate in discussions', 'participate in research', 'participate in community activities'], example: 'Students who participate in class discussions can practise explaining ideas and responding to different views.', note: '强调参与某项活动，不必负责统筹或共同创作；动词后接活动时用 participate in。' },
    ],
    tip: '共同完成项目可用 collaborate on a project；配合人员用 cooperate with staff；统筹工作用 coordinate tasks；参加项目用 participate in a project，不写 participate a project。',
  },
];
