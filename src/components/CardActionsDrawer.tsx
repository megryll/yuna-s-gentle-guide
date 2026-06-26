import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  EyeOff,
  HelpCircle,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  KIND_MENU,
  KIND_META,
  KIND_PLURAL,
  type HomeCard,
} from "@/lib/home-cards";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

/**
 * The 3-dot card menu — opened from a Home feed card (tile or list row). Mirrors
 * the Facebook post menu: a sheet of grouped action rows, with "Why am I seeing
 * this?" swapping the sheet to an in-drawer explainer panel.
 *
 * Actions are derived per card kind from KIND_MENU; "Stop seeing …" sets the
 * kind off in the shared content-prefs store (owned by the caller), and the
 * complete/dismiss actions mutate the caller's Home feed state.
 *
 * Open state is driven by `card`: pass the card to open, null to close.
 */
export function CardActionsDrawer({
  card,
  completed,
  onOpenChange,
  onToggleComplete,
  onDismiss,
  onStopSeeing,
  onManagePreferences,
}: {
  card: HomeCard | null;
  completed: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleComplete: () => void;
  onDismiss: () => void;
  onStopSeeing: () => void;
  onManagePreferences: () => void;
}) {
  const [screen, setScreen] = useState<"menu" | "why">("menu");

  // Always reopen on the menu screen for a fresh card.
  useEffect(() => {
    if (card) setScreen("menu");
  }, [card?.id]);

  const kind = card?.type;
  const menu = kind ? KIND_MENU[kind] : null;
  const label = kind ? KIND_META[kind].label : "";

  return (
    <Drawer open={!!card} onOpenChange={onOpenChange}>
      <DrawerContent>
        {screen === "menu" ? (
          <div className="px-4 pb-8 pt-3 flex flex-col gap-4">
            <DrawerTitle className="sr-only">Card options</DrawerTitle>

            {menu && (menu.complete || menu.dismiss) && (
              <MenuGroup>
                {menu.complete && (
                  <MenuRow
                    icon={completed ? <RotateCcw size={20} strokeWidth={1.75} /> : <Check size={20} strokeWidth={1.75} />}
                    label={completed ? "Mark as Incomplete" : "Mark as Completed"}
                    onClick={onToggleComplete}
                  />
                )}
                {menu.dismiss && (
                  <MenuRow
                    icon={<X size={20} strokeWidth={1.75} />}
                    label="Dismiss this card"
                    onClick={onDismiss}
                    last
                  />
                )}
              </MenuGroup>
            )}

            <MenuGroup>
              {menu?.stopSeeing && kind && (
                <MenuRow
                  icon={<EyeOff size={20} strokeWidth={1.75} />}
                  label={`Stop seeing ${KIND_PLURAL[kind]}`}
                  onClick={onStopSeeing}
                />
              )}
              <MenuRow
                icon={<HelpCircle size={20} strokeWidth={1.75} />}
                label="Why Am I Seeing This?"
                onClick={() => setScreen("why")}
                last
              />
            </MenuGroup>
          </div>
        ) : (
          <div className="px-6 pb-10 pt-3">
            <button
              type="button"
              onClick={() => setScreen("menu")}
              aria-label="Back to options"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/75 hover:text-foreground/90 active:text-foreground -ml-1 mb-5 transition-colors"
            >
              <ChevronLeft size={18} strokeWidth={2} aria-hidden />
              Back
            </button>

            <DrawerTitle>Why am I seeing this?</DrawerTitle>

            <p className="mt-5 text-base leading-relaxed text-foreground/85">
              This is a {label}. Yuna suggests content like this based on what
              you've shared in recent sessions and the goals you're working
              toward.
            </p>
            <p className="mt-3 text-base leading-relaxed text-foreground/85">
              Nothing here is fixed. You can choose what shows up in your feed
              anytime from Content Preferences.
            </p>

            <Button
              surface="light"
              variant="secondary"
              fullWidth
              className="mt-8"
              onClick={onManagePreferences}
            >
              <SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden />
              Manage Content Preferences
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function MenuGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden hairline bg-background/40 backdrop-blur-md flex flex-col">
      {children}
    </div>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 text-left hover:bg-foreground/[0.03] active:bg-foreground/[0.06] transition-colors",
        !last && "border-b border-border",
      )}
    >
      <span aria-hidden className="text-foreground shrink-0">
        {icon}
      </span>
      <span className="text-base leading-6 font-medium text-foreground">{label}</span>
    </button>
  );
}
