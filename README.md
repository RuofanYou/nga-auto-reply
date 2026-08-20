# 叫叫投放选品雷达｜Cloudflare 全栈版

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/RuofanYou/nga-auto-reply/tree/jojo-radar-deploy)

## 不下载、不解压的一键上线

直接点击上面的 **Deploy to Cloudflare**。Cloudflare 会复制这个独立部署分支、自动创建并绑定 D1、R2、Queues、Workers AI 和 Browser Run，执行数据库迁移，随后发布 Worker、管理控制台、定时任务和 `/mcp`。

你只需要在 Cloudflare 的安全授权页完成账号授权，并填写：

- `ADMIN_TOKEN`：至少 32 位随机字符串，用于控制台写操作；
- `ADMUSE_COOKIE`：可先留空。需要自动采集腾讯妙思时，再在 Cloudflare Secrets 中录入经过授权的 Cookie。

这两项是账号所有权和敏感凭证边界，不会写进公开仓库，也不应发送给 GPT。


一套可直接部署到 Cloudflare 的投放素材情报系统：自动采集公开/授权数据源，保存原始证据，去重并追踪排名变化，用 Workers AI 拆解素材，再通过只读 MCP 接入个人 ChatGPT Pro。

> 当前交付是可运行的 **v0.1 生产型 MVP**。它已经覆盖采集、证据留存、结构化分析、趋势簇、机会卡、日报/周报/月报、管理控制台和个人 GPT 读取。腾讯妙思页面的 CSS 结构和登录策略属于外部变量，首次上线后通常需要在控制台校准一次选择器，并在腾讯登录过期时更新 Cookie。

## 已交付

- **Cloudflare Worker**：单一入口，承载 API、静态前端、MCP、Cron 和 Queue consumer。
- **Workers Static Assets**：响应式管理控制台，无独立前端服务器。
- **D1**：数据源、素材、观察记录、AI 分析、趋势簇、机会卡、摘要和审计日志。
- **R2**：页面截图、结构化快照及后续媒体证据。
- **Queues**：采集与 AI 分析异步化，逐条确认、自动重试和死信队列。
- **Browser Run**：以经过授权的腾讯登录态访问 `admuse.qq.com/#/idea`。
- **Workers AI**：默认使用 `@cf/zai-org/glm-4.7-flash`；失败时自动退回确定性规则分析。
- **Cron Triggers**：每日采集、日报、周报、月报和机会卡刷新。
- **个人 GPT MCP**：实现标准只读 `search` / `fetch` 工具，适配 ChatGPT Pro 开发者模式。
- **人工导入兜底**：妙思页面变化或登录失效时，可上传 JSON，分析链路继续运行。
- **演示样本**：18 条明确标注的虚构素材，部署后可立即验证全链路。

## 架构

```text
腾讯妙思 / JSON Feed / 人工 JSON
            │
            ▼
Cloudflare Browser Run / Worker API
            │
      原始证据 ───────► R2
            │
            ▼
     D1 去重 + 观察时间序列
            │
            ▼
       Cloudflare Queue
            │
            ▼
Workers AI（GLM-4.7-Flash）
  ├─ Hook / 受众 / 玩法 / 教育构念
  ├─ 情绪杠杆 / CTA / 风险
  └─ 低置信度时保守降级
            │
            ▼
D1 趋势簇 / 机会卡 / 日周月摘要
        ┌───┴────────────────┐
        ▼                    ▼
Cloudflare 控制台        只读 MCP /mcp
审批、导入、运行          个人 ChatGPT Pro
```

选择一个 Worker 承载前后端是刻意设计：减少部署单元、跨服务请求和免费额度消耗。采集、数据库、对象存储、队列、AI 和定时器仍然使用各自的 Cloudflare 原生 binding。

## 本地开发与命令行部署（可选）

### 前提

- Node.js 22+
- Cloudflare 账号
- Wrangler 已能登录：`npx wrangler whoami`
- Browser Run、Workers AI、D1、R2 和 Queues 在账号中可用

### 一条命令完成资源创建和部署

```bash
npm install
npm run setup
```

`npm run setup` 会：

1. 检查 Cloudflare 登录；
2. 创建或复用 APAC D1；
3. 将真实 D1 UUID 写入 `wrangler.jsonc`；
4. 创建 APAC R2 bucket；
5. 创建主 Queue 和死信 Queue；
6. 生成 64 位随机管理员令牌，保存到 `.admin-token.local`；
7. 应用 D1 migration；
8. 生成 Cloudflare binding 类型；
9. 执行部署 dry-run；
10. 首次部署 Worker；
11. 上传 `ADMIN_TOKEN` Secret，并由 Wrangler 发布含 Secret 的新版本。

部署结束后，终端会输出 Worker 地址。打开即可看到控制台。

### 第一次验证

1. 打开控制台，点右上角 **管理**。
2. 把项目根目录 `.admin-token.local` 的内容填入管理员令牌。
3. 点 **导入演示样本**。
4. 等 Queue 处理完成，刷新页面。
5. 点 **重新计算机会** 和 **生成日报**。

演示数据会明确显示“非真实投放数据”，不会冒充市场证据。

## 接入腾讯妙思

不要把 Cookie、Token 或账号密码发给 GPT，也不要写进 D1、源码或 `wrangler.jsonc`。

```bash
npx wrangler secret put ADMUSE_COOKIE
```

输入当前已授权登录浏览器中发往 `admuse.qq.com` 的 `Cookie` 请求头。采集器会将 Cookie 解析后仅绑定到妙思站点 origin，不会把它作为通用请求头发送给第三方资源。

然后在控制台运行 **腾讯妙思｜获得灵感** 数据源。若出现：

- **需要登录**：更新 `ADMUSE_COOKIE`；
- **抓到 0 张卡**：在数据源编辑器中更新 CSS selectors；
- **页面风控/验证码**：停止自动重试，改用人工 JSON 导入；系统不会绕过验证码或反爬保护。

完整步骤见 [docs/ADMUSE_SETUP.md](docs/ADMUSE_SETUP.md)。

## 接入个人 ChatGPT Pro

部署后的 MCP 地址：

```text
https://<你的-worker>.workers.dev/mcp
```

ChatGPT Pro 当前可在开发者模式连接自定义 MCP 的只读 `search` / `fetch` 能力；写入/修改工具的完整 MCP 权限仍面向 Business、Enterprise 和 Edu。因此：

- GPT 负责搜索、取证、比较和生成选品结论；
- 审批、导入、运行采集等写操作放在 Cloudflare 控制台；
- Cloudflare Cron 自己保证自动化，不依赖 GPT 聊天窗口一直开着。

设置步骤和推荐提问见 [docs/CHATGPT_SETUP.md](docs/CHATGPT_SETUP.md)。

## 自动运行时间

Cron 使用 UTC，当前配置对应北京时间：

| Cron | 北京时间 | 任务 |
|---|---:|---|
| `20 0 * * *` | 每天 08:20 | 采集所有启用的数据源 |
| `30 1 * * *` | 每天 09:30 | 生成日报并刷新机会卡 |
| `45 1 * * MON` | 每周一 09:45 | 生成周报并刷新机会卡 |
| `0 2 1 * *` | 每月 1 日 10:00 | 生成月报并刷新机会卡 |

Cloudflare 免费计划最多允许 5 个 Cron Trigger，本项目使用 4 个。

## 免费额度策略

项目默认配置用于个人/小团队的低成本运行，不承诺永远零费用。以 2026 年 8 月官方公开额度为参考：

- Workers Free：每天 100,000 请求；
- Queues Free：每天 10,000 operations，消息最长保留 24 小时；
- Browser Run Free：每天 10 分钟、最多 3 个并发浏览器；
- D1 Free：每天 500 万 rows read、10 万 rows written、总存储 5 GB；
- R2 Free：10 GB-month、每月 100 万 Class A 和 1,000 万 Class B；
- Workers AI：每天 10,000 free neurons；`GLM-4.7-Flash` 仍可用于 Free plan。

默认每天最多分析 80 条新增/变化素材。可在 `wrangler.jsonc` 调低 `MAX_DAILY_ANALYSIS`。媒体量较大时，Browser Run 和 Workers AI 最先触碰上限。

## 数据边界

### 已经自动化

- 固定时间采集；
- 原始页面截图和 JSON 快照；
- 素材去重；
- 首次/最后出现时间；
- 排名变化；
- Queue 异步处理；
- 文本证据的 AI 分析；
- 玩法、Hook 和受众聚类；
- 机会卡与日/周/月摘要；
- GPT 只读检索。

### v0.1 暂不假装完成

- 妙思私有接口逆向；
- 绕过登录、验证码或风控；
- 对视频逐帧理解、ASR 和剪辑点分析；
- 腾讯真实 CTR、CPL、ROAS；
- 小游戏埋点和叫叫 CRM 回流；
- 自动创建广告或自动决定立项。

代码已经保留 `media_url`、R2 和 Queue 扩展点。真正接入自有投放、小游戏事件与 CRM 时，应先把 `/mcp` 加 OAuth 或 Cloudflare Access，不能继续把私有数据放在无认证的只读 MCP 后面。

## 安全规则

- `ADMIN_TOKEN`、`ADMUSE_COOKIE` 只能用 Cloudflare Secrets；
- 数据源 JSON 配置拒绝 `token`、`cookie`、`secret`、`authorization`、`password` 等敏感键；
- R2 原始证据只能从管理员接口读取；
- 公开 API 会遮蔽数据源 header 配置；
- 管理员令牌只保存在当前浏览器 Local Storage；
- 静态页面带 CSP、`nosniff` 和权限策略；
- 当前 `/mcp` 仅适合公开/可共享素材情报；接入私有经营数据前必须加认证。

## 常用命令

```bash
npm run dev                 # 本地 Worker；Browser binding 远程
npm run deploy:dry          # 部署检查
npm run deploy              # 部署
npm run migrate:local       # 本地 D1 migration
npm run migrate:remote      # 线上 D1 migration
npm run validate:static     # 无依赖静态契约检查
npm run validate            # 静态检查 + TypeScript
npm run tail                # 实时日志
```

测试 Cron：

```bash
npm run dev
# 另一个终端访问
curl http://localhost:8787/__scheduled
```

## 目录

```text
.
├── src/
│   ├── index.ts            # Worker、/mcp、Cron、Queue 入口
│   ├── api.ts              # 公共查询与管理员写 API
│   ├── collector.ts        # Browser Run / JSON Feed 采集
│   ├── ingest.ts           # 去重、观察记录、R2 快照
│   ├── analysis.ts         # Workers AI + 确定性降级
│   ├── pipeline.ts         # Queue 与 Cron
│   ├── mcp.ts              # 标准 search / fetch
│   └── db.ts               # D1 查询层
├── public/                 # Cloudflare Static Assets 控制台
├── migrations/            # D1 schema
├── fixtures/              # 明确标注的演示数据
├── prompts/               # GPT 定时报告模板
├── skills/                # 可复用分析准则
├── docs/                  # 部署、妙思、GPT 与架构文档
└── scripts/               # 资源创建和静态验证
```

## 许可

MIT。腾讯、ChatGPT 和 Cloudflare 的名称与商标归各自权利人所有。对第三方平台的自动访问必须遵守你的账号权限、平台条款和适用法律。
