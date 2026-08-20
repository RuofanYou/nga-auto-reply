# 腾讯妙思数据源设置

## 先讲硬边界

妙思是登录后的腾讯网页应用。项目不会：

- 绕过登录；
- 自动破解二维码/验证码；
- 逆向未公开的私有接口；
- 对抗平台风控；
- 获取当前账号无权访问的数据。

自动化只复用你已有、经过授权的浏览器会话。页面改版后，CSS selectors 需要调整。

## 1. 取得 Cookie

1. 用普通 Chrome 打开 `https://admuse.qq.com/#/idea` 并完成登录。
2. 打开 DevTools → Network。
3. 刷新页面，选中一个发往 `admuse.qq.com` 的已登录请求。
4. 在 Request Headers 中复制完整 `Cookie` 值。
5. 在项目目录执行：

```bash
npx wrangler secret put ADMUSE_COOKIE
```

6. 粘贴后回车。

不要把 Cookie 放在：

- ChatGPT 对话；
- `.dev.vars.example`；
- D1 source config；
- GitHub；
- 飞书消息；
- 日志。

采集器会把 Cookie 拆成浏览器 cookie，仅绑定到妙思站点 origin。它不会通过 `setExtraHTTPHeaders` 向第三方子资源广播 Cookie。

## 2. 跑第一轮

打开 Cloudflare 控制台页面：

1. 管理 → 填管理员令牌；
2. 在“腾讯妙思｜获得灵感”右侧点 **运行**；
3. 查看最近运行状态。

正常结果：

- R2 中出现 PNG 页面证据；
- R2 中出现 JSON 结构化快照；
- D1 `creatives` 增加记录；
- Queue 中出现分析消息；
- 分析完成后趋势簇开始出现。

## 3. 页面打开但抓不到卡

编辑数据源，更新 `config.selectors`：

```json
{
  "maxCards": 30,
  "waitMs": 7000,
  "selectors": {
    "card": "实际素材卡容器选择器",
    "title": "卡内标题选择器",
    "advertiser": "卡内广告主选择器",
    "link": "a[href]",
    "image": "img",
    "video": "video",
    "rank": "排名元素选择器"
  }
}
```

选择器原则：

- `card` 尽量指向一条素材的最小完整容器；
- 先在 DevTools Console 用 `document.querySelectorAll('...').length` 验证；
- 不要使用依赖单次构建 hash 的超长 class；
- 优先 `data-*`、稳定语义 class、ARIA 属性；
- `maxCards` 第一版保持 20—50，别直接抓几百条。

## 4. 登录过期

运行状态会显示“页面返回登录态”。重新取得 Cookie 并覆盖 Secret：

```bash
npx wrangler secret put ADMUSE_COOKIE
```

无需重新部署。

## 5. 风控或验证码

停止重复采集。反复触发只会加重账号风险和消耗 Browser Run 时间。使用人工导入：

```json
{
  "sourceId": "manual-import",
  "creatives": [
    {
      "externalId": "your-id",
      "title": "素材标题",
      "advertiser": "广告主",
      "platform": "腾讯广告",
      "industry": "益智游戏",
      "mediaType": "video",
      "mediaUrl": "https://...",
      "canonicalUrl": "https://...",
      "rank": 12,
      "rawText": "素材可见文案和人工备注"
    }
  ]
}
```

控制台上传 JSON 后，去重、AI、聚类、机会卡和 GPT 检索仍然自动完成。

## 6. 为什么没有承诺“自动永久登录”

腾讯可能调整会话时长、设备校验、扫码要求和风控。任何声称无需授权即可永久自动登录的实现都不可信。这里把登录失效设计成可观测故障，剩余链路保持可用。
