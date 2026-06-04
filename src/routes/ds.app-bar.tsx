import { createFileRoute } from "@tanstack/react-router";
import { AppBar } from "@/components/AppBar";
import { DSPage, Section, PropsBlock } from "@/ds-docs/surface";
import { usePlatform } from "@/lib/platform";
import { modeImage } from "@/lib/theme-prefs";

export const Route = createFileRoute("/ds/app-bar")({
  head: () => ({
    meta: [
      { title: "Design System — App Bar" },
      { name: "description", content: "Bottom tab navigation, pinned to the screen edge." },
    ],
  }),
  component: DSAppBar,
});

function DSAppBar() {
  return (
    <DSPage title="App bar">
      {/* Real AppBar pinned to the bottom edge of a full-width photo stage on
          each surface — at a realistic phone width so the five tabs + lifted
          Chat circle breathe (a mini device frame squeezed them). The edge
          anchoring + the dark surface's frosted bulge (the lifted Chat circle
          sits in its cradle) still read in context. */}
      <Section
        title="Variants"
        subtitle="surface=&quot;dark&quot; floats a frosted, masked bar with a bulge cradle for the lifted Chat circle; surface=&quot;light&quot; is a flat bordered bar on bg-background."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Stage surface="dark" />
          <Stage surface="light" />
        </div>
      </Section>

      <Section title="Anatomy">
        <div className="rounded-2xl border border-border p-6 bg-muted/30">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[12px]">
            <span className="text-muted-foreground">Tabs</span>
            <code>Home · You · Chat (emphasized) · Tools · Sessions — grid-cols-5</code>
            <span className="text-muted-foreground">Tab icon</span>
            <code>h-6 w-6 (24px) · label text-[12px]</code>
            <span className="text-muted-foreground">Emphasized Chat</span>
            <code>60px circle, bg-white; dark surface lifts it translateY(-12px)</code>
            <span className="text-muted-foreground">Active</span>
            <code>icon + label full ink/white, label font-semibold</code>
            <span className="text-muted-foreground">Inactive</span>
            <code>text-white/60 (dark) · text-muted-foreground (light)</code>
            <span className="text-muted-foreground">Notification dot</span>
            <code>bg-yuna-green, returning users on /home only</code>
            <span className="text-muted-foreground">Dark backdrop</span>
            <code>bg-white/10 backdrop-blur-md, SVG bulge mask</code>
          </div>
        </div>
      </Section>

      <Section title="Props">
        <PropsBlock>{`<AppBar
  surface?: "dark" | "light"   // default "light"
/>

// Tabs are fixed (Home · You · Chat · Tools · Sessions). Active state is
// derived from the live route; the Chat tab is emphasized and routes through
// startChat so the first-session disclaimers gate before /chat. Notification
// dots surface only for returning users while on /home.`}</PropsBlock>
      </Section>
    </DSPage>
  );
}

// A full-width photo background with the real AppBar pinned to its bottom edge,
// centered at a realistic phone width so the tabs sit at true spacing instead
// of being crushed by a mini device frame. Mirrors the live platform toggle so
// the dark surface's backdrop blur degrades to its Android fill in context.
function Stage({ surface }: { surface: "dark" | "light" }) {
  const platform = usePlatform();
  const dark = surface === "dark";
  const bg = modeImage(surface);
  return (
    <div
      className={
        "relative h-60 rounded-2xl overflow-hidden border border-border bg-cover bg-center " +
        (platform === "android" ? "platform-android" : "")
      }
      style={{ backgroundImage: `url(${bg})` }}
    >
      <p
        className={
          "absolute top-4 left-5 z-10 text-[11px] tracking-[0.25em] uppercase " +
          (dark ? "text-white/65" : "text-foreground/65")
        }
      >
        {dark ? "Dark surface" : "Light surface"}
      </p>
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto w-full max-w-[390px]">
          <AppBar surface={surface} />
        </div>
      </div>
    </div>
  );
}
