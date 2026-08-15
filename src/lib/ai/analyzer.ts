/**
 * 三步分析编排引擎
 *
 * 流程：
 * Step 1: 聚类 — 将所有反馈分组
 * Step 2: 情感+优先级 — 对每个聚类并行分析
 * Step 3: 改进建议 — 根据聚类结果生成建议
 *
 * 支持进度回调，用于 analyzing 页面实时展示
 */

import { chatCompletionJson } from "./deepseek";
import {
  CLUSTERING_SYSTEM_PROMPT,
  buildClusteringUserPrompt,
  SENTIMENT_SYSTEM_PROMPT,
  buildSentimentUserPrompt,
  SUGGESTIONS_SYSTEM_PROMPT,
  buildSuggestionsUserPrompt,
  batchFeedback,
  mergeClusteringResults,
  validateClusteringResult,
  validateSentimentResult,
  validateSuggestionsResult,
} from "./prompts";
import type {
  ClusteringResult,
  SentimentResult,
  SuggestionsResult,
  Cluster,
  Suggestion,
  AnalysisRecord,
  InputType,
} from "@/lib/types";

export type AnalysisStep = "clustering" | "sentiment" | "suggestions" | "done" | "error";

export interface AnalysisProgress {
  step: AnalysisStep;
  message: string;
  detail?: string;
}

export interface AnalysisResult {
  record: AnalysisRecord;
  totalCost: number;
  totalTokens: number;
}

type ProgressCallback = (progress: AnalysisProgress) => void;

/**
 * 执行完整的三步分析流程
 */
export async function runAnalysis(
  feedback: string[],
  inputType: InputType,
  onProgress?: ProgressCallback
): Promise<AnalysisResult> {
  let totalCost = 0;
  let totalTokens = 0;

  // ============ Step 1: 聚类 ============
  onProgress?.({
    step: "clustering",
    message: "正在聚类分组",
    detail: `对 ${feedback.length} 条反馈进行智能聚类...`,
  });

  const batches = batchFeedback(feedback, 200);
  const batchSizes = batches.map((b) => b.length);

  let clusteringResult: ClusteringResult;

  if (batches.length === 1) {
    // 单批处理
    const result = await chatCompletionJson<ClusteringResult>({
      messages: [
        { role: "system", content: CLUSTERING_SYSTEM_PROMPT },
        { role: "user", content: buildClusteringUserPrompt(batches[0]) },
      ],
      temperature: 0.2,
      jsonMode: true,
    });

    if (!validateClusteringResult(result.data)) {
      throw new Error("聚类结果格式异常");
    }

    clusteringResult = result.data;
    totalCost += result.cost;
    totalTokens += result.usage.totalTokens;
  } else {
    // 多批处理 + 合并
    const batchResults: ClusteringResult[] = [];
    for (let i = 0; i < batches.length; i++) {
      onProgress?.({
        step: "clustering",
        message: "正在聚类分组",
        detail: `处理第 ${i + 1}/${batches.length} 批...`,
      });

      const result = await chatCompletionJson<ClusteringResult>({
        messages: [
          { role: "system", content: CLUSTERING_SYSTEM_PROMPT },
          { role: "user", content: buildClusteringUserPrompt(batches[i]) },
        ],
        temperature: 0.2,
        jsonMode: true,
      });

      if (!validateClusteringResult(result.data)) {
        throw new Error(`第 ${i + 1} 批聚类结果格式异常`);
      }

      batchResults.push(result.data);
      totalCost += result.cost;
      totalTokens += result.usage.totalTokens;
    }

    clusteringResult = mergeClusteringResults(batchResults, batchSizes);
  }

  // ============ Step 2: 情感+优先级（并行） ============
  onProgress?.({
    step: "sentiment",
    message: "正在分析情感",
    detail: `对 ${clusteringResult.clusters.length} 个聚类进行情感分析...`,
  });

  const sentimentPromises = clusteringResult.clusters.map(async (cluster, idx) => {
    const clusterFeedback = cluster.items.map((i) => feedback[i]).filter(Boolean);

    const result = await chatCompletionJson<SentimentResult>({
      messages: [
        { role: "system", content: SENTIMENT_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildSentimentUserPrompt(
            cluster.label,
            cluster.description,
            clusterFeedback
          ),
        },
      ],
      temperature: 0.3,
      jsonMode: true,
    });

    if (!validateSentimentResult(result.data)) {
      // 降级：使用默认值
      console.warn(`聚类 ${idx} 情感分析结果格式异常，使用默认值`);
      return {
        data: {
          sentiment: { positive: 0, negative: 0, neutral: clusterFeedback.length },
          priority: "中" as const,
          priority_reason: "分析结果异常，默认中优先级",
          summary: cluster.description,
        },
        cost: result.cost,
        usage: result.usage,
      };
    }

    return result;
  });

  const sentimentResults = await Promise.all(sentimentPromises);

  for (const r of sentimentResults) {
    totalCost += r.cost;
    totalTokens += r.usage.totalTokens;
  }

  // 组装聚类完整数据
  const clusters: Cluster[] = clusteringResult.clusters.map((cluster, idx) => {
    const sentiment = sentimentResults[idx].data;
    return {
      id: `cluster-${idx}`,
      label: cluster.label,
      description: cluster.description,
      items: cluster.items,
      sentiment: sentiment.sentiment,
      priority: sentiment.priority,
      priority_reason: sentiment.priority_reason,
      summary: sentiment.summary,
    };
  });

  // ============ Step 3: 改进建议 ============
  onProgress?.({
    step: "suggestions",
    message: "正在生成建议",
    detail: "基于分析结果生成可执行的改进建议...",
  });

  const suggestionsInput = clusters.map((c) => ({
    label: c.label,
    description: c.description,
    summary: c.summary,
    sentiment: c.sentiment,
    priority: c.priority,
    priority_reason: c.priority_reason,
  }));

  const suggestionsResult = await chatCompletionJson<SuggestionsResult>({
    messages: [
      { role: "system", content: SUGGESTIONS_SYSTEM_PROMPT },
      { role: "user", content: buildSuggestionsUserPrompt(suggestionsInput) },
    ],
    temperature: 0.4,
    jsonMode: true,
  });

  totalCost += suggestionsResult.cost;
  totalTokens += suggestionsResult.usage.totalTokens;

  // 组装建议数据
  let suggestions: Suggestion[] = [];
  if (validateSuggestionsResult(suggestionsResult.data)) {
    suggestions = suggestionsResult.data.suggestions.map((s, idx) => ({
      cluster_id: clusters[idx]?.id || `cluster-${idx}`,
      cluster_label: s.cluster,
      suggestion: s.suggestion,
      impact: s.impact,
      effort: s.effort,
    }));
  } else {
    // 降级：为每个聚类生成默认建议
    suggestions = clusters.map((c) => ({
      cluster_id: c.id,
      cluster_label: c.label,
      suggestion: c.summary,
      impact: "中" as const,
      effort: "中" as const,
    }));
  }

  // ============ 组装最终结果 ============
  onProgress?.({
    step: "done",
    message: "分析完成",
    detail: `共识别 ${clusters.length} 个主题，生成 ${suggestions.length} 条建议`,
  });

  const record: AnalysisRecord = {
    id: `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: null,
    created_at: new Date().toISOString(),
    title: `反馈分析 — ${feedback.length} 条用户反馈`,
    status: "completed",
    input_type: inputType,
    total_count: feedback.length,
    raw_feedback: feedback,
    clusters,
    suggestions,
  };

  return {
    record,
    totalCost,
    totalTokens,
  };
}
