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
      style={{ background: "linear-gradient(155deg, #3a4a40 0%, #1d2a22 100%)" }}
      className="rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5"
    >
      <Divider surface="dark" />
      <Divider surface="dark" label="Completed today" />
    </div>
  );
}
