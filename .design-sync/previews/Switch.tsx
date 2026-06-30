import { useState } from "react";
import { Switch } from "yuna-design-system";

// Switch defaults to surface="light" — a light control that reads on the
// default white card with no wrapper. The dark-surface off-track gets its
// own panel so the white-alpha rail stays visible.
function Dark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl p-6 flex items-center gap-6"
    >
      {children}
    </div>
  );
}

export function States() {
  const [on, setOn] = useState(true);
  const [off, setOff] = useState(false);
  return (
    <div className="flex items-center gap-6 p-2">
      <Switch checked={on} onChange={setOn} label="Daily reminders" />
      <Switch checked={off} onChange={setOff} label="Sound effects" />
    </div>
  );
}

export function Disabled() {
  return (
    <div className="flex items-center gap-6 p-2">
      <Switch checked onChange={() => {}} disabled label="Locked on" />
      <Switch checked={false} onChange={() => {}} disabled label="Locked off" />
    </div>
  );
}

export function OnDark() {
  const [on, setOn] = useState(true);
  const [off, setOff] = useState(false);
  return (
    <Dark>
      <Switch surface="dark" checked={on} onChange={setOn} label="On" />
      <Switch surface="dark" checked={off} onChange={setOff} label="Off" />
    </Dark>
  );
}
