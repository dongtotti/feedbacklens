"use client";

/**
 * Recharts 图表组件
 *
 * 用于结果看板页面（D8）：
 * - 聚类分布横向柱状图
 * - 情感占比堆叠柱状图
 * - 优先级矩阵散点图
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
  LabelList,
} from "recharts";
import type { Cluster } from "@/lib/types";

// ============ 颜色常量 ============

const CHART_COLORS = {
  primary: "hsl(244, 41%, 51%)",
  blue: "hsl(200, 95%, 45%)",
  green: "hsl(150, 60%, 40%)",
  orange: "hsl(30, 90%, 55%)",
  red: "hsl(0, 70%, 55%)",
  gray: "hsl(240, 4%, 60%)",
};

const PRIORITY_COLORS: Record<string, string> = {
  "高": "hsl(0, 70%, 55%)",
  "中": "hsl(30, 90%, 55%)",
  "低": "hsl(150, 60%, 40%)",
};

// ============ 聚类分布横向柱状图 ============

interface ClusterDistributionChartProps {
  clusters: Cluster[];
}

export function ClusterDistributionChart({
  clusters,
}: ClusterDistributionChartProps) {
  const data = [...clusters]
    .map((c) => ({
      name: c.label,
      count: c.items.length,
      priority: c.priority,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <ResponsiveContainer width="100%" height={Math.max(250, data.length * 45)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 40, left: 20, bottom: 8 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={false}
          stroke="hsl(240, 5%, 90%)"
        />
        <XAxis
          type="number"
          tick={{ fontSize: 12, fill: "hsl(240, 4%, 46%)" }}
          axisLine={{ stroke: "hsl(240, 5%, 90%)" }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: "hsl(240, 10%, 4%)" }}
          width={120}
          axisLine={{ stroke: "hsl(240, 5%, 90%)" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(240, 5%, 90%)",
            fontSize: "13px",
          }}
          formatter={(value: number) => [`${value} 条反馈`, "数量"]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
          {data.map((entry, idx) => (
            <Cell
              key={idx}
              fill={PRIORITY_COLORS[entry.priority] || CHART_COLORS.primary}
            />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            style={{ fontSize: 12, fill: "hsl(240, 4%, 46%)" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============ 情感占比堆叠柱状图 ============

interface SentimentChartProps {
  clusters: Cluster[];
}

export function SentimentChart({ clusters }: SentimentChartProps) {
  const data = clusters.map((c) => {
    const total = c.items.length || 1;
    return {
      name: c.label.length > 8 ? c.label.slice(0, 7) + "…" : c.label,
      positive: Math.round((c.sentiment.positive / total) * 100),
      negative: Math.round((c.sentiment.negative / total) * 100),
      neutral: Math.round((c.sentiment.neutral / total) * 100),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(240, 5%, 90%)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "hsl(240, 4%, 46%)" }}
          axisLine={{ stroke: "hsl(240, 5%, 90%)" }}
          tickLine={false}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "hsl(240, 4%, 46%)" }}
          axisLine={{ stroke: "hsl(240, 5%, 90%)" }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(240, 5%, 90%)",
            fontSize: "13px",
          }}
          formatter={(value: number, name: string) => [`${value}%`, name]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
        />
        <Bar
          dataKey="positive"
          name="正面"
          stackId="sentiment"
          fill={CHART_COLORS.green}
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="neutral"
          name="中性"
          stackId="sentiment"
          fill={CHART_COLORS.gray}
        />
        <Bar
          dataKey="negative"
          name="负面"
          stackId="sentiment"
          fill={CHART_COLORS.red}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============ 优先级矩阵散点图 ============

interface PriorityMatrixChartProps {
  clusters: Cluster[];
}

export function PriorityMatrixChart({
  clusters,
}: PriorityMatrixChartProps) {
  // X 轴 = 频次（反馈数量），Y 轴 = 严重性（负面占比），Z 轴 = 气泡大小（反馈数）
  const data = clusters.map((c) => {
    const total = c.items.length || 1;
    const negativeRate = (c.sentiment.negative / total) * 100;
    return {
      x: c.items.length,
      y: Math.round(negativeRate),
      z: c.items.length * 10,
      label: c.label,
      priority: c.priority,
    };
  });

  // 按优先级分组
  const highPriority = data.filter((d) => d.priority === "高");
  const mediumPriority = data.filter((d) => d.priority === "中");
  const lowPriority = data.filter((d) => d.priority === "低");

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart
        margin={{ top: 16, right: 24, left: 0, bottom: 16 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 90%)" />
        <XAxis
          type="number"
          dataKey="x"
          name="频次"
          tick={{ fontSize: 12, fill: "hsl(240, 4%, 46%)" }}
          axisLine={{ stroke: "hsl(240, 5%, 90%)" }}
          label={{
            value: "反馈数量",
            position: "insideBottom",
            offset: -5,
            style: { fontSize: 11, fill: "hsl(240, 4%, 46%)" },
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="负面占比"
          tick={{ fontSize: 12, fill: "hsl(240, 4%, 46%)" }}
          axisLine={{ stroke: "hsl(240, 5%, 90%)" }}
          tickFormatter={(v) => `${v}%`}
          label={{
            value: "负面占比",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 11, fill: "hsl(240, 4%, 46%)" },
          }}
        />
        <ZAxis type="number" dataKey="z" range={[60, 400]} name="规模" />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(240, 5%, 90%)",
            fontSize: "13px",
          }}
          content={({ payload }) => {
            if (!payload || payload.length === 0) return null;
            const data = payload[0]?.payload as (typeof clusters)[0] extends never ? never : {
              label: string;
              x: number;
              y: number;
              priority: string;
            };
            if (!data) return null;
            return (
              <div
                style={{
                  borderRadius: "8px",
                  border: "1px solid hsl(240, 5%, 90%)",
                  background: "hsl(0, 0%, 100%)",
                  padding: "8px 12px",
                  fontSize: "13px",
                }}
              >
                <p style={{ fontWeight: 600, marginBottom: 4 }}>
                  {data.label}
                </p>
                <p style={{ color: "hsl(240, 4%, 46%)" }}>
                  反馈数：{data.x} · 负面占比：{data.y}%
                </p>
                <p style={{ color: PRIORITY_COLORS[data.priority] || CHART_COLORS.primary }}>
                  优先级：{data.priority}
                </p>
              </div>
            );
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
        />
        {highPriority.length > 0 && (
          <Scatter
            name="高优先级"
            data={highPriority}
            fill={CHART_COLORS.red}
            fillOpacity={0.7}
          />
        )}
        {mediumPriority.length > 0 && (
          <Scatter
            name="中优先级"
            data={mediumPriority}
            fill={CHART_COLORS.orange}
            fillOpacity={0.7}
          />
        )}
        {lowPriority.length > 0 && (
          <Scatter
            name="低优先级"
            data={lowPriority}
            fill={CHART_COLORS.green}
            fillOpacity={0.7}
          />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
