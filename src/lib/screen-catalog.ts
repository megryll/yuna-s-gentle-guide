// Single source of truth for the prototype's navigable screens. Consumed by
// AdminSidebar (the page index) and the /gallery board, so the two never drift.
//
// Shape mirrors the sidebar: top-level entries, some of which carry `children`
// enumerating a flow's step/variant states. A leaf resolves to a real URL via
// `resolveScreenUrl` (pathname with `$param` segments filled + search serialized).

export type ScreenLeaf = {
  label: string;
  to: string;
  search?: Record<string, unknown>;
  params?: Record<string, string>;
};

export type ScreenEntry = ScreenLeaf & {
  // When present, this entry is a collapsible parent in the sidebar; in the
  // gallery its children render as a titled group of variant thumbnails.
  children?: ScreenLeaf[];
};

export const PAGES: ScreenEntry[] = [
  { label: "Splash", to: "/splash" },
  { label: "Welcome", to: "/" },
  { label: "Log in", to: "/login" },
  { label: "Employer access", to: "/employer-access" },
  { label: "Create account", to: "/auth" },
  { label: "Accept terms", to: "/accept-terms" },
  {
    label: "Intro",
    to: "/intro",
    children: [
      { label: "Name", to: "/intro", search: { step: 0 } },
      { label: "Credentials + Ratings", to: "/intro", search: { step: 1 } },
      {
        label: "Tell me more about Yuna",
        to: "/intro",
        search: { step: 2, branch: "tellMeMore" },
      },
      { label: "Notifications", to: "/intro", search: { step: 2 } },
      { label: "Mood data", to: "/intro", search: { step: 3 } },
      { label: "Voice", to: "/intro", search: { step: 4 } },
      { label: "Privacy", to: "/intro", search: { step: 5 } },
      { label: "Creating Your Space", to: "/creating-your-space" },
    ],
  },
  { label: "Home", to: "/home" },
  { label: "Design Your Trial", to: "/design-your-trial" },
  { label: "Session", to: "/chat" },
  { label: "Wrap-up", to: "/wrap-up" },
  {
    label: "Profile",
    to: "/you",
    children: [
      { label: "Focus area 1", to: "/focus-area/1" },
      { label: "Focus area 2", to: "/focus-area/2" },
    ],
  },
  { label: "Tools", to: "/tools" },
  {
    label: "Therapist Recommendations",
    to: "/therapist-recommendations",
    children: [
      { label: "Preferences Survey", to: "/therapist-preferences" },
      { label: "Therapist Profile", to: "/therapist-profile/$id", params: { id: "kerstin" } },
      { label: "Schedule Call", to: "/therapist-schedule/$id", params: { id: "kerstin" } },
    ],
  },
  {
    label: "Goal Setting",
    to: "/goals",
    children: [
      { label: "Empty / list", to: "/goals" },
      { label: "Name goal", to: "/goals", search: { step: "name" } },
      { label: "Timeframe", to: "/goals", search: { step: "timeframe" } },
      { label: "Goal created", to: "/goals", search: { step: "success" } },
    ],
  },
  {
    label: "Meditations",
    to: "/meditation",
    children: [
      { label: "Create", to: "/meditation", search: { step: "create" } },
      { label: "Crafting", to: "/meditation", search: { step: "crafting" } },
      { label: "Player", to: "/meditation", search: { step: "player" } },
      { label: "Complete", to: "/meditation", search: { step: "complete" } },
    ],
  },
  {
    label: "Sessions",
    to: "/sessions",
    children: [{ label: "Session detail", to: "/sessions/$id", params: { id: "s-04" } }],
  },
  { label: "Gratitude List", to: "/gratitude" },
  { label: "Book Reco", to: "/book/$id", params: { id: "self-compassion-neff" } },
  { label: "Skill Article", to: "/skill/$id", params: { id: "please-technique" } },
  {
    label: "Settings",
    to: "/settings",
    children: [
      { label: "Account Settings", to: "/settings/account" },
      { label: "Subscription", to: "/settings/subscription" },
      { label: "Customize Voice", to: "/settings/voice" },
      { label: "Session Language", to: "/settings/language" },
      { label: "Content Preferences", to: "/settings/content-preferences" },
    ],
  },
];

// Resolve `$param` segments in a leaf's `to` against its params, so a pattern
// like `/sessions/$id` with `{ id: "s-04" }` becomes `/sessions/s-04`.
export function resolveEntryPath(entry: ScreenLeaf): string {
  if (!entry.params) return entry.to;
  return entry.to.replace(/\$(\w+)/g, (_, key: string) => entry.params?.[key] ?? `$${key}`);
}

function serializeSearch(search?: Record<string, unknown>): string {
  if (!search) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) params.set(k, String(v));
  const s = params.toString();
  return s ? `?${s}` : "";
}

// Full URL string (path + query) suitable for an <iframe src> or new-tab open.
export function resolveScreenUrl(leaf: ScreenLeaf): string {
  return resolveEntryPath(leaf) + serializeSearch(leaf.search);
}

// `url` (path + query) is for the iframe src; `to`/`search`/`params` are the
// structured form for SPA navigation on click (TanStack's `to` won't parse a
// query string baked into the path).
export type ResolvedScreen = {
  label: string;
  url: string;
  to: string;
  search?: Record<string, unknown>;
  params?: Record<string, string>;
};
export type ScreenSection = { title: string; screens: ResolvedScreen[] };

function toResolved(label: string, leaf: ScreenLeaf): ResolvedScreen {
  return {
    label,
    url: resolveScreenUrl(leaf),
    to: leaf.to,
    search: leaf.search,
    params: leaf.params,
  };
}

// Flatten the catalog into board sections: every childless top-level page sits
// under "Screens"; each flow (entry with children) becomes its own titled
// section listing the parent plus its variants, deduped by resolved URL so a
// child that lands on the same screen as its parent doesn't double up.
export function getScreenSections(): ScreenSection[] {
  const standalone: ResolvedScreen[] = [];
  const flows: ScreenSection[] = [];

  for (const entry of PAGES) {
    if (!entry.children) {
      standalone.push(toResolved(entry.label, entry));
      continue;
    }
    const screens: ResolvedScreen[] = [];
    const seen = new Set<string>();
    const push = (label: string, leaf: ScreenLeaf) => {
      const resolved = toResolved(label, leaf);
      if (seen.has(resolved.url)) return;
      seen.add(resolved.url);
      screens.push(resolved);
    };
    push(entry.label, entry);
    for (const child of entry.children) push(child.label, child);
    flows.push({ title: entry.label, screens });
  }

  return [{ title: "Screens", screens: standalone }, ...flows];
}
