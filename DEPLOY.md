# FeedbackLens 部署指南

> 本指南面向非开发者，按步骤操作即可将 FeedbackLens 部署上线。

---

## 前置准备

部署前需要准备以下账号（全部免费）：

| 服务 | 用途 | 注册地址 | 免费额度 |
|------|------|----------|----------|
| GitHub | 托管代码 | https://github.com | 无限公开仓库 |
| Vercel | 部署网站 | https://vercel.com | Hobby 计划免费 |
| Supabase | 用户认证 + 数据库 | https://supabase.com | 500MB 数据库 / 50000 月活 |
| DeepSeek | AI 分析引擎 | https://platform.deepseek.com | 注册送 ¥10 余额 |

---

## 第一步：创建 GitHub 仓库

1. 登录 GitHub，点击右上角 **+** → **New repository**
2. 仓库名填 `feedbacklens`
3. 选择 **Private**（私有）或 **Public**（公开均可）
4. 勾选 **Add a README file**
5. 点击 **Create repository**

> 创建完成后先放着，后面推送代码用。

---

## 第二步：配置 Supabase

### 2.1 创建项目

1. 登录 https://supabase.com
2. 点击 **New Project**
3. 填写：
   - Name: `feedbacklens`
   - Database Password: 设置一个强密码，**记下来**
   - Region: 选择 `Southeast Asia (Singapore)` 或最近的区域
4. 点击 **Create new project**，等待约 2 分钟初始化

### 2.2 获取 API 密钥

1. 进入项目后，左侧菜单 → **Settings** → **API**
2. 找到以下两项，**复制保存**：
   - **Project URL**（形如 `https://xxxxx.supabase.co`）
   - **anon public** 密钥（一长串字母数字）

### 2.3 配置认证方式

1. 左侧菜单 → **Authentication** → **Providers**
2. 确认 **Email** 已启用
3. （可选）关闭 "Confirm email" 以简化注册流程：
   - **Authentication** → **Settings** → **User Signups** → 关闭 `Confirm email`

---

## 第三步：获取 DeepSeek API Key

1. 登录 https://platform.deepseek.com
2. 左侧菜单 → **API Keys**
3. 点击 **Create API Key**
4. 复制生成的 API Key（形如 `sk-xxxxxxxx`）

> 新用户注册赠送 ¥10 余额，约可分析 500 次反馈（每次约 ¥0.02）。

---

## 第四步：推送到 GitHub

在项目目录下打开终端，执行：

```bash
# 初始化 Git（如果还没有的话）
git init

# 添加所有文件
git add .

# 提交
git commit -m "FeedbackLens 初始版本"

# 设置主分支
git branch -M main

# 添加远程仓库（替换为你的 GitHub 地址）
git remote add origin https://github.com/你的用户名/feedbacklens.git

# 推送
git push -u origin main
```

> 如果还没有配置 Git 全局用户名和邮箱：
> ```bash
> git config --global user.name "你的名字"
> git config --global user.email "你的邮箱"
> ```

---

## 第五步：Vercel 部署

### 5.1 导入项目

1. 登录 https://vercel.com（可用 GitHub 账号一键登录）
2. 点击 **Add New** → **Project**
3. 在 "Import Git Repository" 列表中找到 `feedbacklens`
4. 点击 **Import**

### 5.2 配置环境变量

在部署页面，展开 **Environment Variables** 部分，添加以下变量：

| Key | Value | 说明 |
|-----|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | 第二步获取的 Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxxxx...` | 第二步获取的 anon key |
| `DEEPSEEK_API_KEY` | `sk-xxxxx` | 第三步获取的 API Key |
| `DEEPSEEK_API_URL` | `https://api.deepseek.com/v1/chat/completions` | DeepSeek API 地址 |
| `NEXT_PUBLIC_APP_URL` | `https://feedbacklens.vercel.app` | 部署后的域名（先填默认，后面改） |

### 5.3 部署

1. 其他设置保持默认（Framework Preset 自动识别为 Next.js）
2. 点击 **Deploy**
3. 等待 2-3 分钟构建完成
4. 看到绿色 "Congratulations" 界面即部署成功

### 5.4 更新生产域名

1. 部署完成后，Vercel 会分配一个域名（如 `feedbacklens-xxx.vercel.app`）
2. 回到 Vercel Dashboard → 项目 → **Settings** → **Environment Variables**
3. 将 `NEXT_PUBLIC_APP_URL` 更新为这个域名
4. 触发一次 Redeploy（Deployments → 最新部署 → 右侧菜单 → Redeploy）

---

## 第六步：域名绑定（可选）

### 6.1 购买域名

推荐注册商：
- 阿里云万网：https://wanwang.aliyun.com（.com 约 ¥55/年）
- 腾讯云：https://dnspod.cloud.tencent.com
- Namecheap：https://www.namecheap.com（海外，更便宜）

### 6.2 在 Vercel 绑定域名

1. Vercel Dashboard → 项目 → **Settings** → **Domains**
2. 输入你购买的域名（如 `feedbacklens.com`）
3. 点击 **Add**
4. Vercel 会显示需要添加的 DNS 记录：
   - 添加一条 `A` 记录，指向 `76.76.21.21`
   - 或添加一条 `CNAME` 记录，指向 `cname.vercel-dns.com`
5. 到域名注册商的 DNS 管理页面，添加上述记录
6. 等待 DNS 生效（通常 5-30 分钟）
7. Vercel 会自动签发 SSL 证书（免费）

### 6.3 更新环境变量

域名绑定成功后，将 `NEXT_PUBLIC_APP_URL` 更新为 `https://你的域名.com`，然后 Redeploy。

### 6.4 更新 Supabase 认证回调

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL** 改为 `https://你的域名.com`
3. **Redirect URLs** 添加 `https://你的域名.com/**`

---

## 第七步：验证上线

打开你的域名，依次测试：

1. ✅ 落地页正常展示
2. ✅ 点击"开始分析"跳转到上传页
3. ✅ 上传页显示免费额度（"已使用 0/3 次"）
4. ✅ 加载示例数据 → 开始分析 → 跳转到分析中页面
5. ✅ 分析完成后跳转到结果看板
6. ✅ 结果看板显示图表和数据
7. ✅ 点击"详细报告"能查看完整报告
8. ✅ 点击"导出PDF"能触发打印
9. ✅ 注册/登录功能正常
10. ✅ 历史记录页面显示分析记录
11. ✅ 免费额度消耗后数字更新（0/3 → 1/3）

---

## 常见问题

### Q: 部署后页面白屏？

检查 Vercel 部署日志（Deployments → 点击最新部署 → Build Logs），看是否有编译错误。最常见的是环境变量未配置导致构建失败。

### Q: 分析功能报错？

1. 确认 `DEEPSEEK_API_KEY` 已正确配置
2. 检查 DeepSeek 账户余额是否充足
3. 查看 Vercel Functions 日志（Dashboard → 项目 → Logs）

### Q: 登录/注册不工作？

1. 确认 Supabase URL 和 anon key 配置正确
2. 检查 Supabase Authentication 设置中 Email provider 是否启用
3. 如果绑定了域名，确保 Supabase 的 Site URL 和 Redirect URLs 已更新

### Q: Vercel 免费额度够用吗？

Vercel Hobby 计划：
- 100GB 带宽/月
- 100GB-Hours Serverless 函数执行/月
- 对于 MVP 阶段（日活 < 1000）完全够用

### Q: DeepSeek 费用预估？

- 每次分析约消耗 2000-5000 tokens
- DeepSeek 定价：输入 ¥0.001/千 tokens，输出 ¥0.002/千 tokens
- 单次分析成本约 ¥0.01-0.03
- 每日 100 次分析 ≈ ¥1-3/天

---

## 运维监控

| 指标 | 查看位置 | 告警阈值 |
|------|----------|----------|
| 网站可用性 | Vercel Dashboard → Overview | 响应时间 > 5s |
| 函数错误率 | Vercel Dashboard → Logs | 错误率 > 5% |
| DeepSeek 余额 | https://platform.deepseek.com → 账户 | < ¥5 时充值 |
| Supabase 用量 | Supabase Dashboard → Settings → Usage | 数据库 > 400MB |

---

*最后更新：2026-08-14*
