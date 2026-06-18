import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { MessageSquarePlus, X } from "lucide-react";

import {
  getCommenterName,
  setCommenterName,
  useComments,
  type Comment,
} from "@/lib/comments";

type Rect = { left: number; top: number; width: number; height: number };

// Measures the simulated phone frame ([data-phone-frame], rendered by every
// PhoneFrame/ScreenChrome screen) and keeps the reading current across scroll,
// resize, and navigation so pinned comments track the frame box.
function useFrameRect(dep: string): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const el = document.querySelector("[data-phone-frame]");
      if (!el) {
        setRect((prev) => (prev === null ? prev : null));
        return;
      }
      const r = el.getBoundingClientRect();
      setRect((prev) =>
        prev &&
        prev.left === r.left &&
        prev.top === r.top &&
        prev.width === r.width &&
        prev.height === r.height
          ? prev
          : { left: r.left, top: r.top, width: r.width, height: r.height },
      );
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);

    const el = document.querySelector("[data-phone-frame]");
    let ro: ResizeObserver | undefined;
    if (el && "ResizeObserver" in window) {
      ro = new ResizeObserver(schedule);
      ro.observe(el);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      ro?.disconnect();
    };
  }, [dep]);

  return rect;
}

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d}d ago` : new Date(ts).toLocaleDateString();
}

// Places a card near a pin without spilling outside the frame box.
function cardPosition(px: number, py: number, frame: Rect, w: number, h: number) {
  const left = Math.min(Math.max(px - w / 2, 8), Math.max(8, frame.width - w - 8));
  const below = py + 18;
  const top =
    below + h <= frame.height - 8 ? below : Math.max(8, py - h - 18);
  return { left, top };
}

export function CommentLayer() {
  const pathname = useLocation({ select: (l) => l.pathname });
  const { items, add, remove } = useComments(pathname);
  const frame = useFrameRect(pathname);

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const closeAll = () => {
    setDraft(null);
    setActiveId(null);
    setAdding(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset transient UI when navigating to another screen.
  useEffect(() => {
    closeAll();
  }, [pathname]);

  if (!frame) return null;

  const placePin = (e: React.MouseEvent) => {
    const x = (e.clientX - frame.left) / frame.width;
    const y = (e.clientY - frame.top) / frame.height;
    setDraft({ x: Math.min(Math.max(x, 0), 1), y: Math.min(Math.max(y, 0), 1) });
    setAdding(false);
    setActiveId(null);
  };

  const active = activeId ? items.find((c) => c.id === activeId) ?? null : null;

  // Park the add-comment button in the gutter just below the phone, clamped to
  // stay on-screen on short viewports.
  const fabTop = Math.min(frame.top + frame.height + 12, window.innerHeight - 52);

  return (
    <>
      <div
      className="fixed z-40"
      style={{
        left: frame.left,
        top: frame.top,
        width: frame.width,
        height: frame.height,
        pointerEvents: "none",
      }}
    >
      {/* Placement capture: only while adding. */}
      {adding && (
        <div
          className="absolute inset-0 cursor-crosshair"
          style={{ pointerEvents: "auto" }}
          onClick={placePin}
        />
      )}

      {/* Dismiss backdrop while a popover or composer is open. */}
      {(active || draft) && (
        <div
          className="absolute inset-0"
          style={{ pointerEvents: "auto" }}
          onClick={closeAll}
        />
      )}

      {/* Existing pins */}
      {items.map((c) => (
        <PinDot
          key={c.id}
          comment={c}
          frame={frame}
          selected={c.id === activeId}
          onClick={() => {
            setActiveId((prev) => (prev === c.id ? null : c.id));
            setDraft(null);
            setAdding(false);
          }}
        />
      ))}

      {/* Draft pin */}
      {draft && (
        <span
          className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 ring-2 ring-white shadow-lg shadow-black/40"
          style={{ left: draft.x * frame.width, top: draft.y * frame.height }}
        />
      )}

      {/* Pin popover */}
      {active && (
        <PinPopover
          comment={active}
          frame={frame}
          onDelete={() => {
            remove(active.id);
            setActiveId(null);
          }}
        />
      )}

      {/* Composer */}
      {draft && (
        <Composer
          frame={frame}
          x={draft.x}
          y={draft.y}
          onCancel={() => setDraft(null)}
          onPost={(text, name) => {
            add({ x: draft.x, y: draft.y, text, name });
            setDraft(null);
          }}
        />
      )}

      </div>

      {/* Add-comment affordance — parked in the gutter below the phone, out of
          the device frame so it never covers screen content. */}
      <button
        type="button"
        onClick={() => {
          setDraft(null);
          setActiveId(null);
          setAdding((v) => !v);
        }}
        aria-pressed={adding}
        className={
          "fixed z-50 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm shadow-lg shadow-black/25 backdrop-blur-md transition-colors " +
          (adding
            ? "bg-amber-500 text-white"
            : "bg-background/85 text-foreground active:bg-background")
        }
        style={{ left: frame.left + frame.width / 2, top: fabTop }}
      >
        {adding ? <X size={15} /> : <MessageSquarePlus size={15} />}
        {adding ? "Cancel" : "Comment"}
      </button>
    </>
  );
}

function PinDot({
  comment,
  frame,
  selected,
  onClick,
}: {
  comment: Comment;
  frame: Rect;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Comment by ${comment.name || "Anonymous"}`}
      className={
        "absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 ring-2 shadow-lg shadow-black/40 transition-transform active:scale-95 " +
        (selected ? "ring-amber-300 scale-110" : "ring-white")
      }
      style={{
        left: comment.x * frame.width,
        top: comment.y * frame.height,
        pointerEvents: "auto",
      }}
    />
  );
}

function PinPopover({
  comment,
  frame,
  onDelete,
}: {
  comment: Comment;
  frame: Rect;
  onDelete: () => void;
}) {
  const W = 240;
  const H = 120;
  const pos = cardPosition(comment.x * frame.width, comment.y * frame.height, frame, W, H);
  return (
    <div
      className="absolute rounded-2xl border border-border bg-background p-3 shadow-xl"
      style={{ left: pos.left, top: pos.top, width: W, pointerEvents: "auto" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {comment.name || "Anonymous"}
          </p>
          <p className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete comment"
          className="shrink-0 rounded-full p-1 text-muted-foreground active:text-foreground"
        >
          <X size={15} />
        </button>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">
        {comment.text}
      </p>
    </div>
  );
}

function Composer({
  frame,
  x,
  y,
  onCancel,
  onPost,
}: {
  frame: Rect;
  x: number;
  y: number;
  onCancel: () => void;
  onPost: (text: string, name: string) => void;
}) {
  const [text, setText] = useState("");
  const [name, setName] = useState(() => getCommenterName());
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  const W = 260;
  const H = 188;
  const pos = cardPosition(x * frame.width, y * frame.height, frame, W, H);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const cleanName = name.trim();
    setCommenterName(cleanName);
    onPost(trimmed, cleanName);
  };

  return (
    <div
      className="absolute rounded-2xl border border-border bg-background p-3 shadow-xl"
      style={{ left: pos.left, top: pos.top, width: W, pointerEvents: "auto" }}
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
        }}
        rows={3}
        placeholder="Leave a comment…"
        className="w-full resize-none rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-foreground/40"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        className="mt-2 w-full rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-foreground/40"
      />
      <div className="mt-2.5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-3 py-1.5 text-sm text-muted-foreground active:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim()}
          className="rounded-full bg-foreground px-3.5 py-1.5 text-sm text-background shadow-sm transition-opacity disabled:opacity-40"
        >
          Post
        </button>
      </div>
    </div>
  );
}
