/**
 * FeedbackLens 核心类型定义
 * 对应 PRD 第六章「数据结构设计」
 */

// ============ 分析相关 ============

export type AnalysisStatus = "processing" | "completed" | "failed";
export type InputType = "csv" | "text";
export type Priority = "高" | "中" | "低";
export type SentimentType = "positive" | "negative" | "neutral";

/** 聚类结果 */
export interface Cluster {
  id: string;
  label: string;
  description: string;
  items: number[]; // 反馈索引数组
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  priority: Priority;
  priority_reason: string;
  summary: string;
}

/** 改进建议 */
export interface Suggestion {
  cluster_id: string;
  cluster_label: string;
  suggestion: string;
  impact: "高" | "中" | "低";
  effort: "高" | "中" | "低";
}

/** 完整分析记录 */
export interface AnalysisRecord {
  id: string;
  user_id: string | null;
  created_at: string;
  title: string;
  status: AnalysisStatus;
  input_type: InputType;
  total_count: number;
  raw_feedback: string[];
  clusters: Cluster[];
  suggestions: Suggestion[];
}

// ============ AI 分析中间结果 ============

/** Step 1 聚类 API 返回 */
export interface ClusteringResult {
  clusters: {
    label: string;
    description: string;
    items: number[];
  }[];
}

/** Step 2 情感+优先级 API 返回 */
export interface SentimentResult {
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  priority: Priority;
  priority_reason: string;
  summary: string;
}

/** Step 3 改进建议 API 返回 */
export interface SuggestionsResult {
  suggestions: {
    cluster: string;
    suggestion: string;
    impact: "高" | "中" | "低";
    effort: "高" | "中" | "低";
  }[];
}

// ============ 用户相关 ============

export type UserPlan = "free" | "pro";

export interface UserProfile {
  id: string;
  email: string | null;
  wechat_id: string | null;
  created_at: string;
  plan: UserPlan;
}

/** 每日使用额度 */
export interface DailyQuota {
  date: string;
  count: number;
  limit: number;
  remaining: number;
}

// ============ API 请求/响应 ============

/** POST /api/analyze 请求 */
export interface AnalyzeRequest {
  input_type: InputType;
  feedback: string[];
}

/** POST /api/analyze 响应 */
export interface AnalyzeResponse {
  id: string;
  status: AnalysisStatus;
}

/** GET /api/analyze/[id] 响应 */
export interface GetAnalysisResponse {
  id: string;
  status: AnalysisStatus;
  result?: AnalysisRecord;
}
