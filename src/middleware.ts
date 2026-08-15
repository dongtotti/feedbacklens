import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase Auth Session 刷新中间件
 *
 * 在每次请求时刷新用户的 Supabase session cookie。
 * 仅在 Supabase 环境变量配置时生效。
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(request: NextRequest) {
  // 如果 Supabase 未配置，直接放行
  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_URL === "your_supabase_project_url"
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // 刷新 session（不等待结果，避免阻塞）
    await supabase.auth.getSession();
  } catch {
    // Supabase 调用失败时不阻塞请求
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，排除：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico
     * - public 文件
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)",
  ],
};
