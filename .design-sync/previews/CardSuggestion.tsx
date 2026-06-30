import { CardSuggestion } from "yuna-design-system";

// Card Suggestion is authored white-on-dark (a frosted chat bubble or voice
// sheet over a photo), so the previews sit on the dark brand-green cluster. The
// reco tile's photo (a public/ asset) doesn't ship, so it falls back to its
// black wash — still white Fraunces on a dark tile, as intended. We omit
// frostedImage so no broken backdrop asset is referenced.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl p-6"
    >
      {children}
    </div>
  );
}

export function RecoText() {
  return (
    <Dark>
      <div className="flex justify-start">
        <CardSuggestion
          mode="text"
          kind="self-discovery"
          title="How have you been feeling lately?"
          surface="dark"
          startLabel="Start"
        />
      </div>
    </Dark>
  );
}

export function EscalationVoice() {
  return (
    <Dark>
      <CardSuggestion mode="voice" variant="escalation" tier="self-harm" surface="dark" />
    </Dark>
  );
}

export function EscalationSoft() {
  return (
    <Dark>
      <CardSuggestion mode="voice" variant="escalation" tier="non-crisis" surface="dark" />
    </Dark>
  );
}
