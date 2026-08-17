# FeedbackLens EdgeOne Pages 部署指南

> 本指南面向非开发者，按步骤操作即可将 FeedbackLens 部署到腾讯云 EdgeOne Pages，国内访问速度优秀。

---

## 为什么选 EdgeOne Pages？

| 对比项 | Vercel | EdgeOne Pages |
|--------|--------|---------------|
| 国内访问速度 | ⚠️ 慢/不稳定 | ✅ 3200+ 边缘节点，毫秒级响应 |
| 免费额度 | 100GB 带宽/月 | 公测期限制更少 |
| 内置 AI | ❌ 无 | ✅ 边缘节点内置 DeepSeek，免费调用 |
| 域名 | 需备案才能国内加速 | 提供免费临时域名，可先用 |
| 部署方式 | Git 导入 | Git 导入 / CLI 上传 |

---

## 前置准备

部署前需要准备以下账号：

| 服务 | 用途 | 注册地址 | 备注 |
|------|------|----------|------|
| GitHub | 托管代码 | https://github.com | 无限公开仓库 |
| 腾讯云 | EdgeOne Pages 部署 | https://cloud.tencent.com | 可用微信扫码登录 |
| DeepSeek（可选） | AI 分析引擎 | https://platform.deepseek.com | EdgeOne 内置 AI 可替代，注册送 ¥10 |

> **提示**：EdgeOne Pages 内置了 DeepSeek 模型，部署后可直接免费使用 AI 分析功能，无需单独申请 DeepSeek API Key。如果需要更强的模型或更高调用频率，再配置外部 DeepSeek API Key。

---

## 第一步：推送到 GitHub

### 1.1 初始化 Git 仓库

在项目目录下打开终端（VS Code 中按 `Ctrl + ~` 打开终端），执行：

```bash
cd feedbacklens

# 初始化 Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "FeedbackLens 初始版本"

# 设置主分支
git branch -M main
```

### 1.2 创建 GitHub 仓库

1. 登录 https://github.com
2. 点击右上角 **+** → **New repository**
3. 仓库名填 `feedbacklens`
4. 选择 **Public**（公开，EdgeOne 免费版需要公开仓库）
5. **不要**勾选 "Add a README file"（已有代码）
6. 点击 **Create repository**

### 1.3 推送代码

```bash
# 替换为你的 GitHub 用户名
git remote add origin https://github.com/你的用户名/feedbacklens.git

# 推送
git push -u origin main
```

> 如果还没配置 Git 用户名和邮箱：
> ```bash
> git config --global user.name "你的名字"
> git config --global user.email "你的邮箱"
> ```

---

## 第二步：创建 EdgeOne Pages 项目

### 2.1 进入 EdgeOne Pages

1. 登录腾讯云控制台：https://console.cloud.tencent.com/edgeone/pages
2. 点击 **创建项目**

### 2.2 导入 Git 仓库

1. 选择 **导入 Git 仓库**
2. 首次使用需要授权 GitHub：
   - 点击 **GitHub** 图标
   - 跳转到 GitHub 授权页面，点击 **Authorize**
   - 选择你的 `feedbacklens` 仓库
3. 选中仓库后点击 **下一步**

### 2.3 配置构建设置

| 配置项 | 填写内容 |
|--------|---------|
| 框架预设 | Next.js（自动识别） |
| 构建命令 | `npm run build` |
| 输出目录 | `.next` |
| 安装命令 | `npm install` |
| Node.js 版本 | 18.x 或 20.x |

### 2.4 配置环境变量

在 **环境变量** 部分，添加以下变量：

| Key | Value | 必填 | 说明 |
|-----|-------|------|------|
| `DEEPSEEK_API_KEY` | `sk-xxxxx` | 否 | DeepSeek API Key。不填则使用 EdgeOne 内置 AI 或 mock 模式 |
| `DEEPSEEK_API_URL` | `https://api.deepseek.com/v1/chat/completions` | 否 | DeepSeek API 地址 |
| `NEXT_PUBLIC_APP_URL` | （部署后填写） | 否 | 部署后回填域名 |

> **三种 AI 模式说明**：
> - **EdgeOne 内置 AI**（推荐）：无需任何配置，部署后自动生效，免费
> - **外部 DeepSeek API**：在环境变量中填入 `DEEPSEEK_API_KEY`，使用独立账户余额
> - **Mock 模式**：未配置 API Key 且内置 AI 不可用时，返回模拟数据用于演示

### 2.5 选择加速区域

| 选项 | 适用场景 |
|------|---------|
| 全球可用区（不含中国大陆） | 没有备案域名，临时使用 |
| 全球可用区（含中国大陆） | 有备案域名，需要国内加速 |

> 没有备案域名？先选「不含中国大陆」，部署后 EdgeOne 会分配一个 `xxx.edgeone.app` 的免费域名，可以正常访问。后续备案后可切换。

### 2.6 开始部署

1. 确认配置无误，点击 **开始部署**
2. 等待 2-3 分钟构建完成
3. 看到绿色 **部署成功** 即完成

---

## 第三步：验证上线

部署完成后，EdgeOne 会分配一个域名（如 `feedbacklens-xxx.edgeone.app`）。

打开这个域名，依次测试：

1. ✅ 落地页正常展示
2. ✅ 点击"开始分析"跳转到上传页
3. ✅ 上传页显示免费额度（"已使用 0/3 次"）
4. ✅ 加载示例数据 → 开始分析 → 跳转到分析中页面
5. ✅ 分析完成后跳转到结果看板（图表正常显示）
6. ✅ 点击"详细报告"能查看完整报告
7. ✅ 点击"导出PDF"能触发打印
8. ✅ 注册/登录功能正常（Mock 模式或 Supabase）
9. ✅ 历史记录页面显示分析记录
10. ✅ 免费额度消耗后数字更新（0/3 → 1/3）

---

## 第四步：域名绑定（可选）

### 4.1 前提条件

- 拥有已备案的域名（.com / .cn 等）
- 备案完成时间通常需要 7-20 个工作日

> 没有域名？可以在阿里云/腾讯云购买，.com 约 ¥55/年。
> 备案需要域名 + 腾讯云服务器（轻量应用服务器 ¥60/月起）。

### 4.2 在 EdgeOne 绑定域名

1. 进入 EdgeOne Pages → 项目 → **项目设置** → **域名**
2. 点击 **添加域名**
3. 输入你的域名（如 `feedbacklens.com` 或 `app.feedbacklens.com`）
4. EdgeOne 会显示 CNAME 记录值

### 4.3 配置 DNS

到域名注册商的 DNS 管理页面：

1. 添加一条 **CNAME** 记录
   - 主机记录：`@`（或 `app` 等子域名）
   - 记录类型：CNAME
   - 记录值：EdgeOne 提供的 CNAME 地址
2. 保存，等待 DNS 生效（5-30 分钟）
3. EdgeOne 会自动签发 SSL 证书（免费）

### 4.4 更新环境变量

域名绑定成功后：
1. 回到 EdgeOne Pages → 项目 → **环境变量**
2. 将 `NEXT_PUBLIC_APP_URL` 更新为 `https://你的域名.com`
3. 触发一次重新部署

---

## 第五步：配置 Supabase 认证（可选）

> 不配置 Supabase 也能用——系统会自动使用 Mock 认证（本地 localStorage），适合 MVP 阶段。

### 5.1 创建 Supabase 项目

1. 登录 https://supabase.com
2. 点击 **New Project**，填写名称和密码
3. Region 选择 `Southeast Asia (Singapore)`
4. 等待约 2 分钟初始化

### 5.2 获取密钥

1. 左侧菜单 → **Settings** → **API**
2. 复制 **Project URL** 和 **anon public** 密钥

### 5.3 配置到 EdgeOne

在 EdgeOne Pages → 项目 → **环境变量** 中添加：

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxxxx...` |

添加后触发重新部署。

### 5.4 更新 Supabase 回调地址

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL** 改为你的 EdgeOne 域名
3. **Redirect URLs** 添加 `https://你的域名/**`

---

## 常见问题

### Q: 部署后页面白屏？

检查 EdgeOne 构建日志（项目 → 部署详情 → 构建日志），看是否有编译错误。最常见的是 Node.js 版本不兼容。

### Q: AI 分析功能报错？

1. 检查是否选择了正确的加速区域
2. 查看函数日志（项目 → 函数 → 日志）
3. 如果使用外部 DeepSeek API，确认 API Key 正确且余额充足
4. 如果都没配，系统会自动降级到 Mock 模式（返回模拟数据）

### Q: EdgeOne 内置 AI 有什么限制？

- 公测期间免费使用
- 模型为 DeepSeek-V3 优化版
- 有一定的速率限制（具体以官方公告为准）
- 适合 MVP 阶段，商业化后建议切换到独立 DeepSeek API

### Q: EdgeOne Pages 免费额度够用吗？

- 公测期间限制较少
- 带宽、存储、函数调用均有充足免费额度
- 对于 MVP 阶段（日活 < 1000）完全够用
- 具体额度以腾讯云官方文档为准

### Q: 如何更新网站？

推送代码到 GitHub 的 main 分支，EdgeOne 会自动检测并重新部署。也可以在控制台手动触发重新部署。

### Q: 和 Vercel 部署有什么区别？

| 方面 | EdgeOne | Vercel |
|------|---------|--------|
| API 处理 | Edge Function (`/functions/api/analyze.js`) | Route Handler (`/src/app/api/analyze/route.ts`) |
| 环境变量 | 在控制台配置 | 在 Vercel Dashboard 配置 |
| AI 调用 | 优先用内置 AI，回退到外部 API | 只能用外部 DeepSeek API |
| 国内速度 | ✅ 快 | ⚠️ 慢/不稳定 |

两套部署代码都保留了，你可以随时切换部署平台。

---

## 运维监控

| 指标 | 查看位置 | 告警阈值 |
|------|----------|----------|
| 网站可用性 | EdgeOne Pages → 项目概览 | 响应时间 > 3s |
| 函数错误率 | EdgeOne Pages → 函数 → 日志 | 错误率 > 5% |
| DeepSeek 余额 | https://platform.deepseek.com → 账户 | < ¥5 时充值 |
| Supabase 用量 | Supabase Dashboard → Settings → Usage | 数据库 > 400MB |

---

## 项目文件结构

```
feedbacklens/
├── functions/              # EdgeOne Edge Functions（生产环境 API）
│   └── api/
│       └── analyze.js      # AI 分析 Edge Function
├── src/
│   ├── app/
│   │   ├── api/analyze/    # Next.js Route Handler（本地开发用）
│   │   └── ...             # 页面组件
│   ├── lib/
│   │   ├── ai/             # AI 客户端 + 分析引擎
│   │   ├── auth.tsx        # 认证上下文
│   │   ├── quota.ts        # 免费额度管理
│   │   └── history.ts      # 历史记录管理
│   └── components/         # UI 组件
├── edgeone.json            # EdgeOne Pages 配置
├── vercel.json             # Vercel 配置（备用）
├── next.config.mjs         # Next.js 配置
└── DEPLOY.md               # Vercel 部署指南（备用）
```

---

*最后更新：2026-08-15*
