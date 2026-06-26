import { MessageSquare } from "lucide-react";

import { setCommentsEnabled, useCommentsEnabled } from "@/lib/comments";

// Admin-chrome toggle (top toolbar) that shows/hides the teammate comment
// layer. Per-browser, off by default — reviewers flip it on to read or leave
// feedback on the shared prototype link.
export function CommentsToggle() {
  const on = useCommentsEnabled();

  return (
    <button
      type="button"
      onClick={() => setCommentsEnabled(!on)}
      aria-pressed={on}
      aria-label="Toggle comments"
      className={
        "hidden md:inline-flex items-center gap-1.5 rounded-full border border-border p-1 pr-3 backdrop-blur-md shadow-sm transition-colors " +
        (on
          ? "bg-amber-500 text-white"
          : "bg-background/80 text-muted-foreground hover:text-foreground/90 active:text-foreground")
      }
    >
      <span
        className={
          "inline-flex h-6 w-6 items-center justify-center rounded-full " +
          (on ? "bg-white/20" : "")
        }
      >
        <MessageSquare size={14} />
      </span>
      <span className="text-uppercase tracking-wide">Comments</span>
    </button>
  );
}
