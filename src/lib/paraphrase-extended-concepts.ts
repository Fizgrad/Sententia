import type { ParaphraseGroup } from './types';

// Original learning examples, not quotations or reports of actual studies.
// Each cluster contrasts related concepts; its terms are not freely interchangeable.
export const extendedConceptGroups: ParaphraseGroup[] = [
  {
    id: 'concept-evidence-information', title: '证据与信息', subtitle: 'What is collected, what is known, and what supports a claim.',
    words: [
      { word: 'evidence', meaning: '支持判断或结论的证据', collocations: ['strong evidence', 'provide evidence', 'evidence of change'], example: 'The report provides evidence that quieter classrooms can improve students\' concentration.', note: '关注信息对某个判断的支持作用，通常不可数；有 evidence 不一定等于结论已被完全证明。' },
      { word: 'data', meaning: '收集、记录下来供分析的资料', collocations: ['collect data', 'survey data', 'reliable data'], example: 'The team collected data on daily water use in fifty local homes.', note: '强调可供分析的记录或测量值；数据经过解释后可能成为 evidence，但两者不是同一个概念。' },
      { word: 'information', meaning: '帮助了解情况的信息或资料', collocations: ['accurate information', 'access to information', 'information about a course'], example: 'The college website provides information about course fees and evening class times.', note: '范围比研究数据更广，也包括通知、细节和说明，通常不可数，不说 an information。' },
    ],
    tip: 'data 强调收集到的记录，information 强调让人了解情况的内容，evidence 强调这些内容是否支持某个判断。不要把所有资料都直接称为证据。',
  },
  {
    id: 'concept-origins-factors', title: '来源与依据', subtitle: 'A starting point is not always a cause.',
    words: [
      { word: 'factor', meaning: '影响某个结果的因素', collocations: ['a key factor', 'a factor in a decision', 'consider several factors'], example: 'Cost is only one factor in families\' decisions about where to live.', note: '通常是多个影响条件之一，常用 a factor in；不必是事物最初的来源或唯一原因。' },
      { word: 'source', meaning: '信息、资源或事物的来源', collocations: ['a reliable source', 'a source of information', 'trace the source'], example: 'Local newspapers were the main source of information about the new bus service.', note: '强调某物从哪里来，可指人、材料、地点或渠道，常用 source of。' },
      { word: 'origin', meaning: '某事物的起源或开端', collocations: ['the origin of a custom', 'investigate the origin', 'a common origin'], example: 'Researchers are still investigating the origin of the unusual marks on these rocks.', note: '更关注最初的开始或来历，也可指人的出身；追溯 origin 和讨论当前影响因素不同。' },
      { word: 'basis', meaning: '作出判断或行动的基础', collocations: ['a sound basis', 'the basis for a decision', 'on the basis of evidence'], example: 'Reliable survey results provide a sound basis for decisions about local transport.', note: '强调支持某项判断的根据，常用 basis for 或 on the basis of；复数为 bases。' },
    ],
    tip: 'factor 回答“什么影响结果”，source 回答“从哪里取得”，origin 回答“最初从哪里开始”，basis 回答“根据什么作判断”。',
  },
  {
    id: 'concept-methods-strategies', title: '方法与策略', subtitle: 'Different ways of turning an aim into action.',
    words: [
      { word: 'approach', meaning: '处理问题的总体思路或方式', collocations: ['a flexible approach', 'an approach to learning', 'adopt a new approach'], example: 'A flexible approach to homework can help teachers support different learning needs.', note: '常指看待或处理问题的总体方式；名词后常接 to，再接名词或动名词。' },
      { word: 'method', meaning: '完成某任务的具体方法', collocations: ['a research method', 'a method of measurement', 'use the same method'], example: 'The team used the same method to measure noise at every location.', note: '通常比 approach 更强调具体做法或步骤，适合描述测量、教学与研究操作。' },
      { word: 'strategy', meaning: '为实现目标制定的策略', collocations: ['a long-term strategy', 'develop a strategy', 'a strategy for growth'], example: 'The city\'s long-term strategy links affordable housing with better public transport.', note: '突出目标、规划和行动选择；某个单独操作可以是 method，而不一定是一套 strategy。' },
      { word: 'mechanism', meaning: '使某事运行或发生的机制', collocations: ['a funding mechanism', 'an underlying mechanism', 'a mechanism for cooperation'], example: 'The funding mechanism allows small schools to share the cost of new equipment.', note: '关注系统如何起作用，既可指实际安排，也可指因果过程；不是所有机制都是人为选择的方法。' },
    ],
    tip: 'approach 偏总体思路，method 偏操作做法，strategy 偏达成目标的计划，mechanism 偏事物如何运转。写研究方法时应先判断要解释哪一层。',
  },
  {
    id: 'concept-policy-law', title: '政策与规则', subtitle: 'Guidance, requirements, and laws operate at different levels.',
    words: [
      { word: 'policy', meaning: '指导决定和行动的政策方针', collocations: ['public policy', 'a housing policy', 'implement a policy'], example: 'The school introduced a policy to reduce waste in its dining areas.', note: '可属于政府、学校或企业，强调行动原则；有政策不等于已经制定了一部法律。' },
      { word: 'rule', meaning: '约束行为的具体规则', collocations: ['follow a rule', 'a school rule', 'a rule about attendance'], example: 'One school rule requires students to return library books before the holidays.', note: '适用范围广，可用于学校、游戏和日常惯例；比 policy 更常指明确的行为要求。' },
      { word: 'regulation', meaning: '由有权机构制定的规定', collocations: ['a safety regulation', 'comply with a regulation', 'an environmental regulation'], example: 'A new safety regulation requires regular checks on equipment used in the workshop.', note: '比日常 rule 更突出正式制定和执行；这里按可数名词表示一项规定。' },
      { word: 'legislation', meaning: '立法机构制定的法律法规', collocations: ['introduce legislation', 'environmental legislation', 'a piece of legislation'], example: 'The proposed legislation would set clearer standards for the quality of rented housing.', note: '通常不可数，强调立法形成的法律或法律总称；一项法律可说 a piece of legislation。' },
    ],
    tip: 'policy 指引行动方向，rule 规定具体行为，regulation 常指正式管理规定，legislation 强调法律层级。不要因为中文都译作“规定”就互换。',
  },
  {
    id: 'concept-education-training', title: '教育与学习', subtitle: 'Teaching a person, building a skill, and planning a course.',
    words: [
      { word: 'education', meaning: '知识与能力的教育培养', collocations: ['adult education', 'access to education', 'a good education'], example: 'Adult education can give people a second chance to develop useful skills.', note: '通常指较广的教育过程、体系或经历；不局限于某项工作技能的训练。' },
      { word: 'training', meaning: '为获得特定技能而进行的训练', collocations: ['practical training', 'staff training', 'a training programme'], example: 'Practical training helps new staff use the equipment safely and confidently.', note: '突出为了熟练完成某类任务而练习，常用于职业、运动和设备操作。' },
      { word: 'learning', meaning: '学习者获取知识或技能的过程', collocations: ['online learning', 'lifelong learning', 'support learning'], example: 'Online learning gives students more control over when they study.', note: '侧重知识或能力如何被获取，可在课堂、工作或日常经验中发生，通常不可数。' },
      { word: 'curriculum', meaning: '课程体系及计划教授的内容', collocations: ['the school curriculum', 'revise the curriculum', 'a broad curriculum'], example: 'The school revised its curriculum to include more science and digital skills.', note: '指教什么以及如何组织课程内容，不是学生的学习过程；常见复数形式是 curricula。' },
    ],
    tip: 'education 看广义培养，training 看特定技能训练，learning 看知识获取过程，curriculum 看计划教授的课程内容。课程改革不能都简单写成 learning。',
  },
  {
    id: 'concept-knowledge-skills', title: '知识与技能', subtitle: 'Knowing about something is different from doing it well.',
    words: [
      { word: 'knowledge', meaning: '学习和了解而获得的知识', collocations: ['practical knowledge', 'knowledge of science', 'gain knowledge'], example: 'Basic knowledge of science helps students understand debates about food and energy.', note: '强调知道或理解的内容，通常不可数；有知识不自动等于具备熟练操作的技能。' },
      { word: 'skill', meaning: '通过练习获得的熟练能力', collocations: ['a practical skill', 'develop a skill', 'communication skills'], example: 'Writing a clear summary is a skill that improves with regular practice.', note: '可数，常用于可以练习、展示或评价的具体能力；develop skills 比增加知识更强调会做。' },
      { word: 'expertise', meaning: '某领域的专门知识与技能', collocations: ['technical expertise', 'expertise in education', 'draw on local expertise'], example: 'The project needs technical expertise as well as a clear understanding of local needs.', note: '通常不可数，强调专业程度及领域经验；不是任何初步的 knowledge 都可称 expertise。' },
      { word: 'experience', meaning: '亲自实践积累的经验', collocations: ['practical experience', 'gain experience', 'experience in teaching'], example: 'Her experience in teaching helped the team design more useful classroom activities.', note: '这里指不可数的实践经验；也可作可数名词表示某次经历，但两种用法不能混淆。' },
    ],
    tip: 'knowledge 是知道的内容，skill 是能够熟练完成的事，expertise 是专业水平，experience 是实践积累。描述求职条件时，这几项常互相补充。',
  },
  {
    id: 'concept-careers-employment', title: '职业与就业', subtitle: 'A job category, a working life, and the state of having work.',
    words: [
      { word: 'career', meaning: '长期的职业生涯或事业', collocations: ['a career in teaching', 'career development', 'begin a career'], example: 'Her career in teaching began at a small school near the coast.', note: '强调一段时间内的工作发展和经历，不只是当前这份工作的名称。' },
      { word: 'occupation', meaning: '一个人所从事的职业', collocations: ['current occupation', 'a skilled occupation', 'state your occupation'], example: 'The form asks each applicant to state their current occupation.', note: '常用于表格、统计或正式描述，回答“从事什么工作”；这里不用军事占领的其他义项。' },
      { word: 'profession', meaning: '通常需要专门训练的职业', collocations: ['the legal profession', 'enter a profession', 'a respected profession'], example: 'He entered the legal profession after several years of study and practical training.', note: '常用于法律、医学等有专门知识或训练的职业；不能把所有临时工作都称为 profession。' },
      { word: 'employment', meaning: '有偿工作的就业状态或供给', collocations: ['full-time employment', 'create employment', 'employment opportunities'], example: 'The new factory has created employment for people across the local area.', note: '通常不可数，强调有工作这一状态或就业岗位的供给；不说 an employment 表示一份工作。' },
    ],
    tip: 'career 看职业发展的时间线，occupation 看所做工作的类别，profession 常看专业门槛，employment 看有偿工作和就业状态。',
  },
  {
    id: 'concept-payments-allowances', title: '款项与津贴', subtitle: 'A payment can have a very specific purpose.',
    words: [
      { word: 'payment', meaning: '用于购买或结清款项的付款', collocations: ['make a payment', 'payment in advance', 'a monthly payment'], example: 'The college requires payment before it can confirm a place on the course.', note: '最一般地描述付钱或所付的款项；具体是服务费、养老金还是津贴，要由上下文说明。' },
      { word: 'allowance', meaning: '定期或为特定用途提供的津贴', collocations: ['a travel allowance', 'a monthly allowance', 'a clothing allowance'], example: 'The company provides a travel allowance for staff visiting its other offices.', note: '强调为个人开支或特定目的给出的金额；这里按津贴义使用，不是“允许”的动词。' },
      { word: 'pension', meaning: '退休等情况下定期领取的款项', collocations: ['a state pension', 'receive a pension', 'a pension scheme'], example: 'Her pension provides a regular payment after many years of full-time work.', note: '通常与退休后的生活来源有关，也有其他抚恤用途；不是所有定期 payment 都是 pension。' },
    ],
    tip: 'payment 只说明付款或款项，allowance 强调用途或个人开支，pension 强调退休等条件下的定期给付。不能把通用款项名称直接当成工资。',
  },
  {
    id: 'concept-spending-budgets', title: '支出与预算', subtitle: 'Money available is not the same as money already spent.',
    words: [
      { word: 'expenditure', meaning: '某段时间或某用途的开支', collocations: ['public expenditure', 'expenditure on education', 'reduce expenditure'], example: 'The annual report shows a rise in expenditure on local library services.', note: '较正式，常描述政府、机构或家庭实际花出去的金额，通常不可数；常接 on 表示用途。' },
      { word: 'fee', meaning: '为某项服务或资格支付的费用', collocations: ['a tuition fee', 'a membership fee', 'pay a fee'], example: 'Students pay a small fee to use the college\'s sports facilities.', note: '是可数的特定收费，如课程、会员或专业服务费；不能把所有公共支出都叫 fee。' },
      { word: 'budget', meaning: '为某用途安排的可用资金额度', collocations: ['a limited budget', 'within budget', 'a budget for repairs'], example: 'The project stayed within its budget despite the rising cost of materials.', note: '这里指事先拨定或安排的资金数额；within budget 是未超预算，不等于没有发生支出。' },
    ],
    tip: 'budget 关注预先安排的额度，expenditure 关注支出的金额，fee 关注某项具体收费。谈超支时，先区分计划额度与实际开支。',
  },
  {
    id: 'concept-financial-support', title: '投资与资助', subtitle: 'Funds can be invested, awarded, or assigned.',
    words: [
      { word: 'investment', meaning: '为未来收益或改善投入的资源', collocations: ['public investment', 'investment in transport', 'attract investment'], example: 'Public investment in better rail links can improve access to jobs in nearby cities.', note: '强调为了未来回报或收益投入金钱、时间与精力；不只是任何形式的付款。' },
      { word: 'subsidy', meaning: '为支持活动或降低成本的补贴', collocations: ['a government subsidy', 'a subsidy for transport', 'receive a subsidy'], example: 'The city offers a subsidy to help residents replace inefficient heating systems.', note: '常由政府提供，目的是支持某活动或减轻成本；与期望获利的商业投资侧重点不同。' },
      { word: 'grant', meaning: '按项目或资格授予的资助金', collocations: ['a research grant', 'apply for a grant', 'award a grant'], example: 'The research team received a grant to study water use in rural schools.', note: '这里是可数名词，常指为研究、教育等目的授予的资金；不要误读成“同意给予”的动词。' },
      { word: 'allocation', meaning: '把资金等资源分派给特定用途', collocations: ['a budget allocation', 'allocation of resources', 'an allocation for repairs'], example: 'The budget includes an allocation for repairs to older public buildings.', note: '强调分配动作或所分配的份额，常用 allocation of 或 allocation for；不说明资金一定来自外部资助。' },
    ],
    tip: 'investment 看未来收益，subsidy 看支持或降成本，grant 看授予的资助，allocation 看如何指定用途。同一笔资金可能从不同角度被描述。',
  },
  {
    id: 'concept-people-communities', title: '人口与社群', subtitle: 'Numbers, relationships, and legal membership describe different things.',
    words: [
      { word: 'population', meaning: '某地区的人口或生物种群', collocations: ['the local population', 'population growth', 'an ageing population'], example: 'Over the past decade, the population of this coastal town has grown.', note: '强调某个区域内的全部人或同类生物，常用于人数统计，不等于成员之间有紧密关系。' },
      { word: 'community', meaning: '因地区或共同兴趣联系的群体', collocations: ['the local community', 'a scientific community', 'community life'], example: 'The new library provides a meeting place for the local community.', note: '强调共享地点、兴趣或归属关系；可以是一个国家中的小社群，也可以跨越地域。' },
      { word: 'society', meaning: '有共同制度和社会关系的人群', collocations: ['modern society', 'an open society', 'society as a whole'], example: 'Access to reliable information is important for a fair and open society.', note: '通常从更广的制度、文化或社会关系来看人群；不宜用作某个社区人数的统计名称。' },
      { word: 'citizen', meaning: '具有某国法律成员身份的公民', collocations: ['a citizen of a country', 'an active citizen', 'a senior citizen'], example: 'The survey asked each citizen about their use of local public services.', note: '指个体的公民身份，不是人口整体；社区居民也可能有其他国籍，不能默认全部都是该国 citizens。' },
    ],
    tip: 'population 便于谈规模和构成，community 强调联系与归属，society 强调社会整体，citizen 指有公民身份的个体。统计对象和法律身份要分清。',
  },
  {
    id: 'concept-organizations', title: '机构与组织', subtitle: 'Shared activity can take several institutional forms.',
    words: [
      { word: 'institution', meaning: '承担教育等公共职能的机构', collocations: ['an educational institution', 'a financial institution', 'a public institution'], example: 'This educational institution offers evening courses for adults returning to study.', note: '常用于较稳定、具有教育、金融或社会职能的机构；比一个临时合作小组更正式。' },
      { word: 'organization', meaning: '为共同目标开展活动的组织', collocations: ['a voluntary organization', 'a large organization', 'a non-profit organization'], example: 'The organization works with local schools to improve access to reading materials.', note: '是较宽泛的组织名称，关注一群人如何共同工作；不说明一定属于政府或有会员制度。' },
      { word: 'agency', meaning: '提供特定服务或执行职能的机构', collocations: ['a public agency', 'a travel agency', 'a government agency'], example: 'A public agency is responsible for monitoring air quality across the region.', note: '强调特定服务或职能，既可用于政府机构，也可用于商业代理机构，不能一律理解成协会。' },
      { word: 'association', meaning: '成员为共同利益组成的协会', collocations: ['a professional association', 'a business association', 'join an association'], example: 'The local business association holds regular meetings to discuss transport and training.', note: '当前词卡使用正式协会义，强调有共同兴趣或职业的会员组织，不使用“联想、关联”的其他义项。' },
    ],
    tip: 'organization 最宽泛，institution 常突出稳定的社会职能，agency 突出特定服务，association 突出成员共同利益。名称相似不等于机构性质相同。',
  },
  {
    id: 'concept-natural-settings', title: '环境与地貌', subtitle: 'Where life happens and what a place looks like.',
    words: [
      { word: 'environment', meaning: '周围的自然或生活条件', collocations: ['the natural environment', 'a learning environment', 'protect the environment'], example: 'A quieter environment can help students concentrate during difficult reading tasks.', note: '范围较广，可包括自然、社会或学习条件；不一定只指某种动物的生存地点。' },
      { word: 'habitat', meaning: '某种生物自然生活的栖息地', collocations: ['a natural habitat', 'habitat loss', 'protect a habitat'], example: 'The wetland provides a natural habitat for many birds and small animals.', note: '与特定生物的生活条件相连；讨论生境丧失时通常比泛泛说 environment 更具体。' },
      { word: 'landscape', meaning: '能够看到的一片地表景观', collocations: ['a rural landscape', 'the coastal landscape', 'a changing landscape'], example: 'The landscape includes narrow valleys, small farms, and a long stretch of coast.', note: '这里指可见的自然或乡村景观，关注整体外观；并不是土地上全部生态条件的总称。' },
      { word: 'terrain', meaning: '具有某种地表特征的地带', collocations: ['rocky terrain', 'steep terrain', 'difficult terrain'], example: 'The rocky terrain makes it difficult to build a road across the island.', note: '突出地面的物理特征，如高低、平坦或崎岖，适合讨论交通和建设条件。' },
    ],
    tip: 'environment 看周围条件，habitat 看特定生物的居住环境，landscape 看整体景观，terrain 看地表特征。保护栖息地不只是让风景更好看。',
  },
  {
    id: 'concept-energy-supplies', title: '资源与供给', subtitle: 'A useful resource may be a fuel, a form of energy, or a reserve.',
    words: [
      { word: 'resource', meaning: '能够用于某种目的的资源', collocations: ['a natural resource', 'a limited resource', 'manage resources'], example: 'Fresh water is a limited resource that communities must manage carefully.', note: '范围广，可指自然资源、资金、人员等可利用条件；不是所有 resource 都是燃料。' },
      { word: 'fuel', meaning: '能够消耗以产生能量的燃料', collocations: ['a fossil fuel', 'fuel consumption', 'a cleaner fuel'], example: 'The company is testing a cleaner fuel for its delivery vehicles.', note: '强调用于产生能量的物质，如某些固体、液体或气体；这里按名词使用。' },
      { word: 'electricity', meaning: '用于设备和系统的电能', collocations: ['generate electricity', 'electricity supply', 'electricity consumption'], example: 'The village now has a reliable supply of electricity for homes and schools.', note: '通常不可数，是一种能源形式而非某种燃料的名称；发电所用的 fuel 和产出的 electricity 不同。' },
      { word: 'supply', meaning: '当前可供使用的数量或储备', collocations: ['a steady supply', 'a limited supply', 'a supply of water'], example: 'The village keeps a small supply of drinking water for emergencies.', note: '这里按名词表示可用的数量或储备，常接 of；resource 更强调可利用性，supply 更关注有多少可用。' },
    ],
    tip: 'resource 是可利用条件的总称，fuel 是产能物质，electricity 是电能，supply 是可用数量。它们可出现在同一能源话题中，但对应不同问题。',
  },
  {
    id: 'concept-transport-journeys', title: '交通与行程', subtitle: 'A transport system, a traffic flow, or a single outing.',
    words: [
      { word: 'transport', meaning: '人员或货物的交通运输', collocations: ['public transport', 'a transport system', 'transport links'], example: 'Reliable public transport helps people reach jobs without owning a private car.', note: '常用于运输活动、方式或系统，public transport 不表示某一次出游。' },
      { word: 'traffic', meaning: '某处来往的车辆或交通流', collocations: ['heavy traffic', 'traffic congestion', 'traffic flow'], example: 'The new school opens before morning traffic reaches its busiest period.', note: '通常不可数，强调来往车辆或行人的流量；不能说 a traffic 来表示一趟旅程。' },
      { word: 'trip', meaning: '为某目的进行的一次行程', collocations: ['a business trip', 'take a trip', 'a day trip'], example: 'Students will take a short trip to the science museum next week.', note: '是可数名词，常含往返意味，可用于工作、购物或休闲等不同目的。' },
      { word: 'excursion', meaning: '通常为休闲进行的短途游览', collocations: ['a school excursion', 'go on an excursion', 'a weekend excursion'], example: 'The college arranged an excursion to a nearby lake for new students.', note: '比 trip 更突出休闲或游览，常指安排好的短途外出；不适合所有商务或日常行程。' },
    ],
    tip: 'transport 和 traffic 描述运输及交通流；trip 和 excursion 描述一次外出。谈拥堵、交通系统与出游计划时，应先分清指的是哪一种。',
  },
  {
    id: 'concept-illness-conditions', title: '疾病与病症', subtitle: 'Related health terms can emphasise different aspects of a condition.',
    words: [
      { word: 'illness', meaning: '患病的状态或疾病情况', collocations: ['a serious illness', 'recover from illness', 'mental illness'], example: 'A short illness kept several students away from their classes last week.', note: '常着重患病状态或经历，也能泛指疾病；和 disease 有重叠，并非始终有严格的日常用法界线。' },
      { word: 'disease', meaning: '影响正常健康功能的疾病', collocations: ['a chronic disease', 'heart disease', 'the spread of disease'], example: 'The survey recorded how often each disease appeared in the patient records.', note: '常用于疾病种类和病理过程；具体病名中的固定表达不宜凭中文近义词随意替换。' },
      { word: 'infection', meaning: '有害微生物侵入引起的感染', collocations: ['a bacterial infection', 'the spread of infection', 'an infection of the skin'], example: 'The report described an infection that affected several people in the same household.', note: '侧重微生物进入并生长或因此出现的疾病，不是所有 disease 都属于 infection。' },
      { word: 'disorder', meaning: '身体或心理正常功能的障碍', collocations: ['a sleep disorder', 'a learning disorder', 'a disorder of the nervous system'], example: 'The study examined how a sleep disorder affected participants\' daily routines.', note: '常用于某类功能障碍的固定名称；并不能把任何“生病”情形都改写成一个特定 disorder。' },
    ],
    tip: '这些词存在重叠，但关注角度不同：illness 常看患病状态，disease 常看疾病类型，infection 看感染，disorder 看功能障碍。阅读时保留具体搭配和语境。',
  },
  {
    id: 'concept-culture-heritage', title: '文化与传承', subtitle: 'A shared way of life includes things passed down and things people do.',
    words: [
      { word: 'culture', meaning: '群体共享的文化与生活方式', collocations: ['local culture', 'a shared culture', 'understand a culture'], example: 'Food, music, and language all help shape the culture of a community.', note: '包括信仰、艺术、习惯和生活方式等较宽的整体，不只是某一项节日活动。' },
      { word: 'heritage', meaning: '从前人继承的传统或特征', collocations: ['cultural heritage', 'industrial heritage', 'protect local heritage'], example: 'The museum helps children understand the area\'s rich industrial heritage.', note: '强调代际传承，可涉及建筑、技能、传统或其他特征；与当前文化生活的全部内容不完全相同。' },
      { word: 'custom', meaning: '某群体接受并沿用的惯例', collocations: ['a local custom', 'follow a custom', 'a traditional custom'], example: 'It is a local custom to share food with neighbours during festivals.', note: '是较具体、可数的风俗或惯常做法；一个 custom 可以是 culture 或 heritage 的一部分。' },
    ],
    tip: 'culture 是较宽的共享文化，heritage 强调从前人承继，custom 是群体惯常做的一件事。讨论传统保护时应区分整体、传承和具体实践。',
  },
  {
    id: 'concept-research-tests', title: '研究与试验', subtitle: 'Asking questions, controlling conditions, and trying something out.',
    words: [
      { word: 'research', meaning: '为发现事实或理解进行的研究', collocations: ['carry out research', 'research into learning', 'a research project'], example: 'The university funds research into how children develop early reading skills.', note: '是系统探究活动的总称，通常不可数；一次研究可采用多种方法，不一定只有实验。' },
      { word: 'experiment', meaning: '在控制条件下进行的实验', collocations: ['conduct an experiment', 'a controlled experiment', 'an experiment on memory'], example: 'In this experiment, each group reads the same text under different lighting.', note: '通常有特定测试条件，适合讨论某变量的作用；不能把所有问卷收集都称为 experiment。' },
      { word: 'survey', meaning: '向一群人提问以收集资料的调查', collocations: ['conduct a survey', 'a survey of residents', 'survey results'], example: 'The council used a survey to ask residents about their travel habits.', note: '当前词卡指问卷或提问调查义，关注群体信息；这种用法不等于在控制条件下测试效果。' },
      { word: 'trial', meaning: '为判断是否适用而进行的试用', collocations: ['a small trial', 'a trial of a new system', 'a trial period'], example: 'The school ran a small trial of the new timetable before adopting it.', note: '强调先尝试某安排或产品再判断效果；这里不用法庭审判义，也不默认每次试用都有严格实验设计。' },
    ],
    tip: 'research 是研究活动，experiment 强调控制条件，survey 强调向群体提问，trial 强调试用后判断是否合适。读方法段时应识别研究实际做了什么。',
  },
  {
    id: 'concept-technology-innovation', title: '技术与创新', subtitle: 'A tool, a way of working, a new use, or a new finding.',
    words: [
      { word: 'technology', meaning: '基于科学知识的技术工具与方法', collocations: ['digital technology', 'develop technology', 'access to technology'], example: 'New technology allows small businesses to accept payments without buying expensive equipment.', note: '可指技术工具及应用科学的方法，范围较广；不必每次都指最新的创新。' },
      { word: 'technique', meaning: '完成某项任务的具体技巧方法', collocations: ['a teaching technique', 'a useful technique', 'a technique for remembering'], example: 'The teacher demonstrated a simple technique for remembering the structure of an argument.', note: '侧重具体操作方法，不一定依赖数字设备；写教学或写作技巧时常比 technology 更恰当。' },
      { word: 'innovation', meaning: '投入实际使用的新想法或方法', collocations: ['technological innovation', 'encourage innovation', 'an important innovation'], example: 'This innovation makes it easier for households to track their daily water use.', note: '强调新的想法、产品或做法被引入使用；不仅是把原有技术重复使用一次。' },
      { word: 'discovery', meaning: '发现原先未知的事物或事实', collocations: ['a scientific discovery', 'make a discovery', 'the discovery of a building'], example: 'The discovery of an older building changed the team\'s understanding of the site.', note: '着重找到或认识原先未知的东西；发现某事物和创造一种新方法不是同一回事。' },
    ],
    tip: 'technology 看技术工具与体系，technique 看具体做法，innovation 看新应用，discovery 看新发现。某项发现可以促成创新，但不能直接等同。',
  },
  {
    id: 'concept-danger-exposure', title: '危险与暴露', subtitle: 'A harmful possibility, its source, and contact with it.',
    words: [
      { word: 'danger', meaning: '可能受到伤害的危险状态', collocations: ['in danger', 'a serious danger', 'danger to the public'], example: 'The signs warn visitors of danger near the steep edge of the path.', note: '强调可能受到伤害的处境，也可指危险事物；in danger 是处于危险之中。' },
      { word: 'hazard', meaning: '可能造成损害的危险源', collocations: ['a safety hazard', 'a fire hazard', 'a hazard to health'], example: 'Loose cables on the floor can become a serious hazard in busy offices.', note: '常用于可识别的危险因素，如地上电线或易燃物；强调可能引发伤害的来源。' },
      { word: 'exposure', meaning: '与某事物接触或受到其作用', collocations: ['exposure to noise', 'exposure to advertising', 'reduce exposure'], example: 'The study measured children\'s exposure to online advertising during a typical school week.', note: '强调接触本身，常用 exposure to；接触语言等也可有益，因此 exposure 不等于危险程度。' },
    ],
    tip: 'danger 看危险处境，hazard 看危险来源，exposure 看是否接触某物。接触可能有害也可能有益，不能把 exposure 一律换成 danger。',
  },
  {
    id: 'concept-responsibility-obligation', title: '责任与义务', subtitle: 'Who is answerable, what is expected, and what must be fulfilled.',
    words: [
      { word: 'responsibility', meaning: '负责处理某事或承担后果的责任', collocations: ['take responsibility', 'responsibility for safety', 'a shared responsibility'], example: 'Schools share responsibility for helping young people develop safe online habits.', note: '可强调管理、照料某事或对自己的行为负责，常用 responsibility for。' },
      { word: 'duty', meaning: '某角色应履行的具体职责', collocations: ['a main duty', 'a duty to help', 'carry out a duty'], example: 'The receptionist\'s main duty is to welcome visitors and answer their questions.', note: '常指岗位、角色或社会期待中的工作与义务；这里不是税费的其他义项。' },
      { word: 'obligation', meaning: '承诺、规则等要求履行的义务', collocations: ['a moral obligation', 'an obligation to return something', 'fulfil an obligation'], example: 'Members have an obligation to return borrowed equipment in good condition.', note: '比一般愿望更强调应当履行，可来自承诺、规则或道德；不一定都专指法律义务。' },
    ],
    tip: 'responsibility 强调谁负责，duty 强调角色中的职责，obligation 强调应履行的要求。常见结构分别有 responsibility for、a duty to 和 an obligation to。',
  },
  {
    id: 'concept-demands-priorities', title: '需求与要求', subtitle: 'What people want, what must be met, and what comes first.',
    words: [
      { word: 'demand', meaning: '对商品或服务的需求', collocations: ['demand for housing', 'meet demand', 'growing demand'], example: 'Growing demand for evening classes has encouraged the college to offer more courses.', note: '当前词卡关注人们对商品或服务的需要，常用 demand for；不是每个必须满足的条件。' },
      { word: 'requirement', meaning: '必须达到的要求或条件', collocations: ['a basic requirement', 'meet a requirement', 'an entry requirement'], example: 'A basic requirement for this course is the ability to read simple graphs.', note: '强调资格、标准或必须满足的条件，可数；meet a requirement 不等于满足整个市场的需求。' },
      { word: 'priority', meaning: '应优先处理的重要事项', collocations: ['a top priority', 'give priority to safety', 'set priorities'], example: 'Improving access to safe drinking water is a priority for the local council.', note: '强调事项之间的先后和重要性；某件事有需求，并不自动表示它应当排在第一位。' },
    ],
    tip: 'demand 看需要什么或需要多少，requirement 看必须达到什么条件，priority 看先处理什么。规划资源时这三个问题应分别回答。',
  },
  {
    id: 'concept-options-opportunities', title: '选择与机会', subtitle: 'An available choice is not always an opportunity to act.',
    words: [
      { word: 'choice', meaning: '作出选择的自由或可选内容', collocations: ['have a choice', 'a choice between two courses', 'make a choice'], example: 'Students have a choice between a written essay and a short presentation.', note: '可以强调选择权、选择行为或选中的事物；这里重点是有不同可选内容。' },
      { word: 'option', meaning: '特定情形下可选的一种办法', collocations: ['a practical option', 'consider an option', 'an option for students'], example: 'The online course is an option for students who cannot attend in person.', note: '突出选择清单中的一个可用方案；an option 不保证它比其他方案更有利。' },
      { word: 'alternative', meaning: '能够替代原选项的其他方案', collocations: ['an alternative to driving', 'a viable alternative', 'offer an alternative'], example: 'The library offers a quiet alternative to studying in a busy cafe.', note: '强调相对于已有事物的另一种选择，常用 alternative to；不必只是从两项中选一项。' },
      { word: 'opportunity', meaning: '适合开展某活动的有利机会', collocations: ['an opportunity to learn', 'provide an opportunity', 'an opportunity for growth'], example: 'The placement gives students an opportunity to apply their skills in a workplace.', note: '更关注有利条件使某事有可能发生，常接 to do；不能把菜单里的所有选项都称为有利机会。' },
    ],
    tip: 'choice 可以看选择权，option 看可用选项，alternative 看替代方案，opportunity 看有利时机或条件。常见搭配是 alternative to 和 opportunity to do。',
  },
  {
    id: 'concept-extent-proportions', title: '程度与比例', subtitle: 'How much, what share, and in relation to what.',
    words: [
      { word: 'extent', meaning: '某事达到的程度或范围', collocations: ['the extent of damage', 'to some extent', 'the full extent'], example: 'The report examines the extent of damage to buildings after the storm.', note: '回答严重到什么程度或影响范围多大，不一定用数字表达；to some extent 表示在某种程度上。' },
      { word: 'proportion', meaning: '某部分在整体中所占的份额', collocations: ['a large proportion', 'the proportion of students', 'in proportion to size'], example: 'A large proportion of students now use digital notes alongside printed books.', note: '常用于一部分占总体的多少，可用百分比表达，但不一定要换算成每百。' },
      { word: 'ratio', meaning: '两个数量之间的比值关系', collocations: ['the ratio of students to teachers', 'a higher ratio', 'a ratio of two to one'], example: 'The class has a higher ratio of students to teachers than before.', note: '常用 the ratio of A to B；A 和 B 可是两个不同数量，不必是部分与整体。' },
      { word: 'percentage', meaning: '以每百为基准表达的比例', collocations: ['a small percentage', 'the percentage of households', 'a percentage increase'], example: 'The chart shows the percentage of households with access to reliable internet.', note: '关注每百中的份额；描述百分比的变化时，还需分清相对增长和百分点变化。' },
    ],
    tip: 'extent 看程度，proportion 看部分占整体，ratio 比较两个数量，percentage 用每百表示比例。学生与教师之比，不等于学生占总人数的百分比。',
  },
  {
    id: 'concept-development-change', title: '发展与转变', subtitle: 'Growing larger, changing state, or evolving over time.',
    words: [
      { word: 'development', meaning: '成长、发展或变得更完善的过程', collocations: ['economic development', 'the development of skills', 'support development'], example: 'The development of local services has made the town more attractive to families.', note: '范围较广，可涉及能力、经济、设施等的发展，不只是数量变多。' },
      { word: 'growth', meaning: '规模、数量或能力的增长', collocations: ['population growth', 'rapid growth', 'growth in demand'], example: 'Rapid growth in the student population has increased demand for new classrooms.', note: '常突出变大、增多或增强；规模增长不一定代表质量改善，两者应分开说明。' },
      { word: 'transition', meaning: '从一种阶段或状态转向另一种', collocations: ['a smooth transition', 'the transition from school to work', 'a period of transition'], example: 'The transition from school to work can require new habits and skills.', note: '强调不同状态之间的转换，常用 transition from A to B；变化不一定意味着规模增长。' },
      { word: 'evolution', meaning: '生物或其他系统的逐步演变', collocations: ['the evolution of a system', 'gradual evolution', 'the evolution of language'], example: 'The evolution of the city\'s transport network reflects changing patterns of daily travel.', note: '当前词卡也包括系统的逐步演变，强调时间中的渐进变化；不适合把每次突然转换都称为 evolution。' },
    ],
    tip: 'development 看较广的发展过程，growth 强调增大，transition 强调状态转换，evolution 强调逐步演变。不要把所有变化都解释成进步或数量增长。',
  },
];
