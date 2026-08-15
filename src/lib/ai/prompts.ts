/**
 * FeedbackLens 三步分析 Prompt 模板
 *
 * 设计原则（对应 PRD 第五章）：
 * 1. 拆三步调用，降低单次 Token 消耗，提升结果质量
 * 2. 使用 JSON mode 保证输出格式
 * 3. 大量反馈（>200条）时分批处理再合并
 * 4. 每步可独立重试，不影响其他步骤
 */

import type {
  ClusteringResult,
  SentimentResult,
  SuggestionsResult,
} from "@/lib/types";

// ============ Step 1: 聚类 ============

export const CLUSTERING_SYSTEM_PROMPT = `你是一个专业的用户反馈分析专家。你的任务是将大量用户反馈按照主题进行智能聚类分组。

## 聚类规则

1. 将语义相近的反馈归为同一组
2. 每组生成一个简洁明确的标签（4-12个字），概括该组反馈的核心主题
3. 每组生成一句话描述，说明该组的特征
4. 聚类数量根据反馈内容自适应，通常 3-8 个
5. 每条反馈必须归属到且仅归属到一个聚类
6. items 数组中存储反馈的索引（从0开始）

## 输出格式（严格 JSON）

{
  "clusters": [
    {
      "label": "聚类标签",
      "description": "该聚类的一句话描述",
      "items": [0, 3, 7, 12]
    }
  ]
}

注意：只输出 JSON，不要输出任何其他内容。`;

export function buildClusteringUserPrompt(feedback: string[]): string {
  return `请对以下 ${feedback.length} 条用户反馈进行聚类分组。

反馈列表（索引从0开始）：
${JSON.stringify(feedback)}

请输出聚类结果的 JSON。`;
}

// ============ Step 2: 情感分析 + 优先级 ============

export const SENTIMENT_SYSTEM_PROMPT = `你是一个专业的用户反馈情感分析专家。你的任务是对一个聚类分组内的用户反馈进行情感分析和优先级评估。

## 分析维度

1. **情感分析**：统计该聚类中正面/负面/中性的反馈数量
   - positive: 表达满意、赞扬、喜欢的反馈
   - negative: 表达不满、抱怨、报告问题的反馈
   - neutral: 客观描述、建议性、中性的反馈

2. **优先级评估**：根据以下因素综合判断优先级
   - 高：负面占比 >50%，或涉及核心功能（登录、支付、安全），或影响大量用户
   - 中：负面占比 20-50%，影响部分用户体验
   - 低：正面为主，或属于一般性建议

3. **优先级原因**：简述为什么给出这个优先级

4. **聚类摘要**：用1-2句话概括该聚类反馈的核心内容

## 输出格式（严格 JSON）

{
  "sentiment": { "positive": 5, "negative": 10, "neutral": 3 },
  "priority": "高",
  "priority_reason": "优先级原因说明",
  "summary": "该聚类反馈的核心摘要"
}

注意：只输出 JSON，不要输出任何其他内容。`;

export function buildSentimentUserPrompt(
  clusterLabel: string,
  clusterDescription: string,
  feedbackItems: string[]
): string {
  return `请分析以下聚类中的用户反馈。

聚类标签：${clusterLabel}
聚类描述：${clusterDescription}

该聚类包含 ${feedbackItems.length} 条反馈：
${JSON.stringify(feedbackItems)}

请输出情感分析和优先级评估的 JSON。`;
}

// ============ Step 3: 改进建议 ============

export const SUGGESTIONS_SYSTEM_PROMPT = `你是一个资深产品顾问。你的任务是根据用户反馈的聚类分析结果，为每个聚类生成可执行的改进建议。

## 建议规则

1. 每个聚类生成 1 条改进建议
2. 建议必须具体、可执行，不要泛泛而谈
3. 评估每条建议的「影响」和「成本」
   - impact（影响）：高/中/低 — 实施后对用户体验的改善程度
   - effort（成本）：高/中/低 — 实施所需的时间和技术资源

## 输出格式（严格 JSON）

{
  "suggestions": [
    {
      "cluster": "聚类标签",
      "suggestion": "具体的改进建议",
      "impact": "高",
      "effort": "中"
    }
  ]
}

注意：只输出 JSON，不要输出任何其他内容。`;

export function buildSuggestionsUserPrompt(
  clusters: {
    label: string;
    description: string;
    summary: string;
    sentiment: { positive: number; negative: number; neutral: number };
    priority: string;
    priority_reason: string;
  }[]
): string {
  return `请根据以下聚类分析结果，为每个聚类生成改进建议。

聚类分析结果：
${JSON.stringify(clusters, null, 2)}

请为每个聚类输出一条改进建议的 JSON。`;
}

// ============ 分批处理辅助函数 ============

/**
 * 将大量反馈分批，每批最多 batchSize 条
 * 用于 Step 1 聚类的分批处理
 */
export function batchFeedback(feedback: string[], batchSize = 200): string[][] {
  if (feedback.length <= batchSize) return [feedback];

  const batches: string[][] = [];
  for (let i = 0; i < feedback.length; i += batchSize) {
    batches.push(feedback.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * 合并多批聚类结果
 * 调整 items 索引偏移，并对相似聚类进行二次合并
 */
export function mergeClusteringResults(
  batchResults: ClusteringResult[],
  batchSizes: number[]
): ClusteringResult {
  if (batchResults.length === 1) return batchResults[0];

  const allClusters: ClusteringResult["clusters"] = [];
  let indexOffset = 0;

  for (let b = 0; b < batchResults.length; b++) {
    const result = batchResults[b];
    for (const cluster of result.clusters) {
      allClusters.push({
        label: cluster.label,
        description: cluster.description,
        items: cluster.items.map((idx) => idx + indexOffset),
      });
    }
    indexOffset += batchSizes[b];
  }

  // 简单合并：相似标签的聚类合并
  // TODO: 可用 AI 二次聚类，MVP 阶段先按标签相似度合并
  const merged: ClusteringResult["clusters"] = [];
  const used = new Set<number>();

  for (let i = 0; i < allClusters.length; i++) {
    if (used.has(i)) continue;
    const current = { ...allClusters[i] };

    for (let j = i + 1; j < allClusters.length; j++) {
      if (used.has(j)) continue;
      if (isSimilarLabel(current.label, allClusters[j].label)) {
        current.items = [...current.items, ...allClusters[j].items];
        used.add(j);
      }
    }

    merged.push(current);
  }

  return { clusters: merged };
}

/**
 * 简单的标签相似度判断
 */
function isSimilarLabel(a: string, b: string): boolean {
  if (a === b) return true;
  // 取关键词交集
  const wordsA = a.split(/[\s/、，,（）()]+/).filter((w) => w.length >= 2);
  const wordsB = b.split(/[\s/、，,（）()]+/).filter((w) => w.length >= 2);
  const intersection = wordsA.filter((w) => wordsB.some((wb) => wb.includes(w) || w.includes(wb)));
  return intersection.length > 0;
}

// ============ 类型验证辅助函数 ============

export function validateClusteringResult(data: unknown): data is ClusteringResult {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.clusters)) return false;
  return obj.clusters.every(
    (c) =>
      typeof c === "object" &&
      c !== null &&
      typeof (c as Record<string, unknown>).label === "string" &&
      Array.isArray((c as Record<string, unknown>).items)
  );
}

export function validateSentimentResult(data: unknown): data is SentimentResult {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  const sentiment = obj.sentiment as Record<string, unknown>;
  return (
    typeof sentiment?.positive === "number" &&
    typeof sentiment?.negative === "number" &&
    typeof sentiment?.neutral === "number" &&
    typeof obj.priority === "string"
  );
}

export function validateSuggestionsResult(data: unknown): data is SuggestionsResult {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj.suggestions);
}
