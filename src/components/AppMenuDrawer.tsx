import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Item = { label: string; onClick?: () => void };

const sections: { title: string; items: Item[] }[] = [
  {
    title: "Tools",
    items: [
      { label: "Meditation Generator" },
      { label: "Goals" },
      { label: "Gratitude Journal" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Chat settings" },
      { label: "Account settings" },
      { label: "Notification settings" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Leave feedback" },
      { label: "How Yuna works" },
      { label: "Log out" },
    ],
  },
];

export function AppMenuDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[88%] sm:max-w-[360px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-10 pb-6 text-left">
          <SheetTitle className="font-serif text-xl tracking-tight">Menu</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-2 pb-10">
          {sections.map((s) => (
            <div key={s.title} className="mb-6">
              <p className="font-sans-ui text-[10px] tracking-[0.25em] uppercase text-muted-foreground px-4 mb-2">
                {s.title}
              </p>
              <div className="flex flex-col">
                {s.items.map((it) => (
                  <button
                    key={it.label}
                    onClick={() => { it.onClick?.(); onOpenChange(false); }}
                    className="text-left px-4 py-3 text-sm rounded-xl hover:bg-accent transition-colors"
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}