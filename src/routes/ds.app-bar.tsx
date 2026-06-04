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
        subtitle="One frosted, masked bar with a bulge cradle for the lifted Chat circle. Light mode is the same bar under `.theme-light` over the light photo — labels invert to ink, the frosted fill lifts, and the Chat circle becomes an ink pill with a white icon."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Stage mode="dark" />
          <Stage mode="light" />
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
            <code>60px circle, bg-white, lifted translateY(-12px) into the bulge cradle (→ ink pill in light mode)</code>
            <span className="text-muted-foreground">Active</span>
            <code>icon + label full ink/white, label font-semibold</code>
            <span className="text-muted-foreground">Inactive</span>
            <code>text-white/60 → ink in light mode (.theme-light)</code>
            <span className="text-muted-foreground">Notification dot</span>
            <code>bg-yuna-green, returning users on /home only</code>
            <span className="text-muted-foreground">Backdrop</span>
            <code>bg-white/10 backdrop-blur-md, SVG bulge mask; .theme-light lifts the fill</code>
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
// of being crushed by a mini device frame. The bar always renders surface="dark"
// — that's the only way the app uses it; light mode is the same bar under
// `.theme-light` over the light photo, exactly as PhoneFrame produces it.
// Mirrors the live platform toggle so the backdrop blur degrades to its Android
// fill in context.
function Stage({ mode }: { mode: "dark" | "light" }) {
  const platform = usePlatform();
  const light = mode === "light";
  const bg = modeImage(mode);
  return (
    <div
      className={
        "relative h-60 rounded-2xl overflow-hidden border border-border bg-cover bg-center " +
        (light ? "theme-light " : "") +
        (platform === "android" ? "platform-android" : "")
      }
      style={{ backgroundImage: `url(${bg})` }}
    >
      <p
        className={
          "absolute top-4 left-5 z-10 text-[11px] tracking-[0.25em] uppercase " +
          (light ? "text-foreground/65" : "text-white/65")
        }
      >
        {light ? "Light mode" : "Dark mode"}
      </p>
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto w-full max-w-[390px]">
          <AppBar surface="dark" />
        </div>
      </div>
    </div>
  );
}
