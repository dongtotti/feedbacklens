"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import type { AnalysisRecord } from "@/lib/types";
import { saveToHistory } from "@/lib/history";
import { consumeQuota } from "@/lib/quota";
import { useAuth } from "@/lib/auth";

interface StoredAnalysisData {
  inputType: "csv" | "text";
  feedback: string[];
  count: number;
  timestamp: number;
}

const STEPS = [
  { label: "正在解析数据", desc: "读取并清洗反馈内容" },
  { label: "正在聚类分组", desc: "AI 识别相似主题并归组" },
  { label: "正在分析情感", desc: "判断每条反馈的情绪倾向" },
  { label: "正在生成建议", desc: "输出可执行的改进方案" },
];

type PageState = "loading" | "success" | "error";

export default function AnalyzingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<StoredAnalysisData | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<AnalysisRecord | null>(null);
  const hasStarted = useRef(false);

  // 从 sessionStorage 读取数据
  useEffect(() => {
    const stored = sessionStorage.getItem("feedbacklens_analysis");
    if (!stored) {
      setPageState("error");
      setErrorMsg("未找到分析数据，请先上传反馈");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as StoredAnalysisData;
      if (!parsed.feedback || parsed.feedback.length === 0) {
        setPageState("error");
        setErrorMsg("反馈数据为空");
        return;
      }
      setData(parsed);
    } catch {
      setPageState("error");
      setErrorMsg("数据解析失败");
    }
  }, []);

  // 调用 API 执行分析
  useEffect(() => {
    if (!data || hasStarted.current) return;
    hasStarted.current = true;

    // 进度模拟：基于预估时间逐步推进
    // 分析通常需要 10-30 秒，四步各分配时间
    const stepTimers: ReturnType<typeof setTimeout>[] = [];
    const stepDelays = [500, 3000, 8000, 13000]; // 每步开始的时间点

    stepDelays.forEach((delay, idx) => {
      stepTimers.push(
        setTimeout(() => {
          setCurrentStep(idx + 1);
        }, delay)
      );
    });

    // 调用分析 API
    const startTime = Date.now();
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputType: data.inputType,
        feedback: data.feedback,
      }),
    })
      .then(async (response) => {
        const json = await response.json();

        if (!response.ok || json.error) {
          throw new Error(json.error || `HTTP ${response.status}`);
        }

        // 分析成功
        const record = json.result as AnalysisRecord;

        // 清除进度定时器
        stepTimers.forEach((t) => clearTimeout(t));

        // 直接跳到最后一步
        setCurrentStep(STEPS.length);

        // 将结果存入 sessionStorage
        try {
          sessionStorage.setItem(
            "feedbacklens_result",
            JSON.stringify({
              record,
              cost: json.cost,
              analysisTime: Date.now() - startTime,
            })
          );
        } catch {
          // sessionStorage 可能超出大小限制
          // 尝试只存核心数据，不存 raw_feedback
          try {
            const slimRecord = {
              ...record,
              raw_feedback: [],
            };
            sessionStorage.setItem(
              "feedbacklens_result",
              JSON.stringify({
                record: slimRecord,
                cost: json.cost,
                analysisTime: Date.now() - startTime,
              })
            );
          } catch {
            // 如果还是存不下，直接带参数跳转
            console.warn("sessionStorage 存储失败，使用 URL 参数跳转");
          }
        }

        // 保存到历史记录（localStorage 持久化）
        saveToHistory(record, json.cost, Date.now() - startTime);

        // 消耗一次免费额度
        consumeQuota(!!user);

        // 短暂延迟后跳转
        setResult(record);
        setPageState("success");

        setTimeout(() => {
          router.push(`/result/${record.id}`);
        }, 1500);
      })
      .catch((error) => {
        // 清除进度定时器
        stepTimers.forEach((t) => clearTimeout(t));

        console.error("分析失败:", error);
        setErrorMsg(error.message || "分析过程中发生错误");
        setPageState("error");
      });

    return () => {
      stepTimers.forEach((t) => clearTimeout(t));
    };
  }, [data, router, user]);

  // ===== 错误状态 =====
  if (pageState === "error") {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">分析失败</h2>
        <p className="mb-8 max-w-md text-muted-foreground">{errorMsg}</p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setPageState("loading");
              setErrorMsg("");
              hasStarted.current = false;
              // 重新触发分析
              if (data) {
                setCurrentStep(0);
                // 触发 useEffect 重新执行
                const newData = { ...data, timestamp: Date.now() };
                sessionStorage.setItem(
                  "feedbacklens_analysis",
                  JSON.stringify(newData)
                );
                setData(newData);
              }
            }}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            重新分析
          </button>
          <Link
            href="/upload"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-6 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            返回上传
          </Link>
        </div>
      </div>
    );
  }

  // ===== 成功状态（短暂闪现） =====
  if (pageState === "success" && result) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-chart-3/10">
          <CheckCircle2 className="h-10 w-10 text-chart-3" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">分析完成！</h2>
        <p className="text-muted-foreground">
          共识别 {result.clusters.length} 个主题，生成 {result.suggestions.length} 条建议
        </p>
        <p className="mt-4 text-sm text-muted-foreground">正在跳转到结果页...</p>
      </div>
    );
  }

  // ===== 加载状态 =====
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12">
      {/* 加载动画 */}
      <div className="relative mb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-10 w-10 animate-pulse text-primary" />
        </div>
        <div className="absolute inset-0 animate-pulse rounded-full border-2 border-primary/30" />
      </div>

      {/* 进度文案 */}
      <h2 className="mb-2 text-2xl font-bold">正在分析中...</h2>
      <p className="mb-8 text-muted-foreground">
        {data
          ? `正在处理 ${data.count} 条反馈，通常需要 10-30 秒`
          : "通常需要 10-30 秒，请稍候"}
      </p>

      {/* 进度步骤 */}
      <div className="w-full max-w-md space-y-3">
        {STEPS.map((step, i) => {
          const isActive = currentStep === i;
          const isDone = currentStep > i;
          const isPending = currentStep < i;

          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300 ${
                isActive
                  ? "border-primary/30 bg-primary/5 shadow-sm"
                  : isDone
                    ? "border-chart-3/20 bg-chart-3/5"
                    : "border-border bg-muted/30 opacity-50"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-chart-3" />
              ) : isActive ? (
                <div className="h-5 w-5 flex-shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              ) : (
                <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-muted-foreground/30" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    isPending ? "text-muted-foreground" : ""
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
              {isActive && (
                <span className="text-xs font-medium text-primary">进行中</span>
              )}
              {isDone && (
                <span className="text-xs font-medium text-chart-3">完成</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        请勿关闭页面，分析完成后将自动跳转到结果页
      </p>
    </div>
  );
}
