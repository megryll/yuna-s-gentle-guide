import { darkPanel } from "./_bg";
import { Toast } from "yuna-design-system";

// Toast carries its own solid fill, but the neutral variant inverts by surface,
// so the dark-surface examples sit on a dark photo panel.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={darkPanel}
      className="rounded-2xl p-6 flex flex-col gap-3"
    >
      {children}
    </div>
  );
}

export function Variants() {
  return (
    <Dark>
      <Toast variant="success" message="You're in. Your pass is ready to claim." />
      <Toast variant="error" message="Your password needs at least 8 characters." />
      <Toast surface="dark" variant="neutral" message="Your request has been sent." />
    </Dark>
  );
}

export function WithTitle() {
  return (
    <Dark>
      <Toast
        variant="success"
        title="Saved"
        message="Your reflection was added to this week."
      />
    </Dark>
  );
}

export function Dismissible() {
  return (
    <Dark>
      <Toast
        surface="dark"
        variant="neutral"
        message="We saved your spot. Come back whenever you're ready."
        onDismiss={() => {}}
      />
    </Dark>
  );
}
