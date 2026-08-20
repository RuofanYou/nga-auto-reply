# 个人 ChatGPT Pro 接入

## 1. 部署地址

Cloudflare 部署完成后，MCP 地址为：

```text
https://<worker-name>.<subdomain>.workers.dev/mcp
```

控制台首页会直接显示并提供复制按钮。

## 2. 在 ChatGPT 网页开启开发者模式

截至 2026 年 8 月，个人 ChatGPT Pro 可以在 Developer Mode 连接自定义 MCP 的只读 `search` / `fetch` 权限。完整写入/修改 MCP 仍限 Business、Enterprise 和 Edu。

1. 打开 ChatGPT 网页。
2. Settings → Apps → Advanced settings。
3. 开启 Developer Mode。
4. 创建自定义 App / MCP App。
5. 粘贴 Cloudflare `/mcp` 地址。
6. 保存并连接。
7. 工具描述变化后，在 ChatGPT 中刷新 App。

ChatGPT 只接受远程 HTTPS MCP，不能直接连接 localhost。Cloudflare 部署地址天然满足该要求。

## 3. 工具契约

### `search`

输入：

```json
{ "query": "30-45岁女性 收纳排序" }
```

输出：一个 JSON 文本，包含：

```json
{
  "results": [
    { "id": "creative:...", "title": "...", "url": "https://.../evidence/..." }
  ]
}
```

### `fetch`

输入：

```json
{ "id": "creative:..." }
```

输出完整证据文本、结构化 metadata 和可引用 evidence URL。

两个工具都标注为 read-only、idempotent、non-destructive。

## 4. 推荐提问

```text
@JOJO Creative Radar
搜索最近的“30-45岁女性家长 + 收纳排序”素材和机会卡。
先列证据数量、日期窗口、排名变化和风险，再判断是否值得做广告概念测试。
不要把在榜或持续投放描述成高ROI。
```

```text
@JOJO Creative Radar
比较规则找错、收纳排序、因果救援三个方向。
每个方向至少读取3条素材证据；输出目标受众、前三秒钩子、真实核心玩法、教育构念、开发难度、货不对板风险和证伪条件。
```

```text
@JOJO Creative Radar
读取最新 weekly digest，并追溯里面排名上升最快的5条素材。
把“可观察的事实”和“AI推断”分开写。
```

```text
@JOJO Creative Radar
找出适合20—90秒单局、3秒内理解、两周内能做出竖切的候选机会。
儿童只作为体验者，商业转化必须回到成人家长入口。
```

## 5. 定时报告

数据采集和摘要生成已经由 Cloudflare Cron 独立执行。GPT 不在线也不会中断。

ChatGPT Work / Scheduled Tasks 在你的账号可用时，可以创建一个每日任务，使用 [prompts/chatgpt-daily-report.md](../prompts/chatgpt-daily-report.md)。该任务只负责把 D1 中已经生成的结果整理成聊天报告，不承担采集和数据持久化。

如果 Scheduled Task 对自定义 App 的调用在当前 rollout 中不可用，Cloudflare 端仍会照常生成 digest；打开聊天后手动说“读取最新日报”即可。

## 6. 为什么审批不放 GPT

个人 Pro 自定义 MCP 当前只保证 read/fetch。项目因此把：

- 批准/驳回机会；
- 修改数据源；
- 手动采集；
- JSON 导入；

放在 Cloudflare 控制台，并用 `ADMIN_TOKEN` 保护。这不是妥协式半成品，而是按真实权限边界实现，避免做一个在个人 GPT 中根本不能稳定调用的写工具。

## 7. 数据安全

当前 MCP 没有 OAuth，URL 持有者可以读取其中的素材情报。只放：

- 公共大盘素材；
- 不含手机号、儿童身份和私有经营数字的分析；
- 可在团队内部共享的机会卡。

接入腾讯账户私有投放、叫叫 CRM 或儿童数据前，必须给 MCP 加 OAuth / Cloudflare Access，并进行字段级脱敏。
