import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChatBubble } from "@/components/ChatBubble";
import { DSPage, PropsBlock, Section, SurfaceMatrix, type MatrixRow } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/chat-bubbles")({
  head: () => ({
    meta: [
      { title: "Design System — Chat Bubbles" },
      { name: "description", content: "Yuna design system: chat bubbles." },
    ],
  }),
  component: DSChatBubbles,
});

// Bubbles rely on `.theme-light` for light mode; wrap the light cell so the
// preview inverts the way it does inside PhoneFrame.
function themed(surface: "dark" | "light", node: ReactNode) {
  return surface === "light" ? <div className="theme-light">{node}</div> : node;
}

const box = (node: ReactNode) => <div className="max-w-[260px]">{node}</div>;

function DSChatBubbles() {
  return (
    <DSPage title="Chat Bubbles">
      <Section title="Variants">
        <SurfaceMatrix rows={VARIANT_ROWS} />
      </Section>

      <Section title="Sizes">
        <SurfaceMatrix rows={SIZE_ROWS} />
      </Section>

      <Section title="Props">
        <PropsBlock>{`<ChatBubble
  from?:         "yuna" | "user"   // default: "yuna"
  size?:         "md" | "lg"       // default: "md"
  tail?:         boolean           // default: true
  frostedImage?: string            // Android backdrop-blur fallback photo
  className?:    string
  style?:        CSSProperties     // entrance animation goes here
>
  {children}
</ChatBubble>`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

const VARIANT_ROWS: MatrixRow[] = [
  { label: "Yuna", render: (s) => themed(s, box(<ChatBubble from="yuna">Here to listen, reflect, and grow with you.</ChatBubble>)) },
  { label: "User", render: (s) => themed(s, box(<ChatBubble from="user">That sounds really nice.</ChatBubble>)) },
  {
    label: "No tail",
    render: (s) =>
      themed(
        s,
        box(
          <ChatBubble from="yuna" tail={false}>
            Hi, I'm Yuna.
            <br />
            <br />
            Here to listen, reflect, and grow with you.
          </ChatBubble>,
        ),
      ),
  },
];

const SIZE_ROWS: MatrixRow[] = [
  { label: "Medium", render: (s) => themed(s, box(<ChatBubble from="yuna" size="md">How are you feeling today?</ChatBubble>)) },
  { label: "Large", render: (s) => themed(s, box(<ChatBubble from="yuna" size="lg">Hi, I'm Yuna.</ChatBubble>)) },
];
