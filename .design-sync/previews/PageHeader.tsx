import { PageHeader, Button } from "yuna-design-system";
import { Bookmark, MoreHorizontal } from "lucide-react";

const noop = () => undefined;

// On the light cluster PageHeader needs no wrapper. On the dark photo cluster
// the back button + title switch to white, so that cell sits on a brand-green
// stand-in.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl overflow-hidden"
    >
      {children}
    </div>
  );
}

export function Title() {
  return (
    <div className="p-2">
      <PageHeader surface="light" onBack={noop} title="Meditation" className="pt-4 pb-2" />
    </div>
  );
}

export function TitleWithTrailing() {
  return (
    <div className="p-2">
      <PageHeader
        surface="light"
        onBack={noop}
        title="Gratitude Journal"
        className="pt-4 pb-2"
        trailing={
          <Button surface="light" variant="secondary" size="icon" aria-label="Save" onClick={noop}>
            <Bookmark strokeWidth={1.75} />
          </Button>
        }
      />
    </div>
  );
}

export function InlineTitle() {
  return (
    <div className="p-2">
      <PageHeader
        surface="light"
        onBack={noop}
        title="Subscription"
        layout="inline"
        className="pt-4 pb-2"
        trailing={
          <Button surface="light" variant="secondary" size="icon" aria-label="Options" onClick={noop}>
            <MoreHorizontal strokeWidth={1.8} />
          </Button>
        }
      />
    </div>
  );
}

export function OnDark() {
  return (
    <Dark>
      <PageHeader surface="dark" onBack={noop} title="Finding Calm" className="pt-4 pb-3" />
    </Dark>
  );
}
