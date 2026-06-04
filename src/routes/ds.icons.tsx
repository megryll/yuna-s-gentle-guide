import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUp,
  Bookmark,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  History,
  House,
  Info,
  LayoutGrid,
  List,
  Lock,
  Menu,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Pencil,
  Phone,
  PhoneCall,
  Play,
  Settings,
  Share2,
  Star,
  User,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { IconMedallion } from "@/components/IconMedallion";
import { DSPage, Section, SurfaceMatrix, PropsBlock } from "@/ds-docs/surface";

export const Route = createFileRoute("/ds/icons")({
  head: () => ({
    meta: [
      { title: "Design System — Icons" },
      {
        name: "description",
        content: "The lucide-react glyph set, sizes, and the frosted medallion.",
      },
    ],
  }),
  component: DSIcons,
});

// The app's icon sizes — pick the one that fits the context, don't scale the
// whole set. (px)
const SIZES = [14, 16, 18, 20, 22, 26, 28];

// Every lucide glyph currently imported across the app, alphabetical.
const LIBRARY: [string, LucideIcon][] = [
  ["ArrowRight", ArrowRight],
  ["ArrowUp", ArrowUp],
  ["Bookmark", Bookmark],
  ["CalendarClock", CalendarClock],
  ["CalendarDays", CalendarDays],
  ["Check", Check],
  ["ChevronDown", ChevronDown],
  ["ChevronLeft", ChevronLeft],
  ["ChevronRight", ChevronRight],
  ["CircleAlert", CircleAlert],
  ["Clock", Clock],
  ["History", History],
  ["House", House],
  ["Info", Info],
  ["LayoutGrid", LayoutGrid],
  ["List", List],
  ["Lock", Lock],
  ["Menu", Menu],
  ["MessageCircle", MessageCircle],
  ["Mic", Mic],
  ["MoreHorizontal", MoreHorizontal],
  ["Pencil", Pencil],
  ["Phone", Phone],
  ["PhoneCall", PhoneCall],
  ["Play", Play],
  ["Settings", Settings],
  ["Share2", Share2],
  ["Star", Star],
  ["User", User],
  ["Volume2", Volume2],
  ["VolumeX", VolumeX],
  ["X", X],
];

// The medallion is authored in white-on-dark vocabulary and inverts via
// `.theme-light` in the app's light mode. The matrix panels don't add that
// class, so the light column wraps its render to mirror what the app shows.
const onLight = (surface: "dark" | "light", node: ReactNode) =>
  surface === "light" ? <div className="theme-light">{node}</div> : node;

function GridCell({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-border bg-muted/30 py-5 text-foreground">
      {children}
      <span className="px-1 text-center text-[10.5px] leading-tight text-muted-foreground">
        {name}
      </span>
    </div>
  );
}

function DSIcons() {
  return (
    <DSPage title="Icons">
      <p className="mb-12 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        UI glyphs come from{" "}
        <a
          className="underline underline-offset-2"
          href="https://lucide.dev/icons"
          target="_blank"
          rel="noreferrer"
        >
          lucide-react
        </a>
        . They draw in <code>currentColor</code>, so they inherit the surrounding
        text token (white on the dark photo, ink on light) — never hardcode an
        icon color. Keep the stroke light (<code>strokeWidth</code> 1.6–1.8) so
        they sit calmly next to Stara, and size to the context rather than scaling
        the whole set.
      </p>

      <Section title="Sizes">
        <div className="flex flex-wrap items-end gap-8 text-foreground">
          {SIZES.map((px) => (
            <div key={px} className="flex flex-col items-center gap-2.5">
              <House size={px} strokeWidth={1.7} aria-hidden />
              <span className="text-[11px] text-muted-foreground">{px}px</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Library"
        subtitle="Every glyph currently used across the app."
      >
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
          {LIBRARY.map(([name, Icon]) => (
            <GridCell key={name} name={name}>
              <Icon size={22} strokeWidth={1.7} aria-hidden />
            </GridCell>
          ))}
        </div>
      </Section>

      <Section
        title="Medallion"
        subtitle="Frosted plate that frames a single glyph on a photo surface."
      >
        <SurfaceMatrix
          rows={[
            {
              label: "md",
              render: (s) =>
                onLight(
                  s,
                  <IconMedallion size="md">
                    <CalendarClock
                      size={24}
                      strokeWidth={1.6}
                      className="text-white"
                      aria-hidden
                    />
                  </IconMedallion>,
                ),
            },
            {
              label: "lg",
              render: (s) =>
                onLight(
                  s,
                  <IconMedallion size="lg">
                    <CalendarClock
                      size={26}
                      strokeWidth={1.6}
                      className="text-white"
                      aria-hidden
                    />
                  </IconMedallion>,
                ),
            },
          ]}
        />
        <div className="mt-6">
          <PropsBlock>{`<IconMedallion
  size?:      "md" | "lg"     // 56px | 64px, default "lg"
  label?:     string          // accessible name; omit to keep it decorative (aria-hidden)
  className?: string
  children:   ReactNode       // a lucide icon (~26) or <YunaAvatar size={…} />
/>`}</PropsBlock>
        </div>
      </Section>
    </DSPage>
  );
}
