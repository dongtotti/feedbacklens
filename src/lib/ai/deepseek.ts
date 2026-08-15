/**
 * DeepSeek API 客户端封装
 *
 * 功能：
 * - chat completion 调用（支持 JSON mode）
 * - 自动重试（指数退避）
 * - 超时控制
 * - 无 API Key 时的 mock 模式
 * - Token 用量统计
 */

const DEEPSEEK_API_URL =
  process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

const MAX_RETRIES = 2;
const TIMEOUT_MS = 60000; // 60 秒超时
const DEFAULT_MODEL = "deepseek-chat";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean; // 使用 JSON output mode
}

export interface ChatCompletionResult {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number; // 预估费用（CNY）
}

// DeepSeek 定价（deepseek-chat 模型）
// 输入：¥0.001/1K tokens（cache miss），输出：¥0.002/1K tokens
const INPUT_PRICE_PER_1K = 0.001;
const OUTPUT_PRICE_PER_1K = 0.002;

/**
 * 调用 DeepSeek Chat Completion API
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const {
    messages,
    model = DEFAULT_MODEL,
    temperature = 0.3,
    maxTokens = 4096,
    jsonMode = false,
  } = options;

  // 无 API Key → mock 模式
  if (!DEEPSEEK_API_KEY) {
    return mockChatCompletion(messages);
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `DeepSeek API error ${response.status}: ${errorText.slice(0, 200)}`
        );
      }

      const data = await response.json();

      const content = data.choices?.[0]?.message?.content || "";
      const usage = data.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      const cost =
        (usage.prompt_tokens / 1000) * INPUT_PRICE_PER_1K +
        (usage.completion_tokens / 1000) * OUTPUT_PRICE_PER_1K;

      return {
        content,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        cost,
      };
    } catch (error) {
      lastError = error as Error;

      // 如果是 abort（超时），不重试
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("DeepSeek API 请求超时（60s）");
      }

      // 最后一次尝试失败，抛出错误
      if (attempt === MAX_RETRIES) {
        throw lastError;
      }

      // 指数退避等待
      const waitMs = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError || new Error("DeepSeek API 调用失败");
}

/**
 * 调用 API 并解析 JSON 结果
 */
export async function chatCompletionJson<T>(
  options: ChatCompletionOptions
): Promise<{ data: T; usage: ChatCompletionResult["usage"]; cost: number }> {
  const result = await chatCompletion({
    ...options,
    jsonMode: true,
  });

  try {
    // 尝试直接解析
    const data = JSON.parse(result.content) as T;
    return { data, usage: result.usage, cost: result.cost };
  } catch {
    // 如果直接解析失败，尝试从文本中提取 JSON
    const jsonMatch = result.content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]) as T;
      return { data, usage: result.usage, cost: result.cost };
    }
    throw new Error(
      `JSON 解析失败，API 返回内容: ${result.content.slice(0, 200)}`
    );
  }
}

// ============ Mock 模式 ============

/**
 * 无 API Key 时的 mock 响应
 * 返回合理的模拟数据，方便开发测试
 */
async function mockChatCompletion(
  messages: ChatMessage[]
): Promise<ChatCompletionResult> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 500));

  const systemMsg = messages.find((m) => m.role === "system")?.content || "";
  const userMsg = messages.find((m) => m.role === "user")?.content || "";

  let mockContent = "";

  // 根据 system prompt 判断返回哪种 mock 数据
  // 注意：判断顺序很重要，情感/建议的 prompt 中可能包含"聚类"一词
  if (systemMsg.includes("情感") || systemMsg.includes("sentiment")) {
    mockContent = generateMockSentiment(userMsg);
  } else if (systemMsg.includes("建议") || systemMsg.includes("suggestion")) {
    mockContent = generateMockSuggestions(userMsg);
  } else if (systemMsg.includes("聚类") || systemMsg.includes("cluster")) {
    mockContent = generateMockClustering(userMsg);
  } else {
    mockContent = '{"result": "mock response"}';
  }

  return {
    content: mockContent,
    usage: {
      promptTokens: Math.floor(userMsg.length / 3),
      completionTokens: Math.floor(mockContent.length / 3),
      totalTokens: Math.floor((userMsg.length + mockContent.length) / 3),
    },
    cost: 0,
  };
}

/**
 * Mock 聚类结果
 */
function generateMockClustering(userMsg: string): string {
  // 从 user message 中提取反馈数量
  const feedbackMatch = userMsg.match(/\[([\s\S]*?)\]/);
  let count = 40;
  if (feedbackMatch) {
    try {
      const arr = JSON.parse(feedbackMatch[0]);
      count = Array.isArray(arr) ? arr.length : 40;
    } catch {
      // ignore
    }
  }

  // 生成 5 个聚类的 mock 数据
  const clusterCount = Math.min(6, Math.max(3, Math.ceil(count / 10)));
  const clusters = [];
  let remaining = count;
  const labels = [
    "登录与注册问题",
    "支付与订单异常",
    "搜索与内容体验",
    "性能与稳定性",
    "功能建议与期望",
    "界面设计与好评",
  ];

  for (let i = 0; i < clusterCount; i++) {
    const size =
      i === clusterCount - 1
        ? remaining
        : Math.floor(remaining / (clusterCount - i));
    remaining -= size;

    const items: number[] = [];
    // 随机分配索引
    const startIdx = Math.floor((i * count) / clusterCount);
    for (let j = 0; j < size; j++) {
      items.push(startIdx + j);
    }

    clusters.push({
      label: labels[i],
      description: `该聚类包含 ${size} 条与「${labels[i]}」相关的用户反馈`,
      items,
    });
  }

  return JSON.stringify({ clusters });
}

/**
 * Mock 情感分析结果
 */
function generateMockSentiment(userMsg: string): string {
  // 提取聚类标签
  const clusterMatch = userMsg.match(/聚类标签[：:]\s*(.+?)[\n\r]/);
  const clusterLabel = clusterMatch ? clusterMatch[1].trim() : "未知聚类";

  // 提取反馈数量
  const countMatch = userMsg.match(/包含\s*(\d+)\s*条反馈/);
  const count = countMatch ? parseInt(countMatch[1], 10) : 10;

  // 根据聚类标签生成合理的情感分布
  const isNegativeTopic = ["登录", "支付", "崩溃", "异常", "性能", "稳定性"].some((k) =>
    clusterLabel.includes(k)
  );
  const isPositiveTopic = ["好评", "满意", "界面设计"].some((k) =>
    clusterLabel.includes(k)
  );

  let positive: number, negative: number, neutral: number;

  if (isPositiveTopic) {
    positive = Math.floor(count * 0.7);
    negative = Math.floor(count * 0.1);
  } else if (isNegativeTopic) {
    positive = Math.floor(count * 0.05);
    negative = Math.floor(count * 0.75);
  } else {
    positive = Math.floor(count * 0.2);
    negative = Math.floor(count * 0.4);
  }
  neutral = count - positive - negative;
  if (neutral < 0) {
    neutral = 0;
    negative = count - positive;
  }

  const priority = isNegativeTopic ? "高" : isPositiveTopic ? "低" : "中";

  const summaries: Record<string, string> = {
    "登录与注册问题": "用户普遍反映登录验证码收不到、注册流程过长，影响首次使用体验。",
    "支付与订单异常": "支付页面频繁崩溃，部分用户反映扣款后订单未生成，严重影响信任度。",
    "搜索与内容体验": "搜索结果准确度不足，用户希望增加筛选和排序功能。",
    "性能与稳定性": "App 启动慢、运行卡顿、自动闪退等问题集中，影响日常使用。",
    "功能建议与期望": "用户提出多项功能期望，包括夜间模式、收藏分组、订单导出等。",
    "界面设计与好评": "大量用户对新版界面表示满意，认为视觉体验明显提升。",
    "未知聚类": `该主题下用户反馈集中在 ${clusterLabel} 相关问题上。`,
  };

  const priorityReasons: Record<string, string> = {
    "高": "负面反馈占比高，涉及核心功能链路，需优先处理",
    "中": "反馈量中等，影响部分用户体验，建议排期处理",
    "低": "以正面反馈为主，可作为后续优化参考",
  };

  const result = {
    sentiment: { positive, negative, neutral },
    priority,
    priority_reason: priorityReasons[priority],
    summary: summaries[clusterLabel] || summaries["未知聚类"],
  };

  return JSON.stringify(result);
}

/**
 * Mock 改进建议
 */
function generateMockSuggestions(userMsg: string): string {
  const suggestions = [
    {
      cluster: "登录与注册问题",
      suggestion: "接入备用短信通道，增加验证码重发倒计时，提供邮箱验证备选方案。",
      impact: "高",
      effort: "中",
    },
    {
      cluster: "支付与订单异常",
      suggestion: "排查支付回调链路，增加订单状态兜底校验，添加扣款异常自动退款逻辑。",
      impact: "高",
      effort: "高",
    },
    {
      cluster: "搜索与内容体验",
      suggestion: "引入搜索排序算法优化，增加价格/销量/评分筛选维度，提升搜索准确率。",
      impact: "中",
      effort: "中",
    },
    {
      cluster: "性能与稳定性",
      suggestion: "优化 App 启动流程，排查内存泄漏，增加崩溃监控和自动上报机制。",
      impact: "高",
      effort: "中",
    },
    {
      cluster: "功能建议与期望",
      suggestion: "优先实现夜间模式和收藏分组功能，这些是用户呼声最高的需求。",
      impact: "中",
      effort: "低",
    },
    {
      cluster: "界面设计与好评",
      suggestion: "保持当前设计方向，可在后续版本中收集更多设计偏好数据用于持续优化。",
      impact: "低",
      effort: "低",
    },
  ];

  // 尝试从输入中提取聚类标签来过滤建议
  const labels: string[] = [];
  const labelRegex = /"cluster_label"\s*:\s*"([^"]+)"/g;
  let labelMatch;
  while ((labelMatch = labelRegex.exec(userMsg)) !== null) {
    labels.push(labelMatch[1]);
  }

  const filtered =
    labels.length > 0
      ? suggestions.filter((s) => labels.some((l) => s.cluster.includes(l) || l.includes(s.cluster)))
      : suggestions;

  return JSON.stringify({
    suggestions: filtered.length > 0 ? filtered : suggestions.slice(0, 3),
  });
}
