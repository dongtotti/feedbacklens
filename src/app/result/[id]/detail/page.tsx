"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  ThumbsDown,
  MinusCircle,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";
import { useAnalysisResult } from "@/lib/use-result";

const priorityColors: Record<string, string> = {
  "高": "bg-destructive/10 text-destructive border-destructive/20",
  "中": "bg-chart-4/10 text-chart-4 border-chart-4/20",
  "低": "bg-muted text-muted-foreground border-border",
};

const priorityOrder: Record<string, number> = { "高": 0, "中": 1, "低": 2 };

const impactColors: Record<string, string> = {
  "高": "text-destructive",
  "中": "text-chart-4",
  "低": "text-muted-foreground",
};

export default function DetailReportPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data, loading, notFound } = useAnalysisResult(id);

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

  // 按优先级排序聚类
  const sortedClusters = [...record.clusters].sort(
    (a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
  );

  // 计算总体情感
  const totalSentiment = record.clusters.reduce(
    (acc, c) => ({
      positive: acc.positive + c.sentiment.positive,
      negative: acc.negative + c.sentiment.negative,
      neutral: acc.neutral + c.sentiment.neutral,
    }),
    { positive: 0, negative: 0, neutral: 0 }
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* 顶部操作栏 */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href={`/result/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回看板
        </Link>
        <div className="flex items-center gap-2">
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
      <div className="mb-8 border-b border-border pb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <LayoutDashboard className="h-4 w-4" />
          <Link href={`/result/${id}`} className="hover:text-foreground hover:underline">
            结果看板
          </Link>
          <span>/</span>
          <span className="text-foreground">详细报告</span>
        </div>
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">{record.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>共 {record.total_count} 条反馈</span>
          <span>·</span>
          <span>{record.clusters.length} 个主题</span>
          <span>·</span>
          <span>{new Date(record.created_at).toLocaleString("zh-CN")}</span>
        </div>
        {/* 总体情感概览 */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-chart-3" />
            正面 {totalSentiment.positive}
          </span>
          <span className="inline-flex items-center gap-1">
            <ThumbsDown className="h-4 w-4 text-destructive" />
            负面 {totalSentiment.negative}
          </span>
          <span className="inline-flex items-center gap-1">
            <MinusCircle className="h-4 w-4 text-muted-foreground" />
            中性 {totalSentiment.neutral}
          </span>
        </div>
      </div>

      {/* 按聚类分组展示详情 */}
      <div className="space-y-8">
        {sortedClusters.map((cluster, idx) => {
          // 找到该聚类的改进建议
          const clusterSuggestions = record.suggestions.filter(
            (s) =>
              s.cluster_id === cluster.id ||
              s.cluster_label === cluster.label ||
              s.cluster_label.includes(cluster.label) ||
              cluster.label.includes(s.cluster_label)
          );

          // 获取代表性反馈（最多 5 条）
          const representativeFeedback = cluster.items
            .slice(0, 5)
            .map((i) => record.raw_feedback?.[i])
            .filter(Boolean);

          return (
            <section
              key={cluster.id || idx}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              {/* 聚类标题区 */}
              <div className="border-b border-border bg-muted/30 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {idx + 1}
                  </span>
                  <h2 className="text-lg font-bold sm:text-xl">{cluster.label}</h2>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      priorityColors[cluster.priority]
                    }`}
                  >
                    {cluster.priority}优先级
                  </span>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {cluster.items.length} 条反馈
                  </span>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                {/* 聚类描述 */}
                <div>
                  <h3 className="mb-1.5 text-sm font-semibold text-muted-foreground">
                    主题概述
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground">
                    {cluster.summary}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">优先级原因：</span>
                    {cluster.priority_reason}
                  </p>
                </div>

                {/* 情感分布 */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                    情感分布
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="bg-chart-3 transition-all"
                        style={{
                          width: `${(cluster.sentiment.positive / cluster.items.length) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-destructive transition-all"
                        style={{
                          width: `${(cluster.sentiment.negative / cluster.items.length) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-muted-foreground/40 transition-all"
                        style={{
                          width: `${(cluster.sentiment.neutral / cluster.items.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-chart-3" />
                      正面 {cluster.sentiment.positive}
                      ({Math.round((cluster.sentiment.positive / cluster.items.length) * 100)}%)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ThumbsDown className="h-3.5 w-3.5 text-destructive" />
                      负面 {cluster.sentiment.negative}
                      ({Math.round((cluster.sentiment.negative / cluster.items.length) * 100)}%)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MinusCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      中性 {cluster.sentiment.neutral}
                      ({Math.round((cluster.sentiment.neutral / cluster.items.length) * 100)}%)
                    </span>
                  </div>
                </div>

                {/* 代表性反馈 */}
                {representativeFeedback.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                      <MessageSquare className="mr-1 inline h-3.5 w-3.5" />
                      代表性反馈
                    </h3>
                    <div className="space-y-2">
                      {representativeFeedback.map((fb, i) => (
                        <div
                          key={i}
                          className="rounded-lg bg-muted/40 px-3 py-2 text-sm"
                        >
                          <span className="mr-2 text-xs text-muted-foreground">
                            #{cluster.items[i] + 1}
                          </span>
                          {fb}
                        </div>
                      ))}
                      {cluster.items.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          还有 {cluster.items.length - 5} 条反馈未展示...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 改进建议 */}
                {clusterSuggestions.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                      <Lightbulb className="mr-1 inline h-3.5 w-3.5 text-chart-4" />
                      改进建议
                    </h3>
                    <div className="space-y-2">
                      {clusterSuggestions.map((s, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-chart-4/20 bg-chart-4/5 p-3"
                        >
                          <p className="mb-2 text-sm text-foreground">
                            {s.suggestion}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="inline-flex items-center gap-1">
                              <span className="text-muted-foreground">预期影响：</span>
                              <span className={`font-medium ${impactColors[s.impact]}`}>
                                {s.impact}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="text-muted-foreground">实施成本：</span>
                              <span className={`font-medium ${impactColors[s.effort]}`}>
                                {s.effort}
                              </span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* 底部操作 */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 py-4 print:hidden">
        <Link
          href={`/result/${id}`}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-6 text-sm font-medium transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          返回看板
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-6 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          导出 PDF
        </button>
        <Link
          href="/upload"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          分析新一批反馈
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 打印页脚 */}
      <div className="hidden print:mt-8 print:border-t print:border-border print:pt-4 print:block">
        <p className="text-center text-xs text-muted-foreground">
          反馈洞察 FeedbackLens · 由 AI 自动生成 · {new Date().toLocaleDateString("zh-CN")}
        </p>
      </div>
    </div>
  );
}
