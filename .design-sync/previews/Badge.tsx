import { Badge } from "yuna-design-system";

export function Label() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3">
      <Badge>New</Badge>
      <Badge>Completed</Badge>
      <Badge>Day 3</Badge>
    </div>
  );
}

export function Icon() {
  return (
    <div className="flex items-center gap-4 p-3">
      <Badge icon size="sm" label="Verified" />
      <Badge icon size="md" label="Complete" />
    </div>
  );
}

export function CornerFlag() {
  return (
    <div className="p-5">
      <div className="relative h-28 w-44 rounded-2xl bg-foreground/5 border border-border">
        <Badge className="absolute -top-3 left-4">New</Badge>
      </div>
    </div>
  );
}
