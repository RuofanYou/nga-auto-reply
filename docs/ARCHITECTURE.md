# 架构与决策记录

## 1. 目标

把“手工刷素材大盘找灵感”改造成可追溯的产品决策系统：

```text
大盘证据 → 结构化拆解 → 时间序列 → 趋势簇 → 游戏机会卡 → 素材测试 → 实际业务结果回流
```

v0.1 先解决前五步，业务结果回流保留接口边界。

## 2. 为什么全 Cloudflare

| 能力 | 产品 | 选择理由 |
|---|---|---|
| HTTP / API / MCP / Cron | Workers | 一个部署单元，避免跨云网络和常驻服务器 |
| 前端 | Workers Static Assets | 同域部署、零独立前端进程 |
| 结构化数据 | D1 | 免费额度适合素材元数据和分析结果 |
| 大文件证据 | R2 | 截图、快照与媒体不塞进 D1 |
| 后台任务 | Queues | 采集和 AI 不阻塞用户请求；失败重试 |
| 动态网页 | Browser Run | 妙思是登录后的 SPA，普通 fetch 不够 |
| 模型 | Workers AI | 不需要第三方模型 Key；GLM 中文可用 |
| GPT 接入 | Stateless MCP | Pro 只读 `search` / `fetch`，无需 DO |

MCP 使用 2026 年新版 `createMcpHandler` stateless 模式。MCP 会话状态不承担业务存储，所有业务数据落 D1/R2。

## 3. 数据流

### 3.1 采集

1. Cron 为每个启用的数据源建立 `pipeline_runs`。
2. `collect_source` 消息进入 Queue。
3. Browser Run 访问页面，提取卡片并保存：
   - 页面截图 → R2；
   - 提取 JSON → R2；
   - 快照索引 → D1。
4. 素材按外部 ID 优先、内容 hash 兜底去重。
5. 每次观察写入 `creative_observations`。

### 3.2 分析

1. 新素材、内容变化或历史失败素材进入 Queue。
2. Workers AI 返回固定 JSON schema。
3. 输出解析失败或模型不可用时使用规则引擎，置信度固定降低。
4. 每条素材更新 Hook / gameplay / audience 三个簇。
5. 聚类分数只代表样本规模、近期新增和排名变化，不代表 ROI。

### 3.3 机会卡

机会卡以最近 30 天的 `gameplay_primary × audience_primary` 分组生成，至少需要 2 个样本。评分由：

- 样本规模；
- AI 置信度；
- 排名变化；
- 家长/女性/儿童目标适配；
- 风险扣分；

组成。该分数用于排队，不是立项裁决。

## 4. 证据等级

```text
A：自有广告 + 小游戏埋点 + CRM
B：腾讯大盘排名与持续变化
C：素材时长、变体与跨版位扩散
D：AI 对素材内容的主观推断
```

v0.1 目前主要有 B/D。控制台和摘要会明确提醒，不允许把榜单信号写成高 ROI。

## 5. 认证边界

### 管理员写入

- `/api/admin/*` 要求 `X-Admin-Token` 或 Bearer token；
- 令牌是 Cloudflare Secret；
- 控制台只把令牌保存在当前浏览器 Local Storage。

### 个人 GPT 读取

- `/mcp` 当前无认证，工具仅只读；
- 适合公开素材与内部可共享的选品结论；
- 接入真实投放、CRM、手机号或儿童数据前，必须迁移到 OAuth 或 Cloudflare Access 保护的 MCP。

## 6. 故障策略

| 故障 | 行为 |
|---|---|
| 妙思登录失效 | 保存失败状态，不绕过验证；提示更新 Secret |
| 选择器失效 | 保存页面截图，提示修改 selectors |
| Browser Run 超额 | Queue 重试，最终进入 DLQ |
| Workers AI 429/错误 | 自动使用确定性规则分析 |
| 单条 Queue 失败 | 仅重试该消息，已成功消息立即 ack |
| R2 写入失败 | 本轮采集失败，避免出现无原始证据的“成功” |
| D1 ID 冲突 | external ID / hash 幂等更新 |

## 7. v0.2 推荐顺序

1. 接腾讯官方创意灵感/API，降低浏览器依赖；
2. 建 `campaign_results`、`game_events`、`crm_outcomes` 三张事实表；
3. 使用 click_id / carrier_id 贯穿广告、小游戏和 CRM；
4. 添加图片视觉分析；
5. 对短视频抽 3—5 个关键帧和 ASR；
6. 使用真实有效监护人 CPL 校准机会评分；
7. MCP 加 OAuth；
8. 只在数据闭环后考虑自动 Brief 或素材变体生成。
