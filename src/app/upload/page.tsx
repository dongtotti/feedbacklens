"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import {
  FileUp,
  FileText,
  Sparkles,
  Info,
  X,
  CheckCircle2,
  AlertCircle,
  Wand2,
  ArrowRight,
  Lock,
  Clock,
} from "lucide-react";
import { SAMPLE_FEEDBACK } from "@/lib/sample-data";
import type { InputType } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import {
  getQuota,
  formatQuotaText,
  formatResetTime,
  type QuotaInfo,
} from "@/lib/quota";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_FEEDBACK_COUNT = 1000;
const MIN_FEEDBACK_COUNT = 5;

interface ParsedCsvResult {
  headers: string[];
  rows: string[][];
  textColumnIndex: number;
}

/**
 * 自动检测最可能是反馈内容的列
 */
function detectTextColumn(headers: string[], rows: string[][]): number {
  const lowerHeaders = headers.map((h) => h.toLowerCase());
  const keywordMap = [
    "反馈",
    "内容",
    "评论",
    "意见",
    "描述",
    "feedback",
    "content",
    "comment",
    "review",
    "text",
    "message",
    "description",
  ];

  for (const keyword of keywordMap) {
    const idx = lowerHeaders.findIndex((h) => h.includes(keyword));
    if (idx !== -1) return idx;
  }

  // 如果没匹配到关键词，取内容最长的列
  if (rows.length > 0) {
    let maxLen = 0;
    let maxIdx = 0;
    for (let i = 0; i < headers.length; i++) {
      const avgLen =
        rows.slice(0, 20).reduce((sum, row) => sum + (row[i]?.length || 0), 0) /
        Math.min(rows.length, 20);
      if (avgLen > maxLen) {
        maxLen = avgLen;
        maxIdx = i;
      }
    }
    return maxIdx;
  }

  return 0;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"csv" | "text">("csv");
  const [textContent, setTextContent] = useState("");
  const [feedbackCount, setFeedbackCount] = useState(0);

  // 额度状态
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  // CSV 状态
  const [fileName, setFileName] = useState("");
  const [csvError, setCsvError] = useState("");
  const [csvParsed, setCsvParsed] = useState(false);
  const [csvPreview, setCsvPreview] = useState<ParsedCsvResult | null>(null);
  const [csvFeedbackList, setCsvFeedbackList] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // 提交状态
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化额度
  useEffect(() => {
    setQuota(getQuota(!!user));
  }, [user]);

  const quotaExhausted = quota !== null && quota.remaining <= 0;

  // ===== 文本粘贴 =====
  const handleTextChange = (value: string) => {
    setTextContent(value);
    const lines = value
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    setFeedbackCount(lines.length);
  };

  const handleLoadSample = () => {
    const sample = SAMPLE_FEEDBACK.join("\n");
    setTextContent(sample);
    setFeedbackCount(SAMPLE_FEEDBACK.length);
    setActiveTab("text");
  };

  // ===== CSV 上传 =====
  const processFile = useCallback((file: File) => {
    setCsvError("");
    setCsvParsed(false);
    setCsvPreview(null);
    setCsvFeedbackList([]);

    // 格式校验
    const isCsv =
      file.type === "text/csv" ||
      file.type === "application/vnd.ms-excel" ||
      file.name.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      setCsvError("请上传 CSV 格式的文件");
      return;
    }

    // 大小校验
    if (file.size > MAX_FILE_SIZE) {
      setCsvError(`文件大小不能超过 2MB（当前 ${(file.size / 1024 / 1024).toFixed(1)}MB）`);
      return;
    }

    setFileName(file.name);

    Papa.parse(file, {
      complete: (result) => {
        if (result.data.length === 0) {
          setCsvError("文件内容为空");
          return;
        }

        const allRows = result.data as string[][];
        const headers = allRows[0] || [];
        const dataRows = allRows.slice(1).filter((row) =>
          row.some((cell) => cell && cell.trim().length > 0)
        );

        if (dataRows.length === 0) {
          setCsvError("文件中没有有效数据行");
          return;
        }

        if (dataRows.length < MIN_FEEDBACK_COUNT) {
          setCsvError(`数据太少，至少需要 ${MIN_FEEDBACK_COUNT} 条反馈（当前 ${dataRows.length} 条）`);
          return;
        }

        if (dataRows.length > MAX_FEEDBACK_COUNT) {
          setCsvError(`数据太多，最多支持 ${MAX_FEEDBACK_COUNT} 条反馈（当前 ${dataRows.length} 条）`);
          return;
        }

        // 自动检测文本列
        const textColIdx = detectTextColumn(headers, dataRows);
        const feedbackList = dataRows
          .map((row) => (row[textColIdx] || "").trim())
          .filter((text) => text.length > 0);

        setCsvPreview({
          headers,
          rows: dataRows.slice(0, 5), // 预览前5行
          textColumnIndex: textColIdx,
        });
        setCsvFeedbackList(feedbackList);
        setCsvParsed(true);
      },
      error: (err) => {
        setCsvError(`解析失败：${err.message}`);
      },
    });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // 重置 input 以便重复选择同一文件
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClearCsv = () => {
    setFileName("");
    setCsvError("");
    setCsvParsed(false);
    setCsvPreview(null);
    setCsvFeedbackList([]);
  };

  // ===== 提交分析 =====
  const handleAnalyze = () => {
    let feedback: string[] = [];
    let inputType: InputType = "text";

    if (activeTab === "csv" && csvParsed) {
      feedback = csvFeedbackList;
      inputType = "csv";
    } else if (activeTab === "text" && feedbackCount >= MIN_FEEDBACK_COUNT) {
      feedback = textContent
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      inputType = "text";
    }

    if (feedback.length < MIN_FEEDBACK_COUNT) return;

    setIsSubmitting(true);

    // 通过 sessionStorage 传递数据到 analyzing 页面
    try {
      sessionStorage.setItem(
        "feedbacklens_analysis",
        JSON.stringify({
          inputType,
          feedback,
          count: feedback.length,
          timestamp: Date.now(),
        })
      );
      router.push("/analyzing");
    } catch {
      // sessionStorage 可能超出大小限制
      setCsvError("数据量过大，请尝试减少反馈条数或使用文本粘贴模式");
      setIsSubmitting(false);
    }
  };

  // 按钮是否可用
  const canAnalyze =
    ((activeTab === "csv" && csvParsed && csvFeedbackList.length >= MIN_FEEDBACK_COUNT) ||
    (activeTab === "text" && feedbackCount >= MIN_FEEDBACK_COUNT)) &&
    !quotaExhausted;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* 页面标题 */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">导入用户反馈</h1>
        <p className="text-muted-foreground">
          支持 CSV 文件上传或文本批量粘贴，至少 {MIN_FEEDBACK_COUNT} 条反馈
        </p>
      </div>

      {/* 免费额度提示 */}
      {quota && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            quotaExhausted
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-primary/20 bg-primary/5 text-primary"
          }`}
        >
          {quotaExhausted ? (
            <Lock className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Info className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="flex-1">
            {quotaExhausted ? (
              <>
                今日免费额度已用完（{quota.used}/{quota.limit}）
                {!user && (
                  <>
                    ，<Link href="/auth" className="font-semibold underline">登录后每天 10 次</Link>
                  </>
                )}
              </>
            ) : (
              <>
                {formatQuotaText(quota)}
                {!user && "，登录后每天 10 次"}
              </>
            )}
          </span>
          {!quotaExhausted && (
            <span className="flex items-center gap-1 text-xs opacity-70">
              <Clock className="h-3 w-3" />
              {formatResetTime(quota)}
            </span>
          )}
        </div>
      )}

      {/* 示例数据按钮 */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleLoadSample}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Wand2 className="h-3.5 w-3.5" />
          加载示例数据
        </button>
      </div>

      {/* Tab 切换 */}
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setActiveTab("csv")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "csv"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileUp className="h-4 w-4" />
          CSV 上传
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "text"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          文本粘贴
        </button>
      </div>

      {/* CSV 上传区域 */}
      {activeTab === "csv" && (
        <div className="space-y-4">
          {!csvParsed && !csvError && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <FileUp className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-1 text-base font-medium">
                拖拽 CSV 文件到此处，或点击选择
              </p>
              <p className="text-sm text-muted-foreground">
                支持 UTF-8 编码，大小不超过 2MB，最多 1000 条
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* 错误提示 */}
          {csvError && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">{csvError}</p>
              </div>
              <button
                onClick={handleClearCsv}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* 解析成功 */}
          {csvParsed && csvPreview && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* 文件信息 */}
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-chart-3" />
                  <div>
                    <p className="text-sm font-medium">{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      共 {csvFeedbackList.length} 条反馈 · 文本列：&ldquo;{csvPreview.headers[csvPreview.textColumnIndex]}&rdquo;
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearCsv}
                  className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 数据预览 */}
              <div className="p-5">
                <p className="mb-3 text-xs font-medium text-muted-foreground">
                  数据预览（前 5 条）
                </p>
                <div className="space-y-2">
                  {csvPreview.rows.map((row, idx) => (
                    <div
                      key={idx}
                      className="rounded-md bg-muted/40 px-3 py-2 text-sm"
                    >
                      <span className="mr-2 text-xs text-muted-foreground">#{idx + 1}</span>
                      {row[csvPreview.textColumnIndex] || "(空)"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 文本粘贴区域 */}
      {activeTab === "text" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <textarea
            value={textContent}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={"每行一条反馈，至少 5 条。例如：\n\n这个 App 登录太慢了，每次都要等很久\n支付页面经常崩溃，希望能修复\n界面设计很好看，体验不错\n搜索功能找不到想要的内容\n希望增加夜间模式"}
            className="h-64 w-full resize-none rounded-lg border border-border bg-background p-4 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              有效反馈：{feedbackCount} 条
              {feedbackCount > 0 && feedbackCount < MIN_FEEDBACK_COUNT && (
                <span className="ml-2 text-destructive">
                  （至少需要 {MIN_FEEDBACK_COUNT} 条）
                </span>
              )}
              {feedbackCount > MAX_FEEDBACK_COUNT && (
                <span className="ml-2 text-destructive">
                  （最多 {MAX_FEEDBACK_COUNT} 条）
                </span>
              )}
            </span>
            {textContent && (
              <button
                onClick={() => {
                  setTextContent("");
                  setFeedbackCount(0);
                }}
                className="text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                清空
              </button>
            )}
          </div>
        </div>
      )}

      {/* 提交按钮 */}
      <div className="mt-6">
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-base font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              准备分析...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              开始分析
              {canAnalyze && (
                <span className="ml-1 rounded-md bg-primary-foreground/20 px-2 py-0.5 text-xs">
                  {activeTab === "csv" ? csvFeedbackList.length : feedbackCount} 条
                </span>
              )}
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
        {!canAnalyze && !isSubmitting && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {quotaExhausted ? (
              !user ? (
                <>
                  今日免费额度已用完，<Link href="/auth" className="font-semibold text-primary underline">登录</Link>后可获得更多次数
                </>
              ) : (
                "今日免费额度已用完，明天重置"
              )
            ) : activeTab === "csv"
              ? "请上传 CSV 文件后开始分析"
              : `请输入至少 ${MIN_FEEDBACK_COUNT} 条反馈后开始分析`}
          </p>
        )}
      </div>
    </div>
  );
}
