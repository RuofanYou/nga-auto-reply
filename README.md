# 🎯 NGA 自动顶帖工具 - 小白保姆级教程

> 每天 **08:00** 和 **20:00** 自动帮你回帖顶帖，完全免费！

---

## 📋 你需要准备什么？

| 需要 | 说明 |
|------|------|
| ✅ NGA 账号 | 你必须是帖子的**发帖人**才能顶帖 |
| ✅ GitHub 账号 | 免费注册：https://github.com/signup |
| ✅ Chrome 浏览器 | 用来获取 Cookie |

---

## 第一步：注册 GitHub 账号

如果你已经有 GitHub 账号，跳到第二步。

1. 打开 https://github.com/signup
2. 输入邮箱、密码、用户名
3. 完成验证，点击 Create account
4. 去邮箱点击验证链接

---

## 第二步：复制（Fork）这个项目

1. **点击这个链接**：https://github.com/RuofanYou/nga-auto-reply

2. **点击右上角的 "Fork" 按钮**
   
   ![Fork按钮位置](https://docs.github.com/assets/cb-40742/images/help/repository/fork-button.png)

3. 在弹出的页面直接点击 **"Create fork"**

4. 等待几秒，你就拥有了自己的项目副本！

---

## 第三步：获取你的 NGA Cookie（最关键！）

> ⚠️ **Cookie 相当于你的登录凭证，不要分享给任何人！**

### 3.1 打开 NGA 并登录

- 必须访问这个地址：**https://bbs.nga.cn/**
- 确保你已经登录了你的账号

### 3.2 打开浏览器开发者工具

**Windows 用户**：按键盘 `F12`  
**Mac 用户**：按 `Cmd + Option + I`

会弹出一个工具面板（通常在右边或下边）

### 3.3 找到 Cookie

1. 点击顶部的 **"Application"**（应用程序）标签
   - 如果看不到，点击 `>>` 展开更多
   
2. 在左边找到 **Storage（存储）** → **Cookies** → 点击 **https://bbs.nga.cn**

3. 你会看到一个表格，找到这两行：

| Name | Value |
|------|-------|
| `ngaPassportUid` | 一串数字（比如 12345678） |
| `ngaPassportCid` | 一长串字母数字 |

4. **分别双击 Value 列，复制这两个值**

5. 按下面格式组合成一行（注意分号和空格）：
   ```
   ngaPassportUid=你的数字; ngaPassportCid=你的长串
   ```
   
   **示例**：
   ```
   ngaPassportUid=12345678; ngaPassportCid=abc123def456ghi789
   ```

---

## 第四步：获取你的帖子 ID

1. 打开你要顶的帖子
2. 看浏览器地址栏，找到 `tid=` 后面的数字

   **例如**：`https://bbs.nga.cn/read.php?tid=28917800`
   
   这里的帖子 ID 就是 **28917800**

---

## 第五步：配置你的项目

### 5.1 进入你 Fork 的项目

1. 打开 https://github.com
2. 点击右上角你的头像 → **Your repositories**
3. 找到并点击 **nga-auto-reply**

### 5.2 添加密钥（Secrets）

1. 点击项目页面的 **Settings**（设置）标签

2. 在左边菜单找到 **Secrets and variables** → 点击 **Actions**

3. 点击绿色按钮 **"New repository secret"**

4. **添加第一个密钥**：
   - Name（名称）：`NGA_COOKIE`
   - Secret（值）：粘贴你在第三步组合的 Cookie
   - 点击 **Add secret**

5. **添加第二个密钥**（再点一次 New repository secret）：
   - Name：`NGA_TID`
   - Secret：你的帖子 ID（比如 28917800）
   - 点击 **Add secret**

6. **添加第三个密钥**：
   - Name：`NGA_FID`
   - Secret：`306`（魔兽世界版块就填 306）
   - 点击 **Add secret**

### 5.3 确认添加成功

回到 Secrets 页面，你应该能看到三个密钥：
- `NGA_COOKIE`
- `NGA_TID`
- `NGA_FID`

---

## 第六步：启用自动运行

1. 进入你的项目页面

2. 点击顶部的 **Actions** 标签

3. 如果看到黄色提示框，点击 **"I understand my workflows, go ahead and enable them"**

4. 点击左边的 **"NGA Auto Reply"**

5. 点击右边的 **"Run workflow"** → 再点击绿色的 **"Run workflow"**

6. 等待约 30 秒，刷新页面，看到 ✅ 绿色勾就成功了！

---

## 🎉 完成！

从现在开始，系统会在每天 **08:00** 和 **20:00**（北京时间）自动帮你回帖！

---

## ❓ 常见问题

### Q: 运行失败了怎么办？

点击失败的运行记录，查看错误日志。最常见的原因：
- Cookie 复制不完整或格式错误
- 帖子 ID 填错了

### Q: Cookie 会过期吗？

会的，大约几个月后过期。过期后重新获取 Cookie，更新 `NGA_COOKIE` 密钥即可。

### Q: 时间不准怎么办？

GitHub Actions 可能有 5-15 分钟延迟，这是正常的。

### Q: 可以改成其他时间吗？

需要修改 `.github/workflows/nga-auto-reply.yml` 文件中的 cron 表达式。

### Q: 可以自定义回复内容吗？

可以！编辑项目中的 `replies.txt` 文件，每行一条回复内容。

---

## ⚠️ 安全提醒

- **Cookie 是你的登录凭证**，千万不要分享给任何人
- GitHub Secrets 是加密存储的，只有你能看到
- 如果担心安全，可以定期更换 NGA 密码（会使旧 Cookie 失效）

---

## 📞 需要帮助？

如果遇到问题，可以在项目的 Issues 页面提问。
