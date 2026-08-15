import Link from "next/link";
import {
  Upload,
  Brain,
  FileBarChart,
  ArrowRight,
  Check,
  Zap,
  Clock,
  TrendingDown,
  Shield,
  Target,
  Layers,
  Lightbulb,
  FileDown,
  ChevronDown,
  Users,
  Building2,
} from "lucide-react";

const faqs = [
  {
    q: "支持哪些格式的反馈数据？",
    a: "目前支持 CSV 文件上传和文本批量粘贴两种方式。CSV 需为 UTF-8 编码，包含文本列即可自动识别。文本粘贴每行一条反馈，至少 5 条起分析。",
  },
  {
    q: "一次最多能分析多少条反馈？",
    a: "单次最多支持 1000 条反馈。如果您的反馈量更大，建议分批上传或联系我们提供企业版方案。",
  },
  {
    q: "AI 分析的准确率怎么样？",
    a: "我们采用三步深度分析（聚类 → 情感+优先级 → 改进建议），每步独立优化 Prompt。对于中文反馈的聚类准确率通常在 90% 以上，情感分析准确率约 95%。",
  },
  {
    q: "数据安全吗？会被用于训练吗？",
    a: "您的反馈数据仅用于本次分析，不会被存储或用于模型训练。分析完成后原始数据在服务端不留存。登录用户的历史记录仅保存在自己的账户下。",
  },
  {
    q: "免费额度是多少？",
    a: "未登录用户每天 3 次免费分析，登录后每天 10 次。如果需要更多额度或团队协作功能，可以升级到 Pro 版本。",
  },
  {
    q: "分析结果可以导出吗？",
    a: "可以。分析完成后支持一键导出 PDF 报告，包含聚类分布图、情感占比图、优先级矩阵和改进建议，可直接用于团队汇报。",
  },
];

const features = [
  {
    icon: Layers,
    title: "智能聚类分组",
    desc: "AI 自动将相似反馈归组，生成主题标签，无需手动打标签",
    color: "text-chart-2",
  },
  {
    icon: Brain,
    title: "情感分析",
    desc: "正面/负面/中性三态标注，量化用户情绪分布",
    color: "text-chart-3",
  },
  {
    icon: Target,
    title: "优先级排序",
    desc: "按频次 × 影响面计算优先级，帮你聚焦最该修的问题",
    color: "text-chart-4",
  },
  {
    icon: Lightbulb,
    title: "改进建议",
    desc: "针对每个聚类生成可执行的改进建议，附带影响力和实施成本评估",
    color: "text-chart-5",
  },
  {
    icon: FileBarChart,
    title: "可视化看板",
    desc: "聚类分布图 + 情感占比图 + 优先级矩阵，一屏看清全局",
    color: "text-primary",
  },
  {
    icon: FileDown,
    title: "PDF 导出",
    desc: "一键导出分析报告，排版精美，直接用于团队汇报",
    color: "text-chart-2",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-primary/3 to-background">
        {/* 背景装饰 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-20 right-10 h-64 w-64 rounded-full bg-chart-2/10 blur-3xl" />
          <div className="absolute top-40 left-10 h-48 w-48 rounded-full bg-chart-3/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Zap className="h-4 w-4" />
            AI 驱动 · 10 秒出报告
          </div>
          <h1 className="animate-fade-in mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            10 秒分析 1000 条
            <br />
            <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              用户反馈
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            AI 自动聚类、情感分析、优先级排序，一键生成可视化报告和改进建议。
            把产品团队半天的工作压缩到 10 秒。
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/upload"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 sm:w-auto"
            >
              免费试用
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/result/demo"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-8 text-base font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
            >
              查看示例
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            无需注册即可试用 3 次 · 支持 CSV 上传和文本粘贴
          </p>
        </div>
      </section>

      {/* ===== 信任背书 ===== */}
      <section className="border-y border-border bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            <div>
              <div className="text-2xl font-bold text-foreground sm:text-3xl">10 秒</div>
              <div className="text-xs text-muted-foreground sm:text-sm">单次分析耗时</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground sm:text-3xl">1000+</div>
              <div className="text-xs text-muted-foreground sm:text-sm">最大处理量</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground sm:text-3xl">90%</div>
              <div className="text-xs text-muted-foreground sm:text-sm">聚类准确率</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground sm:text-3xl">3 步</div>
              <div className="text-xs text-muted-foreground sm:text-sm">深度分析流程</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 三步流程 ===== */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">三步完成反馈分析</h2>
          <p className="text-muted-foreground">从导入到报告，全程自动化</p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Step 1 */}
          <div className="group relative rounded-xl border border-border bg-card p-8 text-center shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="absolute right-4 top-4 text-5xl font-bold text-primary/5 transition-colors group-hover:text-primary/10">
              01
            </div>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">导入反馈</h3>
            <p className="text-sm text-muted-foreground">
              支持 CSV 文件上传或文本批量粘贴，自动识别反馈内容列
            </p>
          </div>
          {/* Step 2 */}
          <div className="group relative rounded-xl border border-border bg-card p-8 text-center shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="absolute right-4 top-4 text-5xl font-bold text-chart-2/5 transition-colors group-hover:text-chart-2/10">
              02
            </div>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-chart-2/10">
              <Brain className="h-7 w-7 text-chart-2" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">AI 分析</h3>
            <p className="text-sm text-muted-foreground">
              智能聚类分组、情感分析、优先级评估，三步深度处理
            </p>
          </div>
          {/* Step 3 */}
          <div className="group relative rounded-xl border border-border bg-card p-8 text-center shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="absolute right-4 top-4 text-5xl font-bold text-chart-3/5 transition-colors group-hover:text-chart-3/10">
              03
            </div>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-chart-3/10">
              <FileBarChart className="h-7 w-7 text-chart-3" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">生成报告</h3>
            <p className="text-sm text-muted-foreground">
              可视化看板 + 详细报告 + 改进建议，支持 PDF 导出
            </p>
          </div>
        </div>
      </section>

      {/* ===== 功能特性 ===== */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">六大核心能力</h2>
            <p className="text-muted-foreground">从原始反馈到可执行方案，一站搞定</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <feat.icon className={`h-6 w-6 ${feat.color}`} />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 效果对比 ===== */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">手动分析 vs AI 分析</h2>
            <p className="text-muted-foreground">效率提升一目了然</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-4 text-left text-sm font-semibold sm:px-6">
                    对比维度
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground sm:px-6">
                    手动分析
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-primary sm:px-6">
                    反馈洞察 AI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                <tr>
                  <td className="px-4 py-4 text-sm sm:px-6">处理 500 条反馈</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4 flex-shrink-0" /> 4-6 小时
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-primary sm:px-6">
                    <span className="inline-flex items-center gap-1">
                      <Zap className="h-4 w-4 flex-shrink-0" /> 约 15 秒
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 text-sm sm:px-6">聚类分组</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                    逐条阅读、手动打标签
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-primary sm:px-6">
                    <Check className="mr-1 inline h-4 w-4" />
                    AI 自动聚类
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 text-sm sm:px-6">情感分析</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                    主观判断，难以量化
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-primary sm:px-6">
                    <Check className="mr-1 inline h-4 w-4" />
                    数据驱动，客观准确
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 text-sm sm:px-6">优先级排序</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                    凭经验判断
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-primary sm:px-6">
                    <Check className="mr-1 inline h-4 w-4" />
                    频次 x 严重性计算
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 text-sm sm:px-6">改进建议</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                    需额外时间撰写
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-primary sm:px-6">
                    <Check className="mr-1 inline h-4 w-4" />
                    自动生成可执行建议
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 text-sm sm:px-6">报告输出</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                    <span className="inline-flex items-center gap-1">
                      <TrendingDown className="h-4 w-4 flex-shrink-0" /> 格式不统一
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-primary sm:px-6">
                    <Check className="mr-1 inline h-4 w-4" />
                    一键导出 PDF
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== 适用人群 ===== */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">谁在用反馈洞察？</h2>
            <p className="text-muted-foreground">如果你在处理用户反馈，这就是你的工具</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">产品经理</h3>
              <p className="text-sm text-muted-foreground">
                快速从用户反馈中提取需求优先级，用数据支撑迭代决策
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-chart-2/10">
                <Users className="h-7 w-7 text-chart-2" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">用研 / 运营</h3>
              <p className="text-sm text-muted-foreground">
                批量处理用户评论、问卷回答，自动归类和情感分析
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-chart-3/10">
                <Building2 className="h-7 w-7 text-chart-3" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">创业团队</h3>
              <p className="text-sm text-muted-foreground">
                没有专职用研？用 AI 10 秒搞定反馈分析，省人省时
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">常见问题</h2>
            <p className="text-muted-foreground">还有疑问？随时联系我们</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-lg border border-border bg-card overflow-hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium transition-colors hover:bg-muted/50">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 底部 CTA ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-chart-2/5 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 h-48 w-96 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-3xl font-bold">立即开始你的第一次分析</h2>
          <p className="mb-8 text-muted-foreground">
            无需注册，免费试用 3 次。上传反馈，10 秒后见结果。
          </p>
          <Link
            href="/upload"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
          >
            上传反馈数据
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            数据仅用于分析，不留存不训练
          </div>
        </div>
      </section>
    </div>
  );
}
