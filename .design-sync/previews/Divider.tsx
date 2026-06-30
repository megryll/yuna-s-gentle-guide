import { darkPanel } from "./_bg";
import { Divider } from "yuna-design-system";

export function Plain() {
  return (
    <div className="p-5 w-full max-w-sm">
      <Divider />
    </div>
  );
}

export function Labeled() {
  return (
    <div className="p-5 w-full max-w-sm">
      <Divider label="or" />
    </div>
  );
}

export function OnDark() {
  return (
    <div
      style={darkPanel}
      className="rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5"
    >
      <Divider surface="dark" />
      <Divider surface="dark" label="Completed today" />
    </div>
  );
}
