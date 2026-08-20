# 运行与排障

## 健康检查

```bash
curl https://<worker>/api/health
curl https://<worker>/api/summary
```

## 实时日志

```bash
npm run tail
```

日志是 JSON，关键 event：

- `cron.started`
- `cron.collection.queued`
- `collector.source.failed`
- `collector.browser.closed`
- `creative.ingest.completed`
- `creative.analysis.ai_fallback`
- `pipeline.message.completed`
- `pipeline.message.failed`

## 查看死信队列

```bash
npx wrangler queues list
```

在 Cloudflare Dashboard → Queues → `jojo-creative-radar-dead` 查看失败消息。修复原因后重新触发数据源，不要盲目无限重放。

## 更新部署

```bash
npm install
npm run validate
npm run deploy:dry
npm run deploy
```

工具 schema 或描述变化后，在 ChatGPT 自定义 App 中刷新连接。

## 回滚

```bash
npx wrangler versions list
npx wrangler rollback
```

D1 migration 不会随 Worker rollback 自动回滚。新 migration 必须保持向后兼容，破坏性变更先备份。

## 常见错误

### `database_id` 仍是全 0

```bash
npm run provision
```

该脚本会创建/查找 D1 并自动回填 UUID。

### `ADMIN_TOKEN_NOT_CONFIGURED`

```bash
npx wrangler secret put ADMIN_TOKEN
```

至少 24 位随机字符串。

### `页面返回登录态`

更新 `ADMUSE_COOKIE`。见 `ADMUSE_SETUP.md`。

### Workers AI 429 / out of capacity

系统自动使用规则引擎并把模型记为 `heuristic-v1`。降低 `MAX_DAILY_ANALYSIS`，稍后可对失败或低置信度素材做重新分析。

### Browser Run 用量超限

免费计划每天只有有限浏览器时长。减少数据源数量、`maxCards` 和 `waitMs`，避免手动连续点“运行”。

### GPT 搜不到刚导入的数据

检查：

1. `/api/summary` 是否增加；
2. Queue 是否处理完；
3. ChatGPT App 是否连接到正确 Worker；
4. 使用更短关键词，例如“收纳 家长”；
5. 工具变更后刷新自定义 App。
