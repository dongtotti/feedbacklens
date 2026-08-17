/**
 * EdgeOne Edge Function: /api/analyze
 *
 * FeedbackLens 三步 AI 分析引擎 — EdgeOne 边缘节点版本
 *
 * AI 调用优先级：
 * 1. EdgeOne 内置边缘 AI（@makers/deepseek-v4-flash）— 免费、超低延迟
 * 2. 外部 DeepSeek API（需要 DEEPSEEK_API_KEY 环境变量）
 * 3. Mock 模式（无 API Key 时自动降级）
 *
 * 三步分析流程：
 * Step 1: 聚类 — 将所有反馈按主题分组
 * Step 2: 情感+优先级 — 对每个聚类并行分析
 * Step 3: 改进建议 — 基于分析结果生成可执行建议
 */

// ============ Prompt 模板 ============

const CLUSTERING_SYSTEM_PROMPT = `你是一个专业的用户反馈分析专家。你的任务是将大量用户反馈按照主题进行智能聚类分组。

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

const SENTIMENT_SYSTEM_PROMPT = `你是一个专业的用户反馈情感分析专家。你的任务是对一个聚类分组内的用户反馈进行情感分析和优先级评估。

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

const SUGGESTIONS_SYSTEM_PROMPT = `你是一个资深产品顾问。你的任务是根据用户反馈的聚类分析结果，为每个聚类生成可执行的改进建议。

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

// ============ 辅助函数 ============

function buildClusteringUserPrompt(feedback) {
  return `请对以下 ${feedback.length} 条用户反馈进行聚类分组。

反馈列表（索引从0开始）：
${JSON.stringify(feedback)}

请输出聚类结果的 JSON。`;
}

function buildSentimentUserPrompt(label, description, feedbackItems) {
  return `请分析以下聚类中的用户反馈。

聚类标签：${label}
聚类描述：${description}

该聚类包含 ${feedbackItems.length} 条反馈：
${JSON.stringify(feedbackItems)}

请输出情感分析和优先级评估的 JSON。`;
}

function buildSuggestionsUserPrompt(clusters) {
  return `请根据以下聚类分析结果，为每个聚类生成改进建议。

聚类分析结果：
${JSON.stringify(clusters, null, 2)}

请为每个聚类输出一条改进建议的 JSON。`;
}

function batchFeedback(feedback, batchSize) {
  if (batchSize === void 0) batchSize = 200;
  if (feedback.length <= batchSize) return [feedback];
  var batches = [];
  for (var i = 0; i < feedback.length; i += batchSize) {
    batches.push(feedback.slice(i, i + batchSize));
  }
  return batches;
}

function isSimilarLabel(a, b) {
  if (a === b) return true;
  var wordsA = a.split(/[\s/、，,（）()]+/).filter(function (w) { return w.length >= 2; });
  var wordsB = b.split(/[\s/、，,（）()]+/).filter(function (w) { return w.length >= 2; });
  var intersection = wordsA.filter(function (w) {
    return wordsB.some(function (wb) { return wb.includes(w) || w.includes(wb); });
  });
  return intersection.length > 0;
}

function mergeClusteringResults(batchResults, batchSizes) {
  if (batchResults.length === 1) return batchResults[0];
  var allClusters = [];
  var indexOffset = 0;
  for (var b = 0; b < batchResults.length; b++) {
    var result = batchResults[b];
    for (var j = 0; j < result.clusters.length; j++) {
      var cluster = result.clusters[j];
      allClusters.push({
        label: cluster.label,
        description: cluster.description,
        items: cluster.items.map(function (idx) { return idx + indexOffset; }),
      });
    }
    indexOffset += batchSizes[b];
  }
  var merged = [];
  var used = new Set();
  for (var i = 0; i < allClusters.length; i++) {
    if (used.has(i)) continue;
    var current = { label: allClusters[i].label, description: allClusters[i].description, items: allClusters[i].items.slice() };
    for (var k = i + 1; k < allClusters.length; k++) {
      if (used.has(k)) continue;
      if (isSimilarLabel(current.label, allClusters[k].label)) {
        current.items = current.items.concat(allClusters[k].items);
        used.add(k);
      }
    }
    merged.push(current);
  }
  return { clusters: merged };
}

function validateClusteringResult(data) {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.clusters)) return false;
  return data.clusters.every(function (c) {
    return c && typeof c === "object" && typeof c.label === "string" && Array.isArray(c.items);
  });
}

function validateSentimentResult(data) {
  if (!data || typeof data !== "object") return false;
  var s = data.sentiment;
  return s && typeof s.positive === "number" && typeof s.negative === "number" && typeof s.neutral === "number" && typeof data.priority === "string";
}

function validateSuggestionsResult(data) {
  if (!data || typeof data !== "object") return false;
  return Array.isArray(data.suggestions);
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    var match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("JSON 解析失败: " + text.slice(0, 200));
  }
}

// ============ AI 调用层 ============

/**
 * 调用 AI Chat Completion
 *
 * 三级降级策略：
 * 1. EdgeOne 内置 AI（context 中的 AI 对象）
 * 2. 外部 DeepSeek API
 * 3. Mock 模式
 */
async function callAI(messages, options, env) {
  var temperature = options.temperature || 0.3;
  var maxTokens = options.maxTokens || 4096;

  // 尝试 EdgeOne 内置 AI
  if (typeof AI !== "undefined" && AI.chatCompletions) {
    try {
      var aiResponse = await AI.chatCompletions({
        model: "@makers/deepseek-v4-flash",
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: false,
      });

      // 解析响应
      var content = "";
      var usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      if (aiResponse && aiResponse.choices && aiResponse.choices[0]) {
        content = aiResponse.choices[0].message?.content || "";
      } else if (typeof aiResponse === "string") {
        content = aiResponse;
      } else if (aiResponse && aiResponse.content) {
        content = aiResponse.content;
      }

      if (aiResponse && aiResponse.usage) {
        usage = {
          promptTokens: aiResponse.usage.prompt_tokens || 0,
          completionTokens: aiResponse.usage.completion_tokens || 0,
          totalTokens: aiResponse.usage.total_tokens || 0,
        };
      }

      return { content: content, usage: usage, cost: 0, source: "edge-ai" };
    } catch (e) {
      console.warn("EdgeOne 内置 AI 调用失败，降级到外部 API:", e.message);
    }
  }

  // 尝试外部 DeepSeek API
  var apiKey = env.DEEPSEEK_API_KEY;
  var apiUrl = env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions";

  if (apiKey) {
    var body = {
      model: "deepseek-chat",
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
    };

    if (options.jsonMode) {
      body.response_format = { type: "json_object" };
    }

    var MAX_RETRIES = 2;
    var lastError = null;

    for (var attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        var response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          var errorText = await response.text();
          throw new Error("DeepSeek API error " + response.status + ": " + errorText.slice(0, 200));
        }

        var data = await response.json();
        var content = data.choices?.[0]?.message?.content || "";
        var u = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        // DeepSeek 定价
        var INPUT_PRICE = 0.001;
        var OUTPUT_PRICE = 0.002;
        var cost = (u.prompt_tokens / 1000) * INPUT_PRICE + (u.completion_tokens / 1000) * OUTPUT_PRICE;

        return {
          content: content,
          usage: {
            promptTokens: u.prompt_tokens,
            completionTokens: u.completion_tokens,
            totalTokens: u.total_tokens,
          },
          cost: cost,
          source: "deepseek-api",
        };
      } catch (e) {
        lastError = e;
        if (attempt < MAX_RETRIES) {
          var waitMs = Math.pow(2, attempt) * 1000;
          await new Promise(function (r) { setTimeout(r, waitMs); });
        }
      }
    }

    console.warn("外部 DeepSeek API 调用失败，降级到 mock 模式:", lastError?.message);
  }

  // Mock 模式
  return mockChatCompletion(messages);
}

/**
 * 调用 AI 并解析 JSON
 */
async function callAIJson(messages, options, env) {
  var result = await callAI(messages, options, env);
  var data = safeJsonParse(result.content);
  return { data: data, usage: result.usage, cost: result.cost, source: result.source };
}

// ============ Mock 数据生成 ============

function mockChatCompletion(messages) {
  var systemMsg = messages.find(function (m) { return m.role === "system"; })?.content || "";
  var userMsg = messages.find(function (m) { return m.role === "user"; })?.content || "";

  var mockContent = "";

  // 注意判断顺序：情感/建议的 prompt 中可能包含"聚类"一词
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
    source: "mock",
  };
}

function generateMockClustering(userMsg) {
  var feedbackMatch = userMsg.match(/\[([\s\S]*?)\]/);
  var count = 40;
  if (feedbackMatch) {
    try {
      var arr = JSON.parse(feedbackMatch[0]);
      count = Array.isArray(arr) ? arr.length : 40;
    } catch (e) {}
  }

  var clusterCount = Math.min(6, Math.max(3, Math.ceil(count / 10)));
  var clusters = [];
  var remaining = count;
  var labels = [
    "登录与注册问题",
    "支付与订单异常",
    "搜索与内容体验",
    "性能与稳定性",
    "功能建议与期望",
    "界面设计与好评",
  ];

  for (var i = 0; i < clusterCount; i++) {
    var size = i === clusterCount - 1 ? remaining : Math.floor(remaining / (clusterCount - i));
    remaining -= size;
    var items = [];
    var startIdx = Math.floor((i * count) / clusterCount);
    for (var j = 0; j < size; j++) {
      items.push(startIdx + j);
    }
    clusters.push({
      label: labels[i],
      description: "该聚类包含 " + size + " 条与「" + labels[i] + "」相关的用户反馈",
      items: items,
    });
  }

  return JSON.stringify({ clusters: clusters });
}

function generateMockSentiment(userMsg) {
  var clusterMatch = userMsg.match(/聚类标签[：:]\s*(.+?)[\n\r]/);
  var clusterLabel = clusterMatch ? clusterMatch[1].trim() : "未知聚类";

  var countMatch = userMsg.match(/包含\s*(\d+)\s*条反馈/);
  var count = countMatch ? parseInt(countMatch[1], 10) : 10;

  var isNegative = ["登录", "支付", "崩溃", "异常", "性能", "稳定性"].some(function (k) { return clusterLabel.includes(k); });
  var isPositive = ["好评", "满意", "界面设计"].some(function (k) { return clusterLabel.includes(k); });

  var positive, negative, neutral;
  if (isPositive) {
    positive = Math.floor(count * 0.7);
    negative = Math.floor(count * 0.1);
  } else if (isNegative) {
    positive = Math.floor(count * 0.05);
    negative = Math.floor(count * 0.75);
  } else {
    positive = Math.floor(count * 0.2);
    negative = Math.floor(count * 0.4);
  }
  neutral = count - positive - negative;
  if (neutral < 0) { neutral = 0; negative = count - positive; }

  var priority = isNegative ? "高" : isPositive ? "低" : "中";

  var summaries = {
    "登录与注册问题": "用户普遍反映登录验证码收不到、注册流程过长，影响首次使用体验。",
    "支付与订单异常": "支付页面频繁崩溃，部分用户反映扣款后订单未生成，严重影响信任度。",
    "搜索与内容体验": "搜索结果准确度不足，用户希望增加筛选和排序功能。",
    "性能与稳定性": "App 启动慢、运行卡顿、自动闪退等问题集中，影响日常使用。",
    "功能建议与期望": "用户提出多项功能期望，包括夜间模式、收藏分组、订单导出等。",
    "界面设计与好评": "大量用户对新版界面表示满意，认为视觉体验明显提升。",
    "未知聚类": "该主题下用户反馈集中在 " + clusterLabel + " 相关问题上。",
  };

  var priorityReasons = {
    "高": "负面反馈占比高，涉及核心功能链路，需优先处理",
    "中": "反馈量中等，影响部分用户体验，建议排期处理",
    "低": "以正面反馈为主，可作为后续优化参考",
  };

  return JSON.stringify({
    sentiment: { positive: positive, negative: negative, neutral: neutral },
    priority: priority,
    priority_reason: priorityReasons[priority],
    summary: summaries[clusterLabel] || summaries["未知聚类"],
  });
}

function generateMockSuggestions(userMsg) {
  var suggestions = [
    { cluster: "登录与注册问题", suggestion: "接入备用短信通道，增加验证码重发倒计时，提供邮箱验证备选方案。", impact: "高", effort: "中" },
    { cluster: "支付与订单异常", suggestion: "排查支付回调链路，增加订单状态兜底校验，添加扣款异常自动退款逻辑。", impact: "高", effort: "高" },
    { cluster: "搜索与内容体验", suggestion: "引入搜索排序算法优化，增加价格/销量/评分筛选维度，提升搜索准确率。", impact: "中", effort: "中" },
    { cluster: "性能与稳定性", suggestion: "优化 App 启动流程，排查内存泄漏，增加崩溃监控和自动上报机制。", impact: "高", effort: "中" },
    { cluster: "功能建议与期望", suggestion: "优先实现夜间模式和收藏分组功能，这些是用户呼声最高的需求。", impact: "中", effort: "低" },
    { cluster: "界面设计与好评", suggestion: "保持当前设计方向，可在后续版本中收集更多设计偏好数据用于持续优化。", impact: "低", effort: "低" },
  ];

  var labels = [];
  var labelRegex = /"cluster_label"\s*:\s*"([^"]+)"/g;
  var labelMatch;
  while ((labelMatch = labelRegex.exec(userMsg)) !== null) {
    labels.push(labelMatch[1]);
  }

  var filtered = labels.length > 0
    ? suggestions.filter(function (s) { return labels.some(function (l) { return s.cluster.includes(l) || l.includes(s.cluster); }); })
    : suggestions;

  return JSON.stringify({ suggestions: filtered.length > 0 ? filtered : suggestions.slice(0, 3) });
}

// ============ 三步分析引擎 ============

async function runAnalysis(feedback, inputType, env) {
  var totalCost = 0;
  var totalTokens = 0;
  var source = "mock";

  // Step 1: 聚类
  var batches = batchFeedback(feedback, 200);
  var batchSizes = batches.map(function (b) { return b.length; });

  var clusteringResult;

  if (batches.length === 1) {
    var result = await callAIJson(
      [
        { role: "system", content: CLUSTERING_SYSTEM_PROMPT },
        { role: "user", content: buildClusteringUserPrompt(batches[0]) },
      ],
      { temperature: 0.2, jsonMode: true },
      env
    );

    if (!validateClusteringResult(result.data)) {
      throw new Error("聚类结果格式异常");
    }

    clusteringResult = result.data;
    totalCost += result.cost;
    totalTokens += result.usage.totalTokens;
    source = result.source;
  } else {
    var batchResults = [];
    for (var i = 0; i < batches.length; i++) {
      var batchResult = await callAIJson(
        [
          { role: "system", content: CLUSTERING_SYSTEM_PROMPT },
          { role: "user", content: buildClusteringUserPrompt(batches[i]) },
        ],
        { temperature: 0.2, jsonMode: true },
        env
      );

      if (!validateClusteringResult(batchResult.data)) {
        throw new Error("第 " + (i + 1) + " 批聚类结果格式异常");
      }

      batchResults.push(batchResult.data);
      totalCost += batchResult.cost;
      totalTokens += batchResult.usage.totalTokens;
      source = batchResult.source;
    }
    clusteringResult = mergeClusteringResults(batchResults, batchSizes);
  }

  // Step 2: 情感+优先级（并行）
  var sentimentPromises = clusteringResult.clusters.map(function (cluster, idx) {
    var clusterFeedback = cluster.items.map(function (i) { return feedback[i]; }).filter(Boolean);
    return callAIJson(
      [
        { role: "system", content: SENTIMENT_SYSTEM_PROMPT },
        { role: "user", content: buildSentimentUserPrompt(cluster.label, cluster.description, clusterFeedback) },
      ],
      { temperature: 0.3, jsonMode: true },
      env
    );
  });

  var sentimentResults = await Promise.all(sentimentPromises);

  for (var s = 0; s < sentimentResults.length; s++) {
    totalCost += sentimentResults[s].cost;
    totalTokens += sentimentResults[s].usage.totalTokens;
  }

  // 组装聚类完整数据
  var clusters = clusteringResult.clusters.map(function (cluster, idx) {
    var sentiment = sentimentResults[idx].data;
    if (!validateSentimentResult(sentiment)) {
      sentiment = {
        sentiment: { positive: 0, negative: 0, neutral: cluster.items.length },
        priority: "中",
        priority_reason: "分析结果异常，默认中优先级",
        summary: cluster.description,
      };
    }
    return {
      id: "cluster-" + idx,
      label: cluster.label,
      description: cluster.description,
      items: cluster.items,
      sentiment: sentiment.sentiment,
      priority: sentiment.priority,
      priority_reason: sentiment.priority_reason,
      summary: sentiment.summary,
    };
  });

  // Step 3: 改进建议
  var suggestionsInput = clusters.map(function (c) {
    return {
      label: c.label,
      description: c.description,
      summary: c.summary,
      sentiment: c.sentiment,
      priority: c.priority,
      priority_reason: c.priority_reason,
    };
  });

  var suggestionsResult = await callAIJson(
    [
      { role: "system", content: SUGGESTIONS_SYSTEM_PROMPT },
      { role: "user", content: buildSuggestionsUserPrompt(suggestionsInput) },
    ],
    { temperature: 0.4, jsonMode: true },
    env
  );

  totalCost += suggestionsResult.cost;
  totalTokens += suggestionsResult.usage.totalTokens;

  var suggestions = [];
  if (validateSuggestionsResult(suggestionsResult.data)) {
    suggestions = suggestionsResult.data.suggestions.map(function (s, idx) {
      return {
        cluster_id: clusters[idx]?.id || "cluster-" + idx,
        cluster_label: s.cluster,
        suggestion: s.suggestion,
        impact: s.impact,
        effort: s.effort,
      };
    });
  } else {
    suggestions = clusters.map(function (c) {
      return {
        cluster_id: c.id,
        cluster_label: c.label,
        suggestion: c.summary,
        impact: "中",
        effort: "中",
      };
    });
  }

  // 组装最终结果
  var record = {
    id: "analysis-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    user_id: null,
    created_at: new Date().toISOString(),
    title: "反馈分析 — " + feedback.length + " 条用户反馈",
    status: "completed",
    input_type: inputType,
    total_count: feedback.length,
    raw_feedback: feedback,
    clusters: clusters,
    suggestions: suggestions,
  };

  return { record: record, totalCost: totalCost, totalTokens: totalTokens, source: source };
}

// ============ Edge Function Handler ============

export async function onRequestPost(context) {
  var request = context.request;
  var env = context.env || {};

  // CORS headers
  var corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    var body = await request.json();
    var inputType = body.inputType;
    var feedback = body.feedback;

    // 参数校验
    if (!inputType || !["csv", "text"].includes(inputType)) {
      return new Response(JSON.stringify({ error: "inputType 必须为 csv 或 text" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!Array.isArray(feedback)) {
      return new Response(JSON.stringify({ error: "feedback 必须是字符串数组" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    var validFeedback = feedback.filter(function (f) {
      return typeof f === "string" && f.trim().length > 0;
    });

    var MIN_FEEDBACK = 5;
    var MAX_FEEDBACK = 1000;

    if (validFeedback.length < MIN_FEEDBACK) {
      return new Response(
        JSON.stringify({ error: "至少需要 " + MIN_FEEDBACK + " 条有效反馈" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (validFeedback.length > MAX_FEEDBACK) {
      return new Response(
        JSON.stringify({ error: "最多支持 " + MAX_FEEDBACK + " 条反馈" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 执行分析
    var result = await runAnalysis(validFeedback, inputType, env);

    return new Response(
      JSON.stringify({
        id: result.record.id,
        status: "completed",
        result: result.record,
        cost: {
          cny: Number(result.totalCost.toFixed(4)),
          tokens: result.totalTokens,
          isMock: result.source === "mock",
          source: result.source,
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Edge Function /api/analyze] 分析失败:", error);
    var message = error instanceof Error ? error.message : "未知错误";

    return new Response(
      JSON.stringify({
        error: "分析失败: " + message,
        status: "failed",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
