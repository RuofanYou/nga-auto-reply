# NGA 自动顶帖方案

> 自动化在每天 08:00 和 20:00 回复招募帖以保持活跃

---

## 🍪 第一步：获取 NGA Cookie

### 详细步骤（Chrome 浏览器）

1. **打开 NGA 并登录**
   - 必须访问 `https://bbs.nga.cn/`（不是 ngabbs.cn）
   - 确保你已登录账号

2. **打开开发者工具**
   - 按 `F12` 或 `Cmd+Option+I`（Mac）
   - 或者右键页面 → "检查"

3. **切换到 Application（应用程序）面板**
   - ⚠️ **重点**：不是 Network，是 **Application**！
   - 如果看不到，点击 `>>` 展开更多面板

4. **找到 Cookie**
   - 左侧边栏找到 **Storage（存储）** → **Cookies**
   - 展开后点击 `https://bbs.nga.cn`

5. **复制关键 Cookie 值**
   - 找到以下字段并记录它们的 **Value**：
     - `ngaPassportUid`
     - `ngaPassportCid`
     - （可能还有 `lastvisit` 等）
   - 格式化为：`ngaPassportUid=xxx; ngaPassportCid=yyy`

### 备选方法：从 Network 获取

1. 打开开发者工具 → **Network（网络）** 面板
2. 刷新页面
3. 点击第一个请求（通常是 `bbs.nga.cn` 或 `read.php`）
4. 右侧选择 **Headers（标头）**
5. 向下滚动找到 **Request Headers** → **Cookie**
6. 复制整个 Cookie 字符串

---

## 🚀 第二步：创建独立 GitHub 仓库

在终端中执行以下命令：

```bash
# 1. 进入目录
cd /Users/rofan/Cursor/魔兽插件/自动化顶帖

# 2. 初始化 Git 仓库
git init

# 3. 添加所有文件
git add .

# 4. 首次提交
git commit -m "🎉 初始化：NGA自动顶帖工具"

# 5. 在 GitHub 上创建仓库后，添加远程源
# ⚠️ 替换 YOUR_USERNAME 为你的 GitHub 用户名
git remote add origin https://github.com/YOUR_USERNAME/nga-auto-reply.git

# 6. 推送到 GitHub
git branch -M main
git push -u origin main
```

---

## 🔐 第三步：配置 GitHub Secrets

1. 进入你的 GitHub 仓库
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下三个 Secrets：

| Name | Value |
|------|-------|
| `NGA_COOKIE` | `ngaPassportUid=xxx; ngaPassportCid=yyy`（你的Cookie） |
| `NGA_TID` | `28917800`（你的帖子ID） |
| `NGA_FID` | `306`（魔兽世界版块） |

---

## ✅ 第四步：测试运行

### 手动触发测试
1. 进入仓库 → **Actions** 标签页
2. 左侧选择 **NGA Auto Reply**
3. 点击 **Run workflow** → **Run workflow**
4. 查看运行日志确认是否成功

### 查看定时任务
工作流会在每天 **08:00** 和 **20:00**（北京时间）自动运行。

---

## 📁 文件说明

| 文件 | 用途 |
|------|------|
| `nga_reply.py` | Python 回帖脚本 |
| `config.example.yaml` | 本地测试用配置模板 |
| `.github/workflows/nga-auto-reply.yml` | GitHub Actions 工作流 |
| `requirements.txt` | Python 依赖 |
| `replies.txt` | 预设回复内容（每行一条，随机选择） |

---

## ⚠️ 注意事项

- **Cookie 有效期**：NGA Cookie 几个月后可能过期，需更新
- **频率限制**：每天仅 2 次，符合 NGA 规则
- **时间延迟**：GitHub Actions 可能有 5-15 分钟延迟
- **安全性**：Cookie 只存在 GitHub Secrets 中，不会泄露

---

## �️ 本地测试

```bash
cd /Users/rofan/Cursor/魔兽插件/自动化顶帖
pip install -r requirements.txt
cp config.example.yaml config.yaml
# 编辑 config.yaml 填入你的 Cookie
python nga_reply.py
```
