"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  BarChart3,
  Lightbulb,
  AlertCircle,
  ThumbsDown,
  TrendingUp,
  Clock,
  Coins,
  FileText,
  PieChart as PieChartIcon,
  Grid3x3,
} from "lucide-react";
import { useAnalysisResult } from "@/lib/use-result";
import {
  ClusterDistributionChart,
  SentimentChart,
  PriorityMatrixChart,
} from "@/components/charts";

const priorityColors: Record<string, string> = {
  "高": "bg-destructive/10 text-destructive border-destructive/20",
  "中": "bg-chart-4/10 text-chart-4 border-chart-4/20",
  "低": "bg-muted text-muted-foreground border-border",
};

const priorityOrder: Record<string, number> = { "高": 0, "中": 1, "低": 2 };

export default function ResultPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data, loading, notFound } = useAnalysisResult(id);

  // 打印 PDF
  const handlePrint = () => {
    window.print();
  };

  // ===== 加载中 =====
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  // ===== 未找到数据 =====
  if (notFound || !data) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold">未找到分析结果</h2>
        <p className="mb-8 text-muted-foreground">
          分析结果可能已过期，请重新上传反馈进行分析
        </p>
        <Link
          href="/upload"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          返回上传
        </Link>
      </div>
    );
  }

  const record = data.record;
  const cost = data.cost;
  const analysisTime = data.analysisTime;

  // 计算汇总数据
  const totalSentiment = record.clusters.reduce(
    (acc, c) => ({
      positive: acc.positive + c.sentiment.positive,
      negative: acc.negative + c.sentiment.negative,
      neutral: acc.neutral + c.sentiment.neutral,
    }),
    { positive: 0, negative: 0, neutral: 0 }
  );

  const negativeRate = record.total_count > 0
    ? Math.round((totalSentiment.negative / record.total_count) * 100)
    : 0;

  const highPriorityCount = record.clusters.filter(
    (c) => c.priority === "高"
  ).length;

  // 按优先级排序聚类
  const sortedClusters = [...record.clusters].sort(
    (a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* 顶部操作栏 */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/upload"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回上传
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/result/${id}/detail`}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <FileText className="h-4 w-4" />
            查看详细报告
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            导出 PDF
          </button>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            新建分析
          </Link>
        </div>
      </div>

      {/* 报告标题 */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">{record.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>共分析 {record.total_count} 条反馈</span>
          <span>·</span>
          <span>识别 {record.clusters.length} 个主题</span>
          <span>·</span>
          <span>{new Date(record.created_at).toLocaleString("zh-CN")}</span>
          {analysisTime ? (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                耗时 {(analysisTime / 1000).toFixed(1)}s
              </span>
            </>
          ) : null}
          {cost ? (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Coins className="h-3.5 w-3.5" />
                {cost.isMock ? "模拟分析" : `¥${cost.cny}`}
              </span>
            </>
          ) : null}
        </div>
      </div>

      {/* 数据卡片（4 个） */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-1 text-xs text-muted-foreground sm:text-sm">反馈总数</div>
          <div className="text-2xl font-bold sm:text-3xl">{record.total_count}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <Grid3x3 className="h-3.5 w-3.5" />
            主题聚类数
          </div>
          <div className="text-2xl font-bold text-primary sm:text-3xl">
            {record.clusters.length}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <ThumbsDown className="h-3.5 w-3.5 text-destructive" />
            负面占比
          </div>
          <div className="text-2xl font-bold text-destructive sm:text-3xl">
            {negativeRate}%
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <AlertCircle className="h-3.5 w-3.5 text-chart-4" />
            高优主题数
          </div>
          <div className="text-2xl font-bold text-chart-4 sm:text-3xl">
            {highPriorityCount}
          </div>
        </div>
      </div>

      {/* 关键洞察栏 */}
      {highPriorityCount > 0 && (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-5 py-4">
          <TrendingUp className="h-5 w-5 flex-shrink-0 text-destructive" />
          <p className="text-sm">
            <strong className="text-destructive">{highPriorityCount} 个高优先级问题</strong>
            需要重点关注 — 涉及核心功能或大量用户负面反馈，建议优先处理。
          </p>
        </div>
      )}

      {/* 图表区域 */}
      <div className="mb-8 space-y-6">
        {/* 聚类分布柱状图 */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold sm:text-lg">聚类分布</h2>
            <span className="text-xs text-muted-foreground sm:text-sm">
              各主题的反馈数量（按数量降序）
            </span>
          </div>
          <ClusterDistributionChart clusters={record.clusters} />
        </div>

        {/* 情感占比堆叠柱状图 */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-chart-2" />
            <h2 className="text-base font-bold sm:text-lg">情感占比</h2>
            <span className="text-xs text-muted-foreground sm:text-sm">
              各主题的正面 / 负面 / 中性占比
            </span>
          </div>
          <SentimentChart clusters={record.clusters} />
        </div>

        {/* 优先级矩阵散点图 */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Grid3x3 className="h-5 w-5 text-chart-4" />
            <h2 className="text-base font-bold sm:text-lg">优先级矩阵</h2>
            <span className="text-xs text-muted-foreground sm:text-sm">
              X 轴 = 反馈数量，Y 轴 = 负面占比，气泡大小 = 反馈规模
            </span>
          </div>
          <PriorityMatrixChart clusters={record.clusters} />
        </div>
      </div>

      {/* 主题聚类概览（精简列表，详细在 detail 页） */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">主题聚类概览</h2>
          <Link
            href={`/result/${id}/detail`}
            className="ml-auto text-sm text-primary hover:underline"
          >
            查看详情 →
          </Link>
        </div>
        <div className="space-y-3">
          {sortedClusters.map((cluster, i) => (
            <div
              key={cluster.id || i}
              className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      #{i + 1}
                    </span>
                    <h3 className="text-base font-semibold">{cluster.label}</h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                        priorityColors[cluster.priority]
                      }`}
                    >
                      {cluster.priority}优先级
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    {cluster.summary}
                  </p>
                  {/* 情感分布条 */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      {cluster.items.length} 条反馈
                    </span>
                    <div className="flex h-1.5 flex-1 max-w-[200px] overflow-hidden rounded-full bg-muted">
                      <div
                        className="bg-chart-3"
                        style={{
                          width: `${(cluster.sentiment.positive / cluster.items.length) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-destructive"
                        style={{
                          width: `${(cluster.sentiment.negative / cluster.items.length) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-muted-foreground/40"
                        style={{
                          width: `${(cluster.sentiment.neutral / cluster.items.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-chart-3">正{cluster.sentiment.positive}</span>
                    <span className="text-destructive">负{cluster.sentiment.negative}</span>
                    <span className="text-muted-foreground">中{cluster.sentiment.neutral}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI 改进建议摘要 */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-chart-4" />
          <h2 className="text-xl font-bold">AI 改进建议</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {record.suggestions.map((s, i) => (
            <div
              key={i}
              className="rounded-xl border border-chart-4/20 bg-chart-4/5 p-4 sm:p-5"
            >
              <div className="mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-chart-4" />
                <span className="text-sm font-semibold">{s.cluster_label}</span>
              </div>
              <p className="mb-3 text-sm text-foreground">{s.suggestion}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-background px-2 py-0.5">
                  影响：{s.impact}
                </span>
                <span className="rounded bg-background px-2 py-0.5">
                  成本：{s.effort}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 底部操作 */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-4 print:hidden">
        <Link
          href="/upload"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          分析新一批反馈
        </Link>
        <Link
          href={`/result/${id}/detail`}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-6 text-sm font-medium transition-colors hover:bg-muted"
        >
          查看详细报告
        </Link>
        <Link
          href="/history"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-6 text-sm font-medium transition-colors hover:bg-muted"
        >
          查看历史记录
        </Link>
      </div>
    </div>
  );
}
