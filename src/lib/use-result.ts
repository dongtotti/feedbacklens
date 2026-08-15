"use client";

/**
 * 分析结果数据读取工具
 *
 * 统一从 sessionStorage（刚分析完）或 localStorage 历史（回看）中获取结果。
 * 被 result 看板页和 detail 报告页共用。
 */

import { useState, useEffect } from "react";
import type { AnalysisRecord } from "@/lib/types";
import { getHistoryEntry } from "@/lib/history";

export interface StoredResult {
  record: AnalysisRecord;
  cost?: {
    cny: number;
    tokens: number;
    isMock: boolean;
  };
  analysisTime?: number;
}

export function useAnalysisResult(id: string | undefined) {
  const [data, setData] = useState<StoredResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let found = false;

    // 1. 先从 sessionStorage 读取（刚分析完的数据）
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("feedbacklens_result");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as StoredResult;
          if (parsed.record && (parsed.record.id === id || id === "demo")) {
            setData(parsed);
            found = true;
          }
        } catch {
          // ignore
        }
      }
    }

    // 2. 如果 sessionStorage 没有，从 localStorage 历史读取
    if (!found && typeof window !== "undefined") {
      const entry = getHistoryEntry(id);
      if (entry) {
        setData({
          record: entry.record,
          cost: entry.cost,
          analysisTime: entry.analysisTime,
        });
        found = true;
      }
    }

    // 3. 如果都没有，尝试加载示例数据（id === "demo"）
    if (!found && id === "demo") {
      // 通过 API 加载示例分析
      fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputType: "text",
          // 使用简单的示例反馈
          feedback: [
            "App登录验证码收不到，已经试了好几次了",
            "支付页面总是崩溃，扣了钱但订单没生成",
            "搜索功能找不到想要的东西，准确度太低了",
            "界面设计很漂亮，体验不错，给个好评",
            "App启动太慢了，每次要等好几秒",
            "希望增加夜间模式，晚上用太刺眼了",
            "支付时经常闪退，希望能尽快修复",
            "登录流程太复杂，步骤太多了",
            "搜索结果排序不合理，希望能按相关度排序",
            "新版界面很好看，比之前好多了",
            "App经常卡顿，特别是列表页加载很慢",
            "验证码等了五分钟才收到，体验太差了",
            "希望支持收藏分组功能，方便管理",
            "支付成功后没有收到通知，不知道付了没有",
            "搜索可以增加筛选条件吗？比如价格范围",
            "整体体验不错，但是偶尔会闪退",
            "登录能不能支持第三方账号？微信QQ之类的",
            "订单页面加载不出来，一直转圈",
            "App体积太大了，希望能优化一下",
            "界面配色很好看，点赞",
          ],
        }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("分析失败");
          const json = await res.json();
          if (json.error) throw new Error(json.error);
          const record = json.result as AnalysisRecord;
          const result: StoredResult = {
            record,
            cost: json.cost,
            analysisTime: 0,
          };
          // 存入 sessionStorage 供后续使用
          try {
            sessionStorage.setItem(
              "feedbacklens_result",
              JSON.stringify(result)
            );
          } catch {
            // ignore
          }
          setData(result);
          setLoading(false);
        })
        .catch(() => {
          setNotFound(true);
          setLoading(false);
        });
      return; // 异步加载中，不执行下面的代码
    }

    if (!found) {
      setNotFound(true);
    }
    setLoading(false);
  }, [id]);

  return { data, loading, notFound };
}
