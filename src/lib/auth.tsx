"use client";

/**
 * 认证上下文
 *
 * 优先使用 Supabase Auth（当环境变量配置时），
 * 未配置时降级为本地 mock 认证（localStorage 模拟）。
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// ============ 类型 ============

interface AuthUser {
  id: string;
  email: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isMockMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============ Supabase 检测 ============

function isSupabaseConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url"
  );
}

// ============ Provider ============

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseReady = isSupabaseConfigured();

  // 初始化：检查已有 session
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (supabaseReady) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (mounted) {
            setUser(
              session?.user
                ? {
                    id: session.user.id,
                    email: session.user.email || null,
                  }
                : null
            );
            setLoading(false);
          }

          // 监听 auth 状态变化
          const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
              if (mounted) {
                setUser(
                  session?.user
                    ? {
                        id: session.user.id,
                        email: session.user.email || null,
                      }
                    : null
                );
              }
            }
          );

          return () => {
            listener.subscription.unsubscribe();
          };
        } catch {
          // Supabase 初始化失败，降级到 mock
          initMock();
        }
      } else {
        initMock();
      }
    }

    function initMock() {
      try {
        const raw = localStorage.getItem("feedbacklens_user");
        if (raw && mounted) {
          setUser(JSON.parse(raw));
        }
      } catch {
        // ignore
      }
      if (mounted) setLoading(false);
    }

    init();
    return () => {
      mounted = false;
    };
  }, [supabaseReady]);

  // 登录
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      if (supabaseReady) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          return { error: error?.message || null };
        } catch {
          return { error: "登录失败，请稍后重试" };
        }
      }

      // Mock 模式
      return mockAuth(email, password);
    },
    [supabaseReady]
  );

  // 注册
  const signUp = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      if (supabaseReady) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { error } = await supabase.auth.signUp({
            email,
            password,
          });
          return { error: error?.message || null };
        } catch {
          return { error: "注册失败，请稍后重试" };
        }
      }

      // Mock 模式
      return mockAuth(email, password);
    },
    [supabaseReady]
  );

  // 登出
  const signOut = useCallback(async () => {
    if (supabaseReady) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }

    // Mock 模式
    localStorage.removeItem("feedbacklens_user");
    setUser(null);
  }, [supabaseReady]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isMockMode: !supabaseReady,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============ Mock 认证 ============

function mockAuth(
  email: string,
  password: string
): { error: string | null } {
  // 简单校验
  if (!email || !email.includes("@")) {
    return { error: "请输入有效的邮箱地址" };
  }
  if (!password || password.length < 6) {
    return { error: "密码至少 6 位" };
  }

  // Mock 模式下直接创建用户
  const mockUser: AuthUser = {
    id: `mock-${Date.now()}`,
    email,
  };

  localStorage.setItem("feedbacklens_user", JSON.stringify(mockUser));

  // 触发一个自定义事件，让 Provider 能感知
  window.dispatchEvent(new Event("feedbacklens_mock_auth"));

  return { error: null };
}

// ============ Hook ============

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth 必须在 AuthProvider 内使用");
  }
  return ctx;
}
