"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ScanSearch, Moon, Sun, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

/**
 * 顶部导航栏
 */
export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, isMockMode } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const navLinkClass = (href: string) =>
    `text-sm font-medium transition-colors hover:text-foreground ${
      pathname === href ? "text-foreground" : "text-muted-foreground"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <ScanSearch className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            反馈洞察
          </span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            FeedbackLens
          </span>
        </Link>

        {/* 导航链接 */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/upload" className={navLinkClass("/upload")}>
            <span className="hidden sm:inline">开始分析</span>
            <span className="sm:hidden">分析</span>
          </Link>
          <Link
            href="/history"
            className={`hidden sm:inline-block ${navLinkClass("/history")}`}
          >
            历史记录
          </Link>

          {/* 暗色模式切换 */}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="切换主题"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* 登录 / 用户信息 */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:inline-flex">
                <User className="h-3.5 w-3.5" />
                {user.email}
                {isMockMode && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    演示
                  </span>
                )}
              </span>
              <button
                onClick={handleSignOut}
                className="flex h-8 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="退出登录"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">退出</span>
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
