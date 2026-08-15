"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  FileBarChart,
  Inbox,
  Trash2,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  getHistory,
  deleteHistoryEntry,
  clearHistory,
  type HistoryEntry,
} from "@/lib/history";

export default function HistoryPage() {
  const { user, isMockMode } = useAuth();
  const [records, setRecords] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const history = getHistory();
    setRecords(history);
    setLoading(false);
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteHistoryEntry(id);
    setRecords(getHistory());
  };

  const handleClearAll = () => {
    if (confirm("确定清空所有历史记录吗？此操作不可撤销。")) {
      clearHistory();
      setRecords([]);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">历史记录</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {user
            ? `已登录${isMockMode ? "（演示模式）" : ""} · 记录保存在本地浏览器中`
            : "未登录 · 记录保存在本地浏览器中，登录后可跨设备同步"}
        </p>
      </div>

      {/* 未登录提示 */}
      {!user && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <Inbox className="h-4 w-4 flex-shrink-0 text-primary" />
          <span className="text-muted-foreground">
            登录后可跨设备同步历史记录。
            <Link href="/auth" className="ml-1 font-medium text-primary hover:underline">
              去登录
            </Link>
          </span>
        </div>
      )}

      {/* 记录列表 */}
      {records.length > 0 ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              共 {records.length} 条记录
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                清空全部
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {records.map((record) => (
              <Link
                key={record.id}
                href={`/result/${record.id}`}
                className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md sm:p-5"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileBarChart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">
                      {record.title}
                    </h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(record.created_at).toLocaleDateString("zh-CN")}
                      </span>
                      <span>{record.total_count} 条反馈</span>
                      <span>{record.cluster_count} 个主题</span>
                      {record.high_priority_count > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-destructive">
                          <TrendingUp className="h-3 w-3" />
                          {record.high_priority_count} 高优
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(record.id, e)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center sm:p-16">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">还没有分析记录</p>
          <p className="mt-1 text-xs text-muted-foreground">
            完成分析后，记录会自动保存在这里
          </p>
          <Link
            href="/upload"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            开始第一次分析
          </Link>
        </div>
      )}

      {/* 底部操作 */}
      <div className="mt-8 text-center">
        <Link
          href="/upload"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          新建分析
        </Link>
      </div>
    </div>
  );
}
