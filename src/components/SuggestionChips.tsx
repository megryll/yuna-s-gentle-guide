export const FIRST_TIME_SUGGESTIONS = [
  "I want to talk about something specific.",
  "I want you to guide our first conversation.",
  "Tell me more about how Yuna works.",
] as const;

export const RETURNING_USER_SUGGESTIONS = [
  "Talk about pressure and perfectionism",
  "Learn how to come back to your breath",
] as const;

type Align = "start" | "end" | "center";

export function SuggestionChips({
  suggestions,
  onSelect,
  disabled = false,
  vertical = false,
  align = "start",
  className = "",
}: {
  suggestions: readonly string[];
  onSelect?: (s: string) => void;
  disabled?: boolean;
  vertical?: boolean;
  align?: Align;
  className?: string;
}) {
  const interactive = !!onSelect;

  const alignClass =
    align === "end"
      ? "items-end"
      : align === "center"
        ? "items-center"
        : "items-start";

  const layoutClass = vertical
    ? "flex flex-col gap-2 " + alignClass
    : "flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

  return (
    <div className={layoutClass + " " + className}>
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={interactive ? () => onSelect?.(s) : undefined}
          disabled={!interactive || disabled}
          className={
            (vertical ? "" : "shrink-0 ") +
            "rounded-full hairline px-3.5 py-1.5 text-[12px] leading-snug bg-background transition-colors " +
            (interactive
              ? "active:bg-accent disabled:opacity-50 disabled:pointer-events-none"
              : "text-muted-foreground cursor-default")
          }
        >
          {s}
        </button>
      ))}
    </div>
  );
}
