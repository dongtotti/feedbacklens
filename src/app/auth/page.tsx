"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowLeft, ScanSearch, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp, isMockMode } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !email.includes("@")) {
      setError("请输入有效的邮箱地址");
      return;
    }
    if (!password || password.length < 6) {
      setError("密码至少 6 位");
      return;
    }

    setLoading(true);

    try {
      const result = mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password);

      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        if (mode === "register" && !isMockMode) {
          // Supabase 注册后可能需要邮箱验证
          setSuccess("注册成功！请检查邮箱完成验证，然后登录。");
          setMode("login");
          setLoading(false);
        } else {
          // 登录成功或 mock 模式直接跳转
          setSuccess("登录成功！正在跳转...");
          setTimeout(() => {
            router.push("/history");
          }, 800);
        }
      }
    } catch {
      setError("操作失败，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回首页
      </Link>

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
          <ScanSearch className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "登录" : "注册"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "登录后可保存分析记录，享受更多额度"
            : "注册即可获得每天 10 次免费分析额度"}
        </p>
      </div>

      {/* 演示模式提示 */}
      {isMockMode && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
          <span>
            当前为演示模式（未配置 Supabase），登录/注册将在本地模拟，数据保存在浏览器中。
            配置 Supabase 环境变量后可使用真实认证。
          </span>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 成功提示 */}
      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-chart-3/20 bg-chart-3/5 px-4 py-3 text-sm text-chart-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">邮箱</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">密码</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "login" ? "登录中..." : "注册中..."}
            </>
          ) : (
            mode === "login" ? "登录" : "注册"
          )}
        </button>
      </form>

      {/* 切换登录/注册 */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? "还没有账号？" : "已有账号？"}
        <button
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setSuccess("");
          }}
          className="ml-1 font-medium text-primary hover:underline"
        >
          {mode === "login" ? "去注册" : "去登录"}
        </button>
      </p>

      {/* 分隔线 */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">或</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* 微信登录占位（后续实现） */}
      <button
        onClick={() => {
          setError("微信扫码登录将在后续版本上线，请先使用邮箱登录");
        }}
        className="h-11 w-full rounded-lg border border-border bg-card text-sm font-medium transition-colors hover:bg-muted"
      >
        微信扫码登录
      </button>
    </div>
  );
}
