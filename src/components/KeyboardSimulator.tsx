import { useEffect, useState } from "react";

export const KEYBOARD_HEIGHT = 260;

const ALPHA_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const NUM_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["-", "/", ":", ";", "(", ")", "$", "&", "@"],
  [".", ",", "?", "!", "'"],
];

/**
 * Visually-simulates an iOS keyboard at the bottom of its parent.
 * Auto-shows when an <input> or <textarea> within `container` is focused.
 * Keys mutate the focused element's value via the React-safe native setter,
 * so controlled inputs update normally.
 */
export function KeyboardSimulator({ container }: { container: HTMLElement | null }) {
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(true);
  const [numMode, setNumMode] = useState(false);
  const [hasText, setHasText] = useState(false);

  useEffect(() => {
    if (!container) return;

    const isField = (el: Element | null): el is HTMLInputElement | HTMLTextAreaElement => {
      if (!el || !container.contains(el)) return false;
      const tag = el.tagName;
      if (tag !== "INPUT" && tag !== "TEXTAREA") return false;
      const t = (el as HTMLInputElement).type;
      return (
        tag === "TEXTAREA" ||
        ["text", "search", "email", "tel", "url", "password", ""].includes(t || "text")
      );
    };

    const updateHasText = () => {
      const el = document.activeElement;
      if (el && isField(el as Element)) {
        setHasText((el as HTMLInputElement).value.trim().length > 0);
      } else {
        setHasText(false);
      }
    };

    const onFocusIn = (e: FocusEvent) => {
      if (isField(e.target as Element | null)) {
        setOpen(true);
        updateHasText();
      }
    };
    const onFocusOut = () => {
      requestAnimationFrame(() => {
        const focused = isField(document.activeElement);
        setOpen(focused);
        if (!focused) setHasText(false);
      });
    };
    const onInput = (e: Event) => {
      if (isField(e.target as Element | null)) updateHasText();
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("input", onInput, true);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("input", onInput, true);
    };
  }, [container]);

  // Reset shift to "lead-cap" each time the keyboard opens
  useEffect(() => {
    if (open) {
      setShift(true);
      setNumMode(false);
    }
  }, [open]);

  const focused = (): HTMLInputElement | HTMLTextAreaElement | null => {
    const el = document.activeElement;
    if (!el) return null;
    if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") return null;
    return el as HTMLInputElement | HTMLTextAreaElement;
  };

  const setValue = (el: HTMLInputElement | HTMLTextAreaElement, value: string, caret: number) => {
    const proto =
      el.tagName === "INPUT" ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    setter?.call(el, value);
    el.setSelectionRange(caret, caret);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const insert = (ch: string) => {
    const el = focused();
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + ch + el.value.slice(end);
    setValue(el, next, start + ch.length);
    if (shift && /^[a-z]$/.test(ch)) setShift(false);
  };

  const backspace = () => {
    const el = focused();
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    if (start === 0 && end === 0) return;
    const cutFrom = start === end ? start - 1 : start;
    const next = el.value.slice(0, cutFrom) + el.value.slice(end);
    setValue(el, next, cutFrom);
  };

  const submit = () => {
    const el = focused();
    if (!el) return;
    if (!el.value.trim()) {
      el.blur();
      return;
    }
    const form = (el as HTMLInputElement).form;
    if (form) {
      if (typeof form.requestSubmit === "function") form.requestSubmit();
      else form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
    el.blur();
  };

  const transform = (ch: string) => (shift && !numMode ? ch.toUpperCase() : ch);

  const r1 = numMode ? NUM_ROWS[0] : ALPHA_ROWS[0];
  const r2 = numMode ? NUM_ROWS[1] : ALPHA_ROWS[1];
  const r3 = numMode ? NUM_ROWS[2] : ALPHA_ROWS[2];

  return (
    <div
      aria-hidden={!open}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: KEYBOARD_HEIGHT,
        background: "#CDD0D6",
        transform: open ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        gap: 11,
        padding: "10px 0 18px",
        boxSizing: "border-box",
        pointerEvents: open ? "auto" : "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Row 1 */}
      <Row>
        {r1.map((k) => (
          <Key key={k} label={transform(k)} onPress={() => insert(transform(k))} />
        ))}
      </Row>

      {/* Row 2 (indented in alpha mode) */}
      <Row paddingX={numMode ? 3 : "6%"}>
        {r2.map((k) => (
          <Key key={k} label={transform(k)} onPress={() => insert(transform(k))} />
        ))}
      </Row>

      {/* Row 3 */}
      <Row>
        <Key
          special
          flex={1.6}
          label={numMode ? "#+=" : shift ? "⬆︎" : "⇧"}
          onPress={() => (numMode ? null : setShift((s) => !s))}
        />
        <Spacer flex={0.4} />
        {r3.map((k) => (
          <Key
            key={k}
            label={numMode ? k : transform(k)}
            onPress={() => insert(numMode ? k : transform(k))}
          />
        ))}
        <Spacer flex={0.4} />
        <Key special flex={1.6} label="⌫" onPress={backspace} />
      </Row>

      {/* Row 4 */}
      <Row>
        <Key
          special
          flex={1.8}
          label={numMode ? "ABC" : "123"}
          onPress={() => setNumMode((m) => !m)}
        />
        <Key flex={5} label="space" onPress={() => insert(" ")} />
        <Key flex={2} label="return" onPress={submit} returnPrimary={hasText} />
      </Row>
    </div>
  );
}

function Row({
  children,
  paddingX = 3,
}: {
  children: React.ReactNode;
  paddingX?: number | string;
}) {
  const padX = typeof paddingX === "number" ? `${paddingX}px` : paddingX;
  return (
    <div
      style={{
        display: "flex",
        gap: 5,
        paddingLeft: padX,
        paddingRight: padX,
      }}
    >
      {children}
    </div>
  );
}

function Spacer({ flex }: { flex: number }) {
  return <div style={{ flex }} aria-hidden="true" />;
}

function Key({
  label,
  onPress,
  flex = 1,
  special = false,
  returnPrimary = false,
}: {
  label: string;
  onPress: () => void;
  flex?: number;
  special?: boolean;
  returnPrimary?: boolean;
}) {
  const isSingleChar = label.length === 1;
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPress}
      style={{
        flex,
        height: 44,
        background: returnPrimary ? "var(--color-foreground)" : special ? "#ADB5BD" : "#FFFFFF",
        color: returnPrimary ? "var(--color-background)" : "#000",
        borderRadius: 5,
        border: "none",
        boxShadow: "0 1px 0 rgba(0,0,0,0.35)",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: isSingleChar ? 20 : 14,
        fontWeight: isSingleChar ? 300 : 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        WebkitUserSelect: "none",
        padding: 0,
        minWidth: 0,
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );
}
