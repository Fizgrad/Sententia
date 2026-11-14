# Sententia · 拾句

在阅读中学习雅思词汇，用主动提取巩固记忆。

- GitHub 仓库：[Fizgrad/Sententia](https://github.com/Fizgrad/Sententia)
- GitHub Pages：[Sententia · 拾句](https://fizgrad.github.io/Sententia/)
- 账号与进度 API：`https://106.13.2.32`

## 产品功能

内置 **2000 个学习词、6000 条学习语境、8 类话题**。词脉包含 **100 组语义簇、390 个对照词条、1170 个搭配和 390 条原创对比例句**。

- **拾句台**：根据英文语境选择词义，核对答案后阅读释义、搭配与其他例句。
- **回响**：用跨句完形主动回忆，结合首字母、英文释义提示和 FSRS 四档评分安排复习。
- **词脉**：按动作与过程、描述与判断、概念与事物比较用法，支持分类、中英文搜索和进入词卡学习。
- **句匣**：收藏英文句子，识别核心词汇，按话题整理并加入复习。
- **阅读足迹**：查看学习积累、连续天数、话题分布与复习安排。
- **阅读偏好**：调整每日目标、记忆保留率、朗读和深浅模式，管理账号、同步及 JSON 备份。

界面支持浏览器字号设置，英文阅读采用衬线字体。数字键 1–4 选择释义或复习评分，Enter 核对并继续，Ctrl / ⌘ + K 搜索词汇。

## 本地运行

使用 Node.js 22.9 或更新版本：

```powershell
npm.cmd ci
npm.cmd run dev
```

打开 [http://127.0.0.1:3000](http://127.0.0.1:3000)。Windows 也可运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

在 `.env.local` 中设置公开 API 地址：

```dotenv
NEXT_PUBLIC_API_URL=https://106.13.2.32
NEXT_PUBLIC_BASE_PATH=
```

生产模式：

```powershell
npm.cmd run build
npm.cmd run start
```

生产版会缓存界面、词库、样式和字体，供后续离线学习。朗读使用浏览器的 Web Speech API，优先选择设备提供的英式英语声音。

## 注册、登录与同步

在 **阅读偏好 → 数据与备份** 中创建账号或登录。账号名为 3–40 位字母、数字、点、下划线或短横线，首位为字母或数字；密码为 12–128 个字符。

1. 登录后查看本设备和云端的进度概况。
2. 选择 **上传本地进度**，将这台设备的学习记录同步到账户；选择 **使用云端进度**，取回账户中保存的记录。
3. 连接后自动同步学习变化。离线时继续保存在本设备，恢复联网后继续同步。
4. 在其他设备登录同一账号，选择 **使用云端进度** 接着学习。

学习记录和句匣在浏览器 IndexedDB 中保留本地副本，账号进度保存在服务器 SQLite 中。数据与备份页面支持 JSON 导入、导出和同步前的进度恢复备份。

## GitHub Pages

在 `Fizgrad/Sententia` 的 **Settings → Pages** 中选择 **GitHub Actions**。工作流 `.github/workflows/pages.yml` 会在默认分支更新时构建并发布 `out/`，配置 `/Sententia/` 路径、字体、图标与离线缓存。

在 **Settings → Secrets and variables → Actions → Variables** 设置：

| 变量 | 值 |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://106.13.2.32` |

`NEXT_PUBLIC_API_URL` 是供浏览器调用的公开地址。`NEXT_PUBLIC_BASE_PATH` 由 Pages 工作流自动配置。部署用的 SSH 私钥等凭据存放在 **Actions Secrets**；数据库和服务端运行配置保存在服务器私有目录。

服务器配置、备份和证书续期见 [ops/README.md](ops/README.md)，API 与账号管理见 [backend/OPERATIONS.md](backend/OPERATIONS.md)。

## 词库与语料

选词参考 ECDICT 雅思词表标签与 BNC 通用语料排名。1931 个词具有雅思标签，1903 个词的 BNC 排名位于前 10000。学习语境由编辑原创例句和保留作者、链接及许可的 Tatoeba 社区例句组成。

词频统计覆盖 **22 个 IELTS 官方公开样题内容单元**，包括 14 个阅读单元、8 段听力录音稿，共 10492 个英文词次。页面分别展示出现次数、内容覆盖与来源，支持按语料优先级安排学习。

- 词库来源：`data/sources/lexicon.json`
- 官方样题来源：`data/sources/ielts-official-public.json`
- 词频统计：`data/analysis/vocabulary-frequency.json`
- 词典许可：[public/licenses](public/licenses)
- 字体许可：[public/fonts](public/fonts)

语料维护命令与来源说明见 [scripts/lexicon/README.md](scripts/lexicon/README.md) 和 [data/sources/README.md](data/sources/README.md)。

## 开发检查

技术栈为 Next.js / React / TypeScript、Tailwind CSS、Motion、Dexie、ts-fsrs；进度服务使用 FastAPI 和 SQLite。

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

端到端测试使用 Playwright 支持的浏览器。后端测试命令见 [backend/OPERATIONS.md](backend/OPERATIONS.md)。
