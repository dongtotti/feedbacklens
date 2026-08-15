/**
 * POST /api/analyze
 *
 * 接收用户反馈数组，执行三步 AI 分析，返回完整分析结果
 *
 * 请求体：
 * { "inputType": "csv" | "text", "feedback": string[] }
 *
 * 响应：
 * { "id": string, "status": "completed", "result": AnalysisRecord, "cost": number }
 *
 * 错误：
 * 400 — 参数校验失败
 * 500 — AI 分析失败
 */

import { NextRequest, NextResponse } from "next/server";
import { runAnalysis } from "@/lib/ai/analyzer";
import type { InputType } from "@/lib/types";

const MIN_FEEDBACK = 5;
const MAX_FEEDBACK = 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ===== 参数校验 =====
    const { inputType, feedback } = body as {
      inputType?: string;
      feedback?: unknown;
    };

    if (!inputType || !["csv", "text"].includes(inputType)) {
      return NextResponse.json(
        { error: "inputType 必须为 csv 或 text" },
        { status: 400 }
      );
    }

    if (!Array.isArray(feedback)) {
      return NextResponse.json(
        { error: "feedback 必须是字符串数组" },
        { status: 400 }
      );
    }

    const validFeedback = feedback.filter(
      (f): f is string => typeof f === "string" && f.trim().length > 0
    );

    if (validFeedback.length < MIN_FEEDBACK) {
      return NextResponse.json(
        { error: `至少需要 ${MIN_FEEDBACK} 条有效反馈` },
        { status: 400 }
      );
    }

    if (validFeedback.length > MAX_FEEDBACK) {
      return NextResponse.json(
        { error: `最多支持 ${MAX_FEEDBACK} 条反馈` },
        { status: 400 }
      );
    }

    // ===== 执行分析 =====
    const { record, totalCost, totalTokens } = await runAnalysis(
      validFeedback,
      inputType as InputType
    );

    // ===== 返回结果 =====
    return NextResponse.json({
      id: record.id,
      status: "completed" as const,
      result: record,
      cost: {
        cny: Number(totalCost.toFixed(4)),
        tokens: totalTokens,
        isMock: !process.env.DEEPSEEK_API_KEY,
      },
    });
  } catch (error) {
    console.error("[API /analyze] 分析失败:", error);
    const message =
      error instanceof Error ? error.message : "未知错误";

    return NextResponse.json(
      {
        error: `分析失败: ${message}`,
        status: "failed" as const,
      },
      { status: 500 }
    );
  }
}

// 不缓存分析结果
export const dynamic = "force-dynamic";
