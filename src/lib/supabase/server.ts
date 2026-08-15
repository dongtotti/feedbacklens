import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 服务端 Supabase 客户端
 * 在 Server Components 和 API Routes 中使用
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 在 Server Component 中调用 setAll 会被忽略
            // 如果有中间件刷新 session，这里可以安全跳过
          }
        },
      },
    }
  );
}
