import type { ParaphraseGroup } from './types';

// Original examples and usage notes. Each comparison keeps the sense taught by
// the existing vocabulary card, including its grammatical patterns.
export const extendedActionGroups: ParaphraseGroup[] = [
  {
    id: 'action-analysis', title: '分析与探查', subtitle: 'Look into a question from different directions.',
    words: [
      { word: 'analyse', meaning: '拆解材料以理解结构或原因', collocations: ['analyse data', 'analyse results', 'analyse a problem'], example: 'Students analyse the survey results to understand why travel habits vary between neighbourhoods.', note: '强调仔细研究组成部分、关系或原因，常以数据、结果和问题为对象；不一定涉及到现场调查。' },
      { word: 'investigate', meaning: '调查事实、原因或疑点', collocations: ['investigate a complaint', 'investigate the cause', 'investigate a problem'], example: 'The council will investigate the complaints before deciding whether the bus route needs changing.', note: '重点是查清事实或原因，常从一个问题、投诉或待解释的现象出发，与 analyse 的分析过程可以结合。' },
      { word: 'explore', meaning: '开放地探索可能性或未知领域', collocations: ['explore options', 'explore an idea', 'explore an area'], example: 'Researchers explore several possible explanations before choosing which one to test in detail.', note: '常带有尚未确定方向、考察多种可能的意味，也可指实地探索某个地区。' },
      { word: 'inspect', meaning: '仔细检查具体状况', collocations: ['inspect a building', 'inspect a vehicle', 'inspect the equipment'], example: 'Trained staff inspect the equipment each morning before the first group of visitors arrives.', note: '常用于实物、场所、设备的状态检查，目的通常较明确，不能普遍替换 explore ideas。' },
    ],
    tip: 'analyse data 是分析材料，investigate a problem 是查清问题，explore options 是探索选择，inspect equipment 是检查状况；研究过程可以依次包含这些动作。',
  },
  {
    id: 'action-confirmation', title: '确认与查明', subtitle: 'From a possible fact to a clear finding.',
    words: [
      { word: 'confirm', meaning: '证实已有信息或判断', collocations: ['confirm a finding', 'confirm the details', 'confirm a booking'], example: 'A second set of measurements can confirm whether the first reading was accurate.', note: '常对已经提出、收到或初步认为真实的内容进一步确认，也常用于确认安排与预订。' },
      { word: 'ascertain', meaning: '设法查明并确定事实', collocations: ['ascertain the cause', 'ascertain the facts', 'ascertain the extent'], example: 'Investigators need to ascertain the cause of the fault before recommending any permanent changes.', note: '较正式，强调通过询问、调查等方式查明；常见 ascertain whether、how 或具体事实。' },
      { word: 'determine', meaning: '通过调查或推理确定', collocations: ['determine the cause', 'determine the outcome', 'determine the extent'], example: 'The final tests should determine whether the material is suitable for outdoor use.', note: '可表示查明事实，也可表示某因素决定结果；具体含义要看主语和宾语。' },
      { word: 'identify', meaning: '确定具体身份、对象或问题', collocations: ['identify the source', 'identify a problem', 'identify a species'], example: 'A careful comparison of the samples can identify the source of the contamination.', note: '常把“是什么、是谁、哪一种”确定下来；identify the source 比单纯说明存在问题更具体。' },
    ],
    tip: '已有初步结果时可 confirm a finding；要查清某个事实可 ascertain 或 determine；要明确是哪一个来源、对象或问题时常用 identify。',
  },
  {
    id: 'action-justification', title: '论证与证实', subtitle: 'Reasons, evidence, and a clear position.',
    words: [
      { word: 'argue', meaning: '提出理由支持某个观点', collocations: ['argue that', 'argue for a policy', 'argue against a proposal'], example: 'Some researchers argue that access to reliable transport should receive more public funding.', note: '在学术写作中常表示有理由地主张，不一定是争吵；argue that 后接完整分句。' },
      { word: 'justify', meaning: '说明某做法合理或有依据', collocations: ['justify a decision', 'justify the cost', 'justify an intervention'], example: 'The expected benefits must justify the cost of replacing the entire heating system.', note: '强调提供充分理由，使一项决定、支出或行动显得合理；并非只把事实描述一遍。' },
      { word: 'demonstrate', meaning: '清楚展示或用证据说明', collocations: ['demonstrate effectiveness', 'demonstrate a relationship', 'demonstrate a skill'], example: 'The comparison can demonstrate how the same policy affects households with different incomes.', note: '可用证据、实例或演示清楚说明某事；论证时应让证据强度与结论强度相配。' },
      { word: 'affirm', meaning: '明确肯定或确认某事', collocations: ['affirm a commitment', 'affirm a belief', 'affirm the importance'], example: 'School leaders should affirm their commitment to equal access through clear and consistent decisions.', note: '较正式，突出明确而肯定地表态；affirm a belief 不等于已经用数据证明信念正确。' },
    ],
    tip: 'argue 给出主张与理由，justify 说明行动为何合理，demonstrate 清楚展示依据，affirm 明确肯定。不要把坚定表态直接写成实证证明。',
  },
  {
    id: 'action-proposal', title: '提议与表态', subtitle: 'Suggest a plan, support it, or state it firmly.',
    words: [
      { word: 'propose', meaning: '提出供他人考虑的方案', collocations: ['propose a solution', 'propose a change', 'propose a new system'], example: 'The student committee will propose a new system for booking shared study rooms.', note: '重点是把想法、计划或改变提出来考虑；常用 propose doing 或 propose that，不等于方案已经获批。' },
      { word: 'advocate', meaning: '公开支持或提倡某种做法', collocations: ['advocate reform', 'advocate investment', 'advocate a balanced approach'], example: 'Many planners advocate investment in public transport rather than further expansion of city roads.', note: '强调主动支持、推荐一项政策或立场；动词后可直接接名词或动名词。' },
      { word: 'assert', meaning: '坚定地声称某事为真', collocations: ['assert that', 'assert a claim', 'assert a position'], example: 'Writers should not simply assert that a policy works without explaining the supporting evidence.', note: '突出有把握地陈述，但句子是否有充分证据仍需另看；assert that 后接分句。' },
      { word: 'declare', meaning: '明确或正式地宣布', collocations: ['declare an intention', 'declare a result', 'declare support'], example: 'Local organisations can declare their support for the project at the public meeting.', note: '常有公开、正式或强调的语气，适合宣布立场、意图或结果，不只是私下提出一个想法。' },
    ],
    tip: '提出新方案用 propose，公开提倡用 advocate，坚定声称用 assert，正式宣布用 declare；propose a plan 不表示已经 declare a decision。',
  },
  {
    id: 'action-inference', title: '假设与推断', subtitle: 'Separate what you assume from what you infer.',
    words: [
      { word: 'assume', meaning: '暂时把某事当作真实', collocations: ['assume that', 'assume a constant rate', 'assume equal access'], example: 'The model will assume a constant rate of growth to keep the first calculation simple.', note: '不一定已得到验证，常是推理或模型的起点；应说明假设，而不是把它当作观察结果。' },
      { word: 'infer', meaning: '根据线索推知未直接说明的事', collocations: ['infer meaning', 'infer from evidence', 'infer a relationship'], example: 'Readers can infer the writer’s attitude from the examples chosen to support the argument.', note: '根据证据或线索得到未明说的含义；是读者或研究者在推断，不是材料自己在推断。' },
      { word: 'deduce', meaning: '从已知事实作逻辑推论', collocations: ['deduce a conclusion', 'deduce from the data', 'deduce the cause'], example: 'From these measurements, researchers can deduce how far the material expanded during heating.', note: '突出根据已知事实、规则或数据推导，常用 deduce something from something。' },
      { word: 'conclude', meaning: '考虑信息后得出判断', collocations: ['conclude that', 'conclude from the findings', 'conclude with certainty'], example: 'The team cannot conclude that the treatment worked without comparing the two groups carefully.', note: '强调形成最终或阶段性判断，结论也可能带有不确定性；不能省略论据与适用范围。' },
    ],
    tip: 'assume 是把前提暂时视为真，infer 是由线索推知，deduce 突出逻辑推导，conclude 是得出判断。材料暗示用 imply，读者推断用 infer。',
  },
  {
    id: 'action-organisation', title: '筹备与组织', subtitle: 'Make things ready and bring the parts together.',
    words: [
      { word: 'prepare', meaning: '使人或事物做好准备', collocations: ['prepare materials', 'prepare a report', 'prepare for a meeting'], example: 'Volunteers prepare the materials before the first group arrives for the reading workshop.', note: '强调达到能够开展活动的状态；prepare something 是准备某物，prepare for something 是为某事做准备。' },
      { word: 'coordinate', meaning: '协调多方行动和安排', collocations: ['coordinate schedules', 'coordinate services', 'coordinate a response'], example: 'The schools coordinate their schedules so that all classes can use the shared laboratory.', note: '使时间、资源、人员或活动相互配合，不一定表示负责每一项工作的实际执行。' },
      { word: 'assemble', meaning: '把人员或部件集合起来', collocations: ['assemble a team', 'assemble equipment', 'assemble the parts'], example: 'Project leaders assemble a team with the skills needed to inspect the old building.', note: '既可把人召集成团队，也可把部件组装成整体；比泛泛的“安排”更具体。' },
      { word: 'convene', meaning: '召集或召开会议', collocations: ['convene a meeting', 'convene a panel', 'convene a committee'], example: 'The council will convene a meeting to discuss how the new service should operate.', note: '较正式，常以会议、委员会或讨论小组为对象；也可不及物，表示这些人开会。' },
    ],
    tip: '准备材料是 prepare，协调时间是 coordinate，组建团队是 assemble，召集会议是 convene。不要把 convene 用于准备普通文件或物品。',
  },
  {
    id: 'action-implementation', title: '采用与执行', subtitle: 'Choose an approach, use it, and make it work.',
    words: [
      { word: 'adopt', meaning: '选择并开始使用一种做法', collocations: ['adopt a policy', 'adopt an approach', 'adopt a method'], example: 'Several schools plan to adopt a reading programme that allows learners to choose their books.', note: '强调接受并开始使用某种方法、政策或习惯，与“把计划实际落实”的 implement 侧重点不同。' },
      { word: 'implement', meaning: '把计划或决定落实到实践', collocations: ['implement a policy', 'implement a plan', 'implement changes'], example: 'Managers need enough time and funding to implement the changes agreed at the meeting.', note: '强调执行已经提出或决定的政策、计划与改变，常涉及具体人员、资源和步骤。' },
      { word: 'apply', meaning: '把知识、方法或规则用于实际', collocations: ['apply knowledge', 'apply a method', 'apply a rule'], example: 'Students apply their knowledge of statistics when they interpret results from a local survey.', note: '此处表示将知识、方法或规则用于实际，常用 apply something to something；apply for a job 则表示申请。' },
      { word: 'enforce', meaning: '确保法规或规定得到遵守', collocations: ['enforce a law', 'enforce regulations', 'enforce a rule'], example: 'Authorities must enforce the rules fairly if residents are to trust the new parking system.', note: '重点是使已有规则被遵守，常带有监督、约束或强制性质，不泛指实施一切计划。' },
    ],
    tip: 'adopt a policy 是采用，implement a policy 是落实，apply a rule 是把规则用于具体情况，enforce a rule 是确保大家遵守。',
  },
  {
    id: 'action-allocation', title: '分配与指定', subtitle: 'Resources, tasks, and particular roles.',
    words: [
      { word: 'allocate', meaning: '为某用途分配有限资源', collocations: ['allocate funds', 'allocate time', 'allocate resources'], example: 'Schools should allocate enough time for students to revise their work after receiving feedback.', note: '常用于时间、资金、资源等，突出把有限总量分给不同用途或对象。' },
      { word: 'distribute', meaning: '把物品或资源分发给各处', collocations: ['distribute materials', 'distribute supplies', 'distribute information'], example: 'Local volunteers distribute the information sheets to households that cannot access the online service.', note: '重在物品或信息从一个来源送到多个人或地点，未必强调如何决定分配比例。' },
      { word: 'assign', meaning: '把任务或角色交给特定对象', collocations: ['assign a task', 'assign a role', 'assign responsibility'], example: 'Team leaders assign each volunteer a clear task before the community event begins.', note: '常以工作、角色、责任为宾语，可用 assign someone something 或 assign something to someone。' },
      { word: 'designate', meaning: '正式指定身份、用途或对象', collocations: ['designate a representative', 'designate an area', 'designate a site'], example: 'The council may designate part of the site as a public space for local residents.', note: '较正式，强调选定或正式标明某人、某处的角色或用途，常见 designate something as something。' },
    ],
    tip: 'allocate funds 关心资源安排，distribute materials 关心送达，assign tasks 关心谁做什么，designate an area as a park 则关心正式用途。',
  },
  {
    id: 'action-resolution', title: '解决与克服', subtitle: 'An answer, an agreement, or a way past difficulty.',
    words: [
      { word: 'solve', meaning: '找到问题的答案或办法', collocations: ['solve a problem', 'solve an equation', 'solve a puzzle'], example: 'A larger budget alone may not solve the problem of unequal access to public services.', note: '常用于有待找到答案或解决办法的问题，也用于方程、谜题等。' },
      { word: 'resolve', meaning: '使困难或分歧得到解决', collocations: ['resolve a dispute', 'resolve a conflict', 'resolve a difficulty'], example: 'The two organisations hope to resolve their disagreement before the next stage of the project.', note: '常用于争执、分歧及需要处理的复杂情况，突出使悬而未决的问题得到处理。' },
      { word: 'reconcile', meaning: '调和冲突的利益、意见或说法', collocations: ['reconcile differences', 'reconcile competing interests', 'reconcile conflicting accounts'], example: 'Planners must reconcile the need for new homes with the wish to protect green spaces.', note: '使两种看似冲突的需要、观点或材料相容，常用 reconcile X with Y，不等于把其中一方消除。' },
      { word: 'overcome', meaning: '成功克服阻碍或困难', collocations: ['overcome obstacles', 'overcome difficulties', 'overcome a barrier'], example: 'Targeted support can help adult learners overcome the barriers that prevent them from returning to study.', note: '突出面对障碍后成功越过它，而不是简单指出问题或提出一个尚未实施的办法。' },
    ],
    tip: 'solve 找到办法，resolve 处理分歧，reconcile 使冲突的需要相容，overcome 强调克服阻碍；reconcile X with Y 的介词和对象都不能省略考虑。',
  },
  {
    id: 'action-acceptance', title: '接受与配合', subtitle: 'Recognition, permission, enthusiasm, or compliance.',
    words: [
      { word: 'acknowledge', meaning: '承认事实或认可其存在', collocations: ['acknowledge a problem', 'acknowledge a limitation', 'acknowledge the contribution'], example: 'Researchers should acknowledge the limitations of a small sample when they present their conclusions.', note: '重点是承认某事真实或值得认可，acknowledge a problem 不表示同意、喜欢或已经解决它。' },
      { word: 'consent', meaning: '同意或准许某事发生', collocations: ['consent to participate', 'consent to a proposal', 'consent to the changes'], example: 'Participants must consent to the use of their information before the interviews begin.', note: '通常用 consent to，其中 to 后可接名词或动名词；强调给出同意，而不是承认一项事实。' },
      { word: 'embrace', meaning: '积极欢迎或接受新做法', collocations: ['embrace change', 'embrace an opportunity', 'embrace a new approach'], example: 'Schools can embrace new technology while still protecting time for discussion and independent reading.', note: '此处是热情接受观点、变化或机会的比喻义，比简单同意更积极，不教拥抱人的身体动作义。' },
      { word: 'comply', meaning: '遵从规则、要求或指示', collocations: ['comply with regulations', 'comply with requirements', 'comply with instructions'], example: 'All contractors must comply with the safety requirements before they begin work on the site.', note: '常用 comply with，强调实际行为符合要求，不表示内心赞同或热情支持。' },
    ],
    tip: 'acknowledge 事实，consent to 安排，embrace 变化，comply with 规则；承认问题、同意计划和照章办事是不同动作。',
  },
  {
    id: 'action-opposition', title: '反对与否认', subtitle: 'Reject a claim, an idea, or the proposed action.',
    words: [
      { word: 'oppose', meaning: '反对某项安排或主张', collocations: ['oppose a proposal', 'oppose a policy', 'oppose a change'], example: 'Some residents oppose the proposal because they believe it would increase traffic near the school.', note: '重点是立场上反对，可直接接名词或动名词；不是 oppose to，形容词结构才常见 be opposed to。' },
      { word: 'deny', meaning: '否认某事真实或发生过', collocations: ['deny a claim', 'deny responsibility', 'deny an allegation'], example: 'The organisers deny that any personal information was shared with companies outside the project.', note: '此处是否认事实的义项，可用 deny that 或 deny doing；不是泛指拒绝任何请求。' },
      { word: 'dismiss', meaning: '认为不值得考虑而驳回', collocations: ['dismiss a suggestion', 'dismiss an argument', 'dismiss a concern'], example: 'Decision makers should not dismiss local concerns simply because few people attended the meeting.', note: '常含不接受或不再认真考虑的态度，未必已经提供证据证明某项主张错误。' },
      { word: 'contradict', meaning: '说法或证据与另一方相矛盾', collocations: ['contradict a statement', 'contradict the evidence', 'contradict an assumption'], example: 'Later measurements may contradict the assumption that all parts of the site remain equally dry.', note: '可以是人反驳说法，也可以是证据或事实彼此不一致；矛盾关系不等于情绪上的反对。' },
    ],
    tip: 'oppose a policy 是反对采取某政策，deny a claim 是否认其真实，dismiss 是不予接受或考虑，contradict 则指出内容或证据不相容。',
  },
  {
    id: 'action-depiction', title: '描绘与代表', subtitle: 'An image, a description, or a representative role.',
    words: [
      { word: 'depict', meaning: '用文字或图像描绘', collocations: ['depict everyday life', 'depict a scene', 'depict a landscape'], example: 'The photographs depict everyday life in neighbourhoods that have changed rapidly over the past decade.', note: '常用于图画、照片、文字对人物、场景或生活的呈现，较正式。' },
      { word: 'portray', meaning: '以某种方式刻画或描写', collocations: ['portray a character', 'portray a community', 'portray someone as'], example: 'News reports can portray the same community differently by choosing which stories to include.', note: '突出被呈现出的形象或角度，常用 portray X as Y；不保证这种刻画完全客观。' },
      { word: 'represent', meaning: '代表、代言或以某形式呈现', collocations: ['represent a group', 'represent local interests', 'represent information visually'], example: 'The committee should include people who can represent the interests of younger residents.', note: '本词还可用于图示等表示关系；此句是为群体代表利益，不能直接换成描绘图像的 depict。' },
      { word: 'characterize', meaning: '描述或体现典型特征', collocations: ['characterize a system', 'characterize a process', 'characterize an approach'], example: 'Researchers characterize the process by describing the stages that occur under different conditions.', note: '强调某人、某物或过程的典型性质；常见 characterize X as Y 或 be characterized by。' },
    ],
    tip: 'depict 看如何描绘，portray 看塑造了怎样的形象，represent 可以是为谁代言，characterize 则突出典型特征；不能把所有 represent 都理解成“画出来”。',
  },
  {
    id: 'action-comparison', title: '比较与区分', subtitle: 'Similarity is a relationship, comparison is an action.',
    words: [
      { word: 'compare', meaning: '比较相似点与不同点', collocations: ['compare results', 'compare the options', 'compare costs'], example: 'Students compare the two reports to see how different methods can produce different conclusions.', note: '表示主动进行比较；compare X with Y 常用于同时考察相似与差异，不只等于找不同。' },
      { word: 'differ', meaning: '在某方面存在差异', collocations: ['differ from each other', 'differ in size', 'differ significantly'], example: 'The two neighbourhoods differ in the types of public transport available to residents.', note: '通常不及物，用 differ from 或 differ in；描述差异本身，不表示某人正在执行区分操作。' },
      { word: 'differentiate', meaning: '辨别差异或使事物有区别', collocations: ['differentiate between groups', 'differentiate the options', 'differentiate one product from another'], example: 'Clear labels help readers differentiate between observed facts and the writer’s personal interpretation.', note: '可用 differentiate between X and Y，也可用 differentiate X from Y；还可指使产品等形成差异。' },
      { word: 'resemble', meaning: '在外观或特征上相似', collocations: ['resemble the original', 'resemble each other', 'resemble a pattern'], example: 'The new building will resemble the older houses in its height and use of local materials.', note: '直接接相似对象，不用 resemble to；它表示相像关系，不能替换比较动作 compare。' },
    ],
    tip: 'compare 是做比较，differ 是存在不同，differentiate 是辨别或形成差异，resemble 是相像。注意 differ from、differentiate between，以及 resemble 直接接宾语。',
  },
  {
    id: 'action-causation', title: '引发与促成', subtitle: 'A reaction, a contribution, or a necessary consequence.',
    words: [
      { word: 'induce', meaning: '引起某种状态或反应', collocations: ['induce a change', 'induce a response', 'induce stress'], example: 'A sudden change in the timetable can induce stress among people who rely on regular travel.', note: '常以变化、反应或状态为宾语，语气较正式；不表示这种影响一定有益或经过主观同意。' },
      { word: 'elicit', meaning: '引出回应、感受或信息', collocations: ['elicit a response', 'elicit information', 'elicit feedback'], example: 'Open questions can elicit more detailed responses than questions that allow only a single answer.', note: '突出通过提问、刺激或行动把已有的回应、情感或信息引出来，不泛指生产所有物品。' },
      { word: 'necessitate', meaning: '使某项措施变得必要', collocations: ['necessitate a change', 'necessitate further research', 'necessitate additional funding'], example: 'Unexpected damage may necessitate further repairs before the building can reopen to the public.', note: '较正式，表示情况使某行动成为必要，常接名词或动名词，不等同于该行动已经发生。' },
      { word: 'contribute', meaning: '与其他因素共同促成', collocations: ['contribute to growth', 'contribute to a problem', 'contribute resources'], example: 'Poor connections between bus routes can contribute to longer journeys for people travelling across the city.', note: '表示促成结果时常用 contribute to，通常暗示只是其中一个因素；也可指投入时间、资金等。' },
    ],
    tip: 'induce 引起状态，elicit 引出回应，necessitate 使行动有必要，contribute to 表示共同促成。不要把 contribute 当作“唯一造成”的证据。',
  },
  {
    id: 'action-influence', title: '影响与引导', subtitle: 'Influence can change a direction or dominate it.',
    words: [
      { word: 'affect', meaning: '使人或事物发生变化', collocations: ['affect performance', 'affect access', 'affect the outcome'], example: 'The location of a new station can affect how easily residents reach jobs and public services.', note: '范围较广，可表示正面或负面影响，具体方向和大小由语境说明；动词拼写与名词 effect 不同。' },
      { word: 'exert', meaning: '施加力量、影响或努力', collocations: ['exert influence', 'exert pressure', 'exert control'], example: 'Large employers can exert considerable influence on how transport services develop in a region.', note: '常与 influence、pressure、control 等宾语搭配，表示把力量或作用施加到外部，不单独等于“改变”。' },
      { word: 'dominate', meaning: '拥有压倒性的影响或地位', collocations: ['dominate a market', 'dominate the discussion', 'dominate an industry'], example: 'A few large firms can dominate the market even when many smaller suppliers remain active.', note: '强调相对其他人或因素占优势，强于中性的 affect；也可用于话题占据讨论的大部分。' },
      { word: 'steer', meaning: '引导方向或行动路线', collocations: ['steer a discussion', 'steer a project', 'steer away from danger'], example: 'Clear learning goals can steer a classroom discussion towards the evidence rather than personal assumptions.', note: '可指控制车辆方向，也可比喻引导讨论、项目或行动，常用 steer towards 或 steer away from。' },
    ],
    tip: 'affect 是产生影响，exert influence 强调施加作用，dominate 强调占据主导，steer 强调引导方向；影响存在并不自动说明某一方完全控制结果。',
  },
  {
    id: 'action-expansion', title: '增长与扩展', subtitle: 'More space, greater reach, or gradual accumulation.',
    words: [
      { word: 'expand', meaning: '扩大规模、范围或数量', collocations: ['expand services', 'expand capacity', 'expand the network'], example: 'The university plans to expand its evening courses for people who work during the day.', note: '可及物，也可不及物，常用于规模、业务、范围与容量变大，不一定沿着某个方向延长。' },
      { word: 'extend', meaning: '延长时间或扩大覆盖距离', collocations: ['extend a deadline', 'extend a route', 'extend opening hours'], example: 'Libraries can extend their opening hours to give more people access after work.', note: '常强调在时间、长度或覆盖范围上延伸，也可用于提供支持；extend a deadline 不宜换成 accumulate。' },
      { word: 'augment', meaning: '通过增加内容使其更大或更强', collocations: ['augment income', 'augment resources', 'augment capacity'], example: 'Community donations can augment the resources available for maintaining the local reading centre.', note: '较正式，常指在既有数量、能力或资源上再添加一些，强调补充带来的增加。' },
      { word: 'accumulate', meaning: '随着时间逐渐积累', collocations: ['accumulate knowledge', 'accumulate wealth', 'accumulate evidence'], example: 'Students accumulate knowledge through repeated practice and by connecting new ideas with earlier learning.', note: '强调逐步积聚的过程，可及物或不及物；既可用于知识、资金，也可用于垃圾或债务等。' },
    ],
    tip: 'expand services 扩大服务，extend hours 延长时间，augment resources 增添资源，accumulate knowledge 逐步积累。写“增长”时先明确增加的维度与过程。',
  },
  {
    id: 'action-decline', title: '下降与退化', subtitle: 'Less in quantity, worse in quality, or farther away.',
    words: [
      { word: 'decline', meaning: '数量、程度或实力下降', collocations: ['decline in number', 'decline steadily', 'decline sharply'], example: 'Demand may decline when a service becomes less reliable or more expensive to use.', note: '此处是不及物的下降义，常用 decline in 或用副词描述速度；不是礼貌拒绝邀请的另一个义项。' },
      { word: 'diminish', meaning: '变小或削弱其重要性', collocations: ['diminish in importance', 'diminish confidence', 'diminish over time'], example: 'Public confidence can diminish when promised improvements repeatedly fail to appear in daily life.', note: '可及物或不及物，常用于信心、重要性、数量或强度逐渐变小，与 decline 有部分重叠。' },
      { word: 'deteriorate', meaning: '状态或质量变得更差', collocations: ['deteriorate rapidly', 'deteriorate in quality', 'deteriorate over time'], example: 'Road surfaces can deteriorate rapidly when small faults are left without regular maintenance.', note: '重点是变坏，不单纯是数值变小；质量下降可用 deteriorate，不能据此表达价格下降就是坏事。' },
      { word: 'recede', meaning: '退去、减弱或变得不明显', collocations: ['recede into the distance', 'recede gradually', 'recede from view'], example: 'As the floodwaters recede, inspectors can assess which parts of the road need repair.', note: '常指水位、物体或某种影响向后退、离开视野或减弱，包含退去的过程。' },
    ],
    tip: 'decline 看数量或程度，diminish 看减少或削弱，deteriorate 看质量变坏，recede 常带退去的方向感。价格降低与设备损坏不能只用一个“下降”概括。',
  },
  {
    id: 'action-removal', title: '移除与废止', subtitle: 'Remove a problem, leave something out, or end a rule.',
    words: [
      { word: 'eliminate', meaning: '彻底消除某物或问题', collocations: ['eliminate errors', 'eliminate waste', 'eliminate a barrier'], example: 'Clear instructions can reduce mistakes, although they may not eliminate every possible source of confusion.', note: '通常比 reduce 更彻底，表达完全去除时应有足够依据；不表示只减轻程度。' },
      { word: 'exclude', meaning: '不纳入或阻止进入', collocations: ['exclude a group', 'exclude irrelevant data', 'exclude a possibility'], example: 'Researchers should explain why they exclude some responses from the final analysis of the survey.', note: '强调不包括、排除在外或不予考虑，不表示被排除的对象本身已经消失。' },
      { word: 'discard', meaning: '丢弃不再需要的事物', collocations: ['discard packaging', 'discard old materials', 'discard an idea'], example: 'Households should separate recyclable materials before they discard the remaining waste from their homes.', note: '常用于不再需要或认为无用的物品，也可用于放弃想法；不专指正式取消法律制度。' },
      { word: 'abolish', meaning: '正式废除制度、法规或惯例', collocations: ['abolish a law', 'abolish a system', 'abolish a practice'], example: 'The committee may recommend that the council abolish a rule that no longer serves its purpose.', note: '通常用于法律、制度或正式安排的终止，不用于普通垃圾、旧物或一次数据筛选。' },
    ],
    tip: 'eliminate a problem 是消除，exclude data 是不纳入，discard materials 是丢弃，abolish a system 是废除；排除一条数据不等于消除其记录。',
  },
  {
    id: 'action-support', title: '支撑与巩固', subtitle: 'Support life, strengthen a structure, or uphold a principle.',
    words: [
      { word: 'sustain', meaning: '提供维持生活或存在的支持', collocations: ['sustain life', 'sustain a family', 'sustain local communities'], example: 'Access to clean water and reliable food supplies helps sustain communities during long periods of drought.', note: '强调通过食物、资源等必要支持维持生活或存在，常以生命、家庭或社区为对象。' },
      { word: 'reinforce', meaning: '通过增补支持使其更牢固', collocations: ['reinforce an argument', 'reinforce a structure', 'reinforce a message'], example: 'Additional examples can reinforce an argument when they provide relevant evidence rather than repeat the claim.', note: '常表示加上材料、证据或重复支持，使已有结构、信息或论点更强，不一定从无到有。' },
      { word: 'strengthen', meaning: '增强力量、能力或效果', collocations: ['strengthen an economy', 'strengthen a relationship', 'strengthen an argument'], example: 'Regular feedback can strengthen the relationship between classroom practice and the goals of the course.', note: '范围较广，可用于关系、能力、经济与论据等，比 reinforce 更少强调通过额外一层支持来加固。' },
      { word: 'uphold', meaning: '维护或支持原则与权利', collocations: ['uphold principles', 'uphold rights', 'uphold values'], example: 'Public institutions should uphold the principle that essential services remain accessible to all residents.', note: '常用于维护原则、权利与价值，带有坚守的意味；与 reinforce a structure 所表示的实物加固不同。' },
    ],
    tip: 'sustain life 重在必要支持，reinforce 重在加固已有内容，strengthen 是增强，uphold principles 是维护原则；保护权利不等于给一座建筑加固。',
  },
  {
    id: 'action-conversion', title: '转换与转移', subtitle: 'A different form, a new place, or a new system.',
    words: [
      { word: 'transform', meaning: '使形态或性质发生重大改变', collocations: ['transform an area', 'transform a system', 'transform the experience'], example: 'A reliable rail connection can transform access to education and employment in a remote area.', note: '突出较大或明显的改变，可用于外观、性质或体验，不只是把同一物品搬到别处。' },
      { word: 'convert', meaning: '改成另一种形式或用途', collocations: ['convert a building', 'convert energy', 'convert information into data'], example: 'The council plans to convert the unused station into a shared space for local groups.', note: '常用 convert X into Y，说明具体从哪种形式或用途变成哪一种。' },
      { word: 'migrate', meaning: '由一个地区或位置迁往另一处', collocations: ['migrate seasonally', 'migrate between regions', 'migrate to warmer areas'], example: 'Some birds migrate between regions as the supply of food changes with the seasons.', note: '常用于人或动物迁移，也可用于其他逐步或有规律的位置变化；这里采用自然迁移语境。' },
      { word: 'transfer', meaning: '把人或事物移至另一地点或系统', collocations: ['transfer information', 'transfer funds', 'transfer to another site'], example: 'Staff can transfer the files to a shared system so that each department has access.', note: '侧重转移位置、归属或系统，原对象未必改变基本性质；transfer X to Y 常见。' },
    ],
    tip: 'transform 强调性质或体验大变，convert 强调改用途或形式，migrate 强调迁移，transfer 强调移交或转移。transfer a file 不必意味着内容被转换。',
  },
  {
    id: 'action-connection', title: '连接与互动', subtitle: 'Physical attachment, social ties, and mutual responses.',
    words: [
      { word: 'attach', meaning: '把一物固定或附到另一物上', collocations: ['attach a label', 'attach a document', 'attach a cable'], example: 'Applicants should attach the required document to the message before sending it to the office.', note: '强调一个对象附于另一个对象，常用 attach X to Y，也可用于文件与信息。' },
      { word: 'bind', meaning: '通过社会或情感纽带联结', collocations: ['bind people together', 'bind a community', 'bind a group together'], example: 'Shared experiences can bind a community together even when its members have different backgrounds.', note: '可用共同经历、价值或情感把群体联结起来。本句强调人与人的纽带，不是把物品固定在一起的动作。' },
      { word: 'correspond', meaning: '在特征或关系上相符、对应', collocations: ['correspond to a category', 'correspond with the findings', 'correspond closely'], example: 'The categories in the report should correspond to the definitions used during the original survey.', note: '此处是相符或对应义，常用 correspond to 或 correspond with；不是与某人通信的另一个义项。' },
      { word: 'interact', meaning: '相互沟通或作出回应', collocations: ['interact with peers', 'interact with visitors', 'interact regularly'], example: 'Shared public spaces give people more opportunities to interact with neighbours during their daily routines.', note: '强调双方之间的回应与交流；通常用 interact with，不表示单向地把文件附在邮件上。' },
    ],
    tip: 'attach X to Y 是附着，bind people together 是形成纽带，correspond to 是对应，interact with 是互动。先看宾语及介词，再判断是哪一种联系。',
  },
  {
    id: 'action-compensation', title: '缓解与弥补', subtitle: 'Reduce harm, ease a burden, or repair a loss.',
    words: [
      { word: 'mitigate', meaning: '减轻风险或危害的程度', collocations: ['mitigate risks', 'mitigate damage', 'mitigate the impact'], example: 'Better drainage can mitigate the impact of heavy rain on roads near the river.', note: '关注降低不良影响的严重程度，不保证把风险完全消除，也不直接表示支付赔偿。' },
      { word: 'alleviate', meaning: '缓解痛苦、压力或困境', collocations: ['alleviate pain', 'alleviate stress', 'alleviate poverty'], example: 'Access to affordable childcare can alleviate some of the pressure on working parents.', note: '常把人的痛苦、负担或困难处境作为对象，较少用于具体维修某台失灵设备。' },
      { word: 'compensate', meaning: '为损失提供金钱或其他补偿', collocations: ['compensate residents', 'compensate employees', 'compensate for damage'], example: 'Project budgets can include funds to compensate residents for damage caused by construction.', note: '强调因损失而给予金钱或其他补偿，常用 compensate someone for something；支付补偿本身不表示风险已经消除。' },
      { word: 'restore', meaning: '使恢复原有或可用状态', collocations: ['restore a building', 'restore access', 'restore normal service'], example: 'Engineers hope to restore normal service once they have checked the damaged section of track.', note: '强调失去、受损或中断后重新恢复状态或功能，不仅是把仍在发生的问题减轻一点。' },
    ],
    tip: 'mitigate 降低危害，alleviate 减轻负担，compensate someone for a loss 是补偿损失，restore service 是恢复服务；它们对应不同的处理目标。',
  },
  {
    id: 'action-prevention', title: '避免与防范', subtitle: 'Keep away, prevent an outcome, or discourage an action.',
    words: [
      { word: 'avoid', meaning: '避开某人、事物或情况', collocations: ['avoid crowds', 'avoid busy roads', 'avoid heavy traffic'], example: 'Some commuters leave earlier to avoid the crowds that gather near the station each morning.', note: '常通过改变路线或做法避开对象，后接动词时用动名词；不写 avoid to do。' },
      { word: 'avert', meaning: '防止坏事发生或使其避开', collocations: ['avert a crisis', 'avert a disaster', 'avert a shortage'], example: 'Early repairs can help avert a serious shortage of water during the dry season.', note: '较正式，常以危机、灾难、短缺等负面结果为宾语，强调在发生前阻止。' },
      { word: 'deter', meaning: '使人因风险或困难而不去做', collocations: ['deter visitors', 'deter harmful behaviour', 'deter investment'], example: 'High travel costs may deter students from attending courses that are far from their homes.', note: '常用 deter someone from doing something，突出某个障碍或风险产生劝阻效果，不一定正式禁止。' },
      { word: 'evade', meaning: '设法避开、逃避或不正面回应', collocations: ['evade a question', 'evade responsibility', 'evade scrutiny'], example: 'Speakers should not evade difficult questions when explaining how public money was spent.', note: '常带有有意逃避追问、责任或检查的意味，与中性的避开拥挤人群不同。' },
    ],
    tip: 'avoid crowds 是自己避开，avert a crisis 是防止坏结果，deter someone from acting 是使其不愿行动，evade a question 则是不正面回应。',
  },
  {
    id: 'action-instruction', title: '说明与教导', subtitle: 'A direction, a definition, or a useful example.',
    words: [
      { word: 'instruct', meaning: '教人如何做或告知其应做什么', collocations: ['instruct students', 'instruct staff', 'instruct someone to do something'], example: 'Trainers instruct new volunteers to check the equipment before opening the centre to visitors.', note: '常用 instruct someone to do something，也可指教授技能；通常有明确的学习对象或行动要求。' },
      { word: 'clarify', meaning: '澄清不明确的要求或意思', collocations: ['clarify instructions', 'clarify the requirements', 'clarify a misunderstanding'], example: 'A short example can clarify the instructions before students begin the independent writing task.', note: '让原先模糊或容易误解的内容变清楚，不一定是在完整教授一项技能。' },
      { word: 'define', meaning: '明确说明含义、性质或界限', collocations: ['define a term', 'define the scope', 'define a role'], example: 'The introduction should define the key terms before comparing how different studies use them.', note: '重在明确是什么、指什么或界限在哪里；定义不等于列举所有相关例子。' },
      { word: 'illustrate', meaning: '通过实例或图示讲明', collocations: ['illustrate a concept', 'illustrate a process', 'illustrate a point'], example: 'Teachers can illustrate the concept with a diagram that shows how the different parts connect.', note: '通过具体例子、图片或图表帮助理解；能帮助解释定义，但不能代替清楚的定义。' },
    ],
    tip: 'instruct 告知怎么做，clarify 讲清模糊处，define 界定含义，illustrate 用例子或图示说明。定义、指令和例证承担的任务不同。',
  },
  {
    id: 'action-initiation', title: '启动与推进', subtitle: 'Begin a process, take it on, and continue.',
    words: [
      { word: 'initiate', meaning: '使某个过程或行动开始', collocations: ['initiate a project', 'initiate a discussion', 'initiate changes'], example: 'Local schools can initiate a discussion about safer routes for children travelling on foot.', note: '强调作为起点让过程发生，常用于项目、讨论或改革；不表示过程已经完成。' },
      { word: 'undertake', meaning: '开始承担或开展一项任务', collocations: ['undertake research', 'undertake a project', 'undertake a survey'], example: 'Researchers undertake a detailed survey before recommending changes to the way the service operates.', note: '常用于有责任、投入或复杂度的工作，直接接 research、project 等对象。' },
      { word: 'proceed', meaning: '继续进行或进入下一阶段', collocations: ['proceed with a plan', 'proceed to the next stage', 'proceed cautiously'], example: 'The team can proceed with the next stage once all participants have checked the instructions.', note: '常用 proceed with 表示继续某事，proceed to 表示进入下一步；不是重新启动一项全新的工作。' },
      { word: 'embark', meaning: '着手开展某项活动或旅程', collocations: ['embark on a project', 'embark on a journey', 'embark on a study'], example: 'Students should understand the methods before they embark on an independent study of local transport.', note: '常用 embark on，带有开始一段较完整行动或旅程的意味；后接项目时不能省略 on。' },
    ],
    tip: 'initiate 重在发动，undertake 重在接下并开展任务，proceed 重在继续，embark on 重在着手一段行动；undertake a study 与 embark on a study 的结构不同。',
  },
];
