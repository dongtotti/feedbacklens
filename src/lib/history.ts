/**
 * 历史记录管理（localStorage 持久化）
 *
 * 未登录用户也能在本地保存分析记录，
 * 登录后可同步到 Supabase（后续版本）。
 */

import type { AnalysisRecord } from "./types";

const STORAGE_KEY = "feedbacklens_history";
const MAX_RECORDS = 50;

export interface HistoryEntry {
  id: string;
  title: string;
  created_at: string;
  total_count: number;
  cluster_count: number;
  high_priority_count: number;
  negative_count: number;
  // 完整记录（用于回看结果）
  record: AnalysisRecord;
  cost?: {
    cny: number;
    tokens: number;
    isMock: boolean;
  };
  analysisTime?: number;
}

/**
 * 获取所有历史记录（按时间倒序）
 */
export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as HistoryEntry[];
    return list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * 获取单条历史记录
 */
export function getHistoryEntry(id: string): HistoryEntry | null {
  const history = getHistory();
  return history.find((h) => h.id === id) || null;
}

/**
 * 保存一条分析记录到历史
 */
export function saveToHistory(
  record: AnalysisRecord,
  cost?: { cny: number; tokens: number; isMock: boolean },
  analysisTime?: number
): void {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory();

    // 计算汇总数据
    const negativeCount = record.clusters.reduce(
      (sum, c) => sum + c.sentiment.negative,
      0
    );
    const highPriorityCount = record.clusters.filter(
      (c) => c.priority === "高"
    ).length;

    const entry: HistoryEntry = {
      id: record.id,
      title: record.title,
      created_at: record.created_at,
      total_count: record.total_count,
      cluster_count: record.clusters.length,
      high_priority_count: highPriorityCount,
      negative_count: negativeCount,
      record,
      cost,
      analysisTime,
    };

    // 去重（相同 id 覆盖）
    const filtered = history.filter((h) => h.id !== entry.id);
    filtered.unshift(entry);

    // 限制数量
    const trimmed = filtered.slice(0, MAX_RECORDS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // localStorage 可能超出大小限制
    // 尝试只保存摘要信息，不保存完整 record
    try {
      const history = getHistory();
      const negativeCount = record.clusters.reduce(
        (sum, c) => sum + c.sentiment.negative,
        0
      );
      const highPriorityCount = record.clusters.filter(
        (c) => c.priority === "高"
      ).length;

      const entry: HistoryEntry = {
        id: record.id,
        title: record.title,
        created_at: record.created_at,
        total_count: record.total_count,
        cluster_count: record.clusters.length,
        high_priority_count: highPriorityCount,
        negative_count: negativeCount,
        // 保存精简版 record（不含 raw_feedback）
        record: {
          ...record,
          raw_feedback: [],
        },
        cost,
        analysisTime,
      };

      const filtered = history.filter((h) => h.id !== entry.id);
      filtered.unshift(entry);
      const trimmed = filtered.slice(0, MAX_RECORDS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      console.warn("历史记录保存失败", e);
    }
  }
}

/**
 * 删除一条历史记录
 */
export function deleteHistoryEntry(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory();
    const filtered = history.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

/**
 * 清空所有历史记录
 */
export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
