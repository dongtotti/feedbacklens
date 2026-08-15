import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/lib/auth";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://feedbacklens.app"
  ),
  title: {
    default: "反馈洞察 FeedbackLens — AI 用户反馈分析工具",
    template: "%s | 反馈洞察",
  },
  description:
    "上传用户反馈，10 秒出分析报告——AI 自动聚类、情感分析、优先级排序、改进建议，一键生成可视化报告。把产品团队半天的工作压缩到 10 秒。",
  keywords: [
    "用户反馈分析",
    "AI 反馈分析",
    "反馈聚类",
    "情感分析",
    "产品经理工具",
    "用户研究",
    "FeedbackLens",
    "反馈洞察",
    "AI 数据分析",
  ],
  authors: [{ name: "FeedbackLens" }],
  creator: "FeedbackLens",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://feedbacklens.app",
    title: "反馈洞察 FeedbackLens — AI 用户反馈分析工具",
    description:
      "上传用户反馈，10 秒出分析报告——AI 自动聚类、情感分析、优先级排序、改进建议，一键生成。",
    siteName: "反馈洞察 FeedbackLens",
  },
  twitter: {
    card: "summary_large_image",
    title: "反馈洞察 FeedbackLens — AI 用户反馈分析工具",
    description:
      "上传用户反馈，10 秒出分析报告——AI 自动聚类、情感分析、优先级排序、改进建议。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
