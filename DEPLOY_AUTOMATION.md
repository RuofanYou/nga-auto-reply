# Cloudflare 自动部署

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/RuofanYou/nga-auto-reply/tree/jojo-radar-deploy)

Cloudflare 官方部署流程将：

1. 从公开的 `jojo-radar-deploy` 独立分支创建一个新的 GitHub 仓库；
2. 自动预配 D1、R2、Queues、Workers AI 与 Browser Run bindings；
3. 在部署脚本中执行 D1 migrations；
4. 发布 Worker、静态控制台、Cron、Queue consumer 和 `/mcp`；
5. 建立 GitHub 到 Cloudflare 的持续部署。

部署表单会要求账号所有者授权 Cloudflare，并安全录入 `ADMIN_TOKEN`；`ADMUSE_COOKIE` 可留空后补。外部代理不能代签账号授权或读取腾讯登录凭证。
