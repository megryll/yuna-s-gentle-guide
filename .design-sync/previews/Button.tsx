import { Button } from "yuna-design-system";
import { ChevronRight, Bookmark, Share2, Plus } from "lucide-react";

// Dark photo-cluster stand-in: brand greens, no shipped photo asset.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl p-6 flex flex-col items-start gap-3"
    >
      {children}
    </div>
  );
}

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-2">
      <Button variant="primary">Start a session</Button>
      <Button variant="secondary">Maybe later</Button>
      <Button variant="destructive">Delete account</Button>
    </div>
  );
}

export function OnDarkSurface() {
  return (
    <Dark>
      <div className="flex flex-wrap items-center gap-3">
        <Button surface="dark" variant="primary">
          Begin
        </Button>
        <Button surface="dark" variant="secondary">
          Not now
        </Button>
      </div>
    </Dark>
  );
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-2">
      <Button size="md">Continue</Button>
      <Button size="sm">Continue</Button>
      <Button size="xs">Continue</Button>
    </div>
  );
}

export function IconButtons() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Button variant="plain" size="icon-sm" aria-label="Bookmark">
        <Bookmark />
      </Button>
      <Button variant="plain" size="icon" aria-label="Share">
        <Share2 />
      </Button>
      <Button variant="primary" size="icon-lg" aria-label="Add">
        <Plus />
      </Button>
    </div>
  );
}

export function CardRows() {
  return (
    <div className="flex flex-col gap-3 p-2 w-full max-w-sm">
      <Button
        variant="card"
        subtitle="A few quiet minutes to land before the day"
        trailing={<ChevronRight size={20} className="text-foreground/40" />}
      >
        Morning check-in
      </Button>
      <Button
        variant="card"
        selected
        subtitle="You finished this one earlier today"
      >
        Evening wind-down
      </Button>
    </div>
  );
}

export function States() {
  return (
    <div className="flex flex-wrap items-center gap-4 p-2">
      <Button variant="primary" disabled>
        Saving
      </Button>
      <Button variant="primary" pressed>
        Following
      </Button>
      <Button variant="link">Forgot password</Button>
    </div>
  );
}
