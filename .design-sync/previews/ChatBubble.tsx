import { darkPanel } from "./_bg";
import { ChatBubble } from "yuna-design-system";
import { ThumbsDown, Copy } from "lucide-react";

// ChatBubble is authored white-on-dark (frosted yuna bubble over a photo), so
// previews sit on a dark photo panel. Alignment + max-width belong to the
// caller, so each bubble is wrapped accordingly.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={darkPanel}
      className="rounded-2xl p-5 flex flex-col gap-3"
    >
      {children}
    </div>
  );
}

export function Conversation() {
  return (
    <Dark>
      <div className="flex">
        <ChatBubble from="yuna" className="max-w-[78%]">
          That sounds like a lot to be holding right now. What part of it feels
          heaviest?
        </ChatBubble>
      </div>
      <div className="flex justify-end">
        <ChatBubble from="user" className="max-w-[78%]">
          Work has been relentless this week. I keep telling myself I'll slow
          down.
        </ChatBubble>
      </div>
    </Dark>
  );
}

export function Typing() {
  return (
    <Dark>
      <div className="flex">
        <ChatBubble from="yuna" typing />
      </div>
    </Dark>
  );
}

export function Large() {
  return (
    <Dark>
      <div className="flex">
        <ChatBubble from="yuna" size="lg" className="max-w-[88%]">
          Take a slow breath with me. There's no rush here.
        </ChatBubble>
      </div>
    </Dark>
  );
}

export function WithMenu() {
  return (
    <Dark>
      <div className="flex">
        <ChatBubble
          from="yuna"
          className="max-w-[78%]"
          menuActions={[
            { label: "Bad response", icon: <ThumbsDown size={18} />, onSelect: () => {} },
            { label: "Copy", icon: <Copy size={18} />, onSelect: () => {} },
          ]}
        >
          Whenever you're ready, we can pick one small thing to focus on
          together.
        </ChatBubble>
      </div>
    </Dark>
  );
}
