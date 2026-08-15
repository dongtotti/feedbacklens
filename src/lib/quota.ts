/**
 * 免费额度管理
 *
 * 规则（PRD 定义）：
 * - 未登录用户：3 次/天
 * - 登录用户：10 次/天
 *
 * 实现方式：
 * - 未登录：localStorage 按「日期」追踪使用次数
 * - 登录：API 层通过 user_id 追踪（当前 MVP 阶段使用 localStorage，
 *   后续可迁移到 Supabase 数据库）
 *
 * 每日重置：按自然日（UTC+8）计算
 */

const STORAGE_KEY = "feedbacklens_quota";

export const QUOTA_LIMITS = {
  guest: 3,
  user: 10,
} as const;

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  isLoggedIn: boolean;
  resetAt: number; // 下次重置时间戳
}

/**
 * 获取当前日期 key（北京时间自然日）
 * 格式：2026-08-14
 */
function getTodayKey(): string {
  const now = new Date();
  // 转为 UTC+8
  const beijingOffset = 8 * 60 * 60 * 1000;
  const beijingTime = new Date(now.getTime() + beijingOffset + now.getTimezoneOffset() * 60 * 1000);
  const year = beijingTime.getFullYear();
  const month = String(beijingTime.getMonth() + 1).padStart(2, "0");
  const day = String(beijingTime.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 计算下次重置时间（次日 00:00 UTC+8）
 */
function getNextResetTime(): number {
  const now = new Date();
  const beijingOffset = 8 * 60 * 60 * 1000;
  const beijingTime = new Date(now.getTime() + beijingOffset + now.getTimezoneOffset() * 60 * 1000);
  const tomorrow = new Date(beijingTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  // 转回本地时间戳
  return tomorrow.getTime() - beijingOffset - now.getTimezoneOffset() * 60 * 1000;
}

/**
 * 读取本地存储的额度数据
 */
function readQuotaData(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

/**
 * 写入额度数据
 */
function writeQuotaData(data: Record<string, number>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * 获取当前用户今天的额度信息
 *
 * @param isLoggedIn 是否已登录
 */
export function getQuota(isLoggedIn: boolean): QuotaInfo {
  const todayKey = getTodayKey();
  const data = readQuotaData();
  // 登录用户和未登录用户使用不同的 key 前缀
  const key = isLoggedIn ? `user_${todayKey}` : `guest_${todayKey}`;
  const used = data[key] || 0;
  const limit = isLoggedIn ? QUOTA_LIMITS.user : QUOTA_LIMITS.guest;

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    isLoggedIn,
    resetAt: getNextResetTime(),
  };
}

/**
 * 检查是否还有剩余额度
 */
export function hasRemainingQuota(isLoggedIn: boolean): boolean {
  const quota = getQuota(isLoggedIn);
  return quota.remaining > 0;
}

/**
 * 消耗一次分析额度
 * 调用时机：API 分析成功返回后
 */
export function consumeQuota(isLoggedIn: boolean): QuotaInfo {
  const todayKey = getTodayKey();
  const data = readQuotaData();
  const key = isLoggedIn ? `user_${todayKey}` : `guest_${todayKey}`;
  const current = data[key] || 0;
  data[key] = current + 1;

  // 清理 7 天前的旧数据，防止 localStorage 膨胀
  const keysToKeep = Object.keys(data).filter((k) => {
    const datePart = k.replace(/^(user_|guest_)/, "");
    const date = new Date(datePart);
    const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo < 7;
  });
  const cleanedData: Record<string, number> = {};
  for (const k of keysToKeep) {
    cleanedData[k] = data[k];
  }

  writeQuotaData(cleanedData);
  return getQuota(isLoggedIn);
}

/**
 * 格式化额度显示文字
 */
export function formatQuotaText(quota: QuotaInfo): string {
  return `已使用 ${quota.used}/${quota.limit} 次免费额度`;
}

/**
 * 格式化重置时间
 */
export function formatResetTime(quota: QuotaInfo): string {
  const now = Date.now();
  const diff = quota.resetAt - now;
  if (diff <= 0) return "即将重置";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分钟后重置`;
  }
  return `${minutes} 分钟后重置`;
}
