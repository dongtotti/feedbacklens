import { ScanSearch } from "lucide-react";

/**
 * 底部页脚
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <ScanSearch className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>反馈洞察 FeedbackLens</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span>AI 驱动的用户反馈分析工具</span>
          <span>v0.1.0</span>
        </div>
      </div>
    </footer>
  );
}
