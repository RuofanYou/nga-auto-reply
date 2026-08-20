# 验证报告

验证日期：2026-08-19

本报告明确区分“已在交付环境验证”与“必须在用户 Cloudflare 账号中验证”的部分，避免把静态骨架误报成已经线上运行。

## 验证结论

当前仓库达到 **Validation Level 1：仓库契约、前端 JavaScript 语法、TypeScript 源码解析、严格语义检查和 D1 migration 已通过**。

由于交付环境无法完成 npm 依赖下载，且没有用户的 Cloudflare、腾讯广告登录授权，以下项目没有被伪装成已经完成：完整依赖安装、Wrangler 类型生成、真实 Worker 部署、Browser Run 登录妙思、MCP Inspector 和 ChatGPT Developer Mode 联调。

## 已通过

### 1. 仓库契约静态检查

执行：

```bash
node scripts/static-check.mjs
```

结果：

```text
Static validation passed: repo shape, current package pins, MCP route/tools, bindings, frontend syntax, docs, and fixture JSON.
D1 database_id is still a placeholder. Run: npm run setup
```

检查内容包括：

- Worker 入口存在；
- `/mcp` 使用 Stateless `createMcpHandler`；
- MCP 包含标准只读 `search`、`fetch`；
- D1、R2、Queues、Workers AI、Browser Run、Static Assets bindings 存在；
- 四条 Cron 存在，未超过 Free plan 的五条上限；
- 前端 JavaScript 能被 Node 解析；
- 演示素材 JSON 有效；
- D1 UUID 仍为部署前占位符时给出警告。

### 2. 前端 JavaScript 语法

执行：

```bash
node --check public/app.js
node --check scripts/provision.mjs
```

结果：通过。

### 3. TypeScript 源码解析

交付环境使用全局 TypeScript 5.8.3，在不解析外部依赖类型的情况下执行：

```bash
tsc --noEmit --noCheck \
  --target es2021 \
  --module es2022 \
  --moduleResolution bundler \
  --resolveJsonModule \
  --allowSyntheticDefaultImports \
  src/*.ts
```

结果：通过。该检查能确认 TypeScript 文件可解析，但不能替代安装项目指定的 TypeScript 6.0.3、运行 `wrangler types` 后的完整严格类型检查。

### 4. 严格 TypeScript 语义检查（临时平台类型桩）

为避免“只通过解析”掩盖项目内真实类型错误，交付环境额外生成了只覆盖本项目实际使用面的临时 Cloudflare/MCP 类型桩，并执行：

```bash
tsc --noEmit --strict --skipLibCheck \
  --target es2021 \
  --lib es2021,dom,dom.iterable \
  --module es2022 \
  --moduleResolution bundler \
  --resolveJsonModule \
  --allowSyntheticDefaultImports \
  /tmp/jojo-cloudflare-stubs.d.ts src/*.ts
```

结果：通过。该检查确认项目内部函数签名、空值处理和跨模块调用可在严格模式下成立；它仍不能替代安装官方依赖后由 `wrangler types` 生成的最终平台绑定类型。

### 5. D1 migration

使用 Python SQLite 内存数据库完整执行 `migrations/0001_init.sql`。

结果：

```text
SQLite migration passed: 11 tables;
seed sources = [('admuse-idea', 'browser', 1), ('manual-import', 'manual', 1)]
```


### 6. 规则分析烟雾测试

将 `analysis.ts`、`db.ts`、`types.ts`、`utils.ts` 临时转译为 CommonJS，并对全部 18 条演示素材执行 `heuristicAnalysis()`。

结果：

```text
Heuristic smoke passed: 收纳排序 30-45岁女性家长 倒计时压迫
Fixture analysis smoke passed: 18 items
```

该测试在首轮发现“收整齐”未命中“收纳排序”，随后补充了 `收整齐 / 整齐 / 书桌` 规则并重新通过。

### 7. 敏感信息检查

检查仓库中是否出现真实 OpenAI Key、Bearer Token、腾讯 Cookie 或管理员 Token。只发现 `.dev.vars.example` 中明确的占位文本：

```text
ADMIN_TOKEN=replace-with-a-long-random-token
```

仓库中不包含真实凭证。

### 8. 安全修正

最后一轮审查已经确认并修正：

- 腾讯 Cookie 只作为站点 Cookie 注入 `admuse.qq.com` origin；
- 公共 `/api/sources` 不返回原始 `config_json`；
- 管理配置拒绝 Cookie、Token、Authorization、Password 等敏感键；
- 请求和远端响应采用限长流式读取；
- Queue 消息逐条 `ack()` / `retry()`；
- 无效或停用数据源不会制造永远卡在 queued 的运行记录；
- 管理员 Secret 在首次部署后上传，避免 `wrangler secret put` 意外触发未准备好的预部署；
- R2 原始证据只能通过管理员接口读取；
- 静态页面设置 CSP、`nosniff`、Referrer Policy 和 Permissions Policy。

## 未在交付环境执行

### npm 依赖安装

执行 `npm install --ignore-scripts --no-audit --no-fund` 时，外部依赖下载在 120 秒后超时。未生成不完整的 `node_modules` 或 `package-lock.json`。

### Cloudflare 账号级验证

以下命令必须在已登录用户 Cloudflare 账号的电脑上执行：

```bash
npm install
npx wrangler login
npm run setup
```

`npm run setup` 会创建或复用 D1、R2、Queues，应用 migration，运行 `wrangler types`、部署 dry-run 和真实部署，再上传 `ADMIN_TOKEN` Secret。

### 腾讯妙思验证

没有用户的腾讯登录 Cookie，因此未验证：

- 妙思当前登录流程；
- 页面是否出现验证码或风控；
- 2026-08-19 当天 DOM selectors 是否能提取卡片；
- 素材媒体 URL 的可下载性。

系统为此保留了两条可靠退路：控制台校准 selectors，以及人工 JSON 导入。

### ChatGPT 联调

没有用户个人 ChatGPT 开发者模式配置权限，因此未执行：

- 远程 `/mcp` 添加到 ChatGPT；
- `search` / `fetch` 实际调用；
- ChatGPT 引用 `/evidence/...` 页面；
- MCP Inspector Host-loop 测试。

## 用户账号中的验收门槛

部署后按顺序验证：

1. `GET /api/health` 返回 `ok: true`；
2. 控制台能导入 18 条演示样本；
3. Queue 将素材状态从 `queued` 更新到 `analyzed`；
4. 能生成趋势簇、机会卡和日报；
5. `/mcp` 在 MCP Inspector 中列出 `search` / `fetch`；
6. ChatGPT Pro 开发者模式能够搜索并读取证据；
7. 设置 `ADMUSE_COOKIE` 后，妙思数据源至少生成一份 R2 截图和一份 JSON 快照；
8. 若卡片为 0，校准 selectors 后重跑；
9. 所有演示样本持续标记为非真实数据；
10. 接入自有投放、CRM 或个人信息前，为 MCP 和公共 API 增加认证。
