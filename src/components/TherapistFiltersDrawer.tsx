import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { TextField } from "@/components/TextField";
import { useAppMode } from "@/lib/theme-prefs";
import {
  LOCATIONS,
  SPECIALTY_OPTIONS,
  APPROACH_OPTIONS,
  INSURANCE_OPTIONS,
} from "@/lib/therapist-data";

export type TherapistFilters = {
  location: string | null;
  format: string | null;
  specialties: string[];
  approaches: string[];
  insurance: string[];
};

export const EMPTY_FILTERS: TherapistFilters = {
  location: null,
  format: null,
  specialties: [],
  approaches: [],
  insurance: [],
};

export function countFilters(f: TherapistFilters): number {
  return (
    f.specialties.length +
    f.approaches.length +
    f.insurance.length +
    (f.format ? 1 : 0) +
    (f.location ? 1 : 0)
  );
}

/**
 * TherapistFiltersDrawer — the "Preferences" refinement sheet for the
 * recommendation deck. Bottom-sheet Drawer composed from DS primitives
 * (TextField typeahead, Tag chips, Button). Holds a draft of the filters and
 * commits on Apply.
 */
export function TherapistFiltersDrawer({
  open,
  onOpenChange,
  filters,
  onChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filters: TherapistFilters;
  onChange: (next: TherapistFilters) => void;
  onApply: () => void;
}) {
  const surface = useAppMode();

  const patch = (p: Partial<TherapistFilters>) => onChange({ ...filters, ...p });
  const toggle = (key: "specialties" | "approaches" | "insurance", value: string) => {
    const list = filters[key];
    patch({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88%]">
        <DrawerHeader className="flex flex-row items-center justify-between px-6 pt-3 pb-2">
          <DrawerTitle>Preferences</DrawerTitle>
          <Button surface={surface} variant="link" onClick={() => onChange(EMPTY_FILTERS)}>
            Reset
          </Button>
        </DrawerHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <LocationFilter
            surface={surface}
            value={filters.location}
            onChange={(v) => patch({ location: v })}
          />

          <FilterSection title="Availability">
            <div className="flex flex-wrap gap-2">
              {["Online", "In person"].map((opt) => (
                <Tag
                  key={opt}
                  surface={surface}
                  selected={filters.format === opt}
                  onClick={() => patch({ format: filters.format === opt ? null : opt })}
                >
                  {opt}
                </Tag>
              ))}
            </div>
          </FilterSection>

          <ChipSection
            title="Specialty"
            surface={surface}
            placeholder="Search specialities"
            options={SPECIALTY_OPTIONS}
            selected={filters.specialties}
            onToggle={(v) => toggle("specialties", v)}
          />
          <ChipSection
            title="Approaches"
            surface={surface}
            placeholder="Search approaches"
            options={APPROACH_OPTIONS}
            selected={filters.approaches}
            onToggle={(v) => toggle("approaches", v)}
          />
          <ChipSection
            title="Insurance"
            surface={surface}
            placeholder="Search providers"
            options={INSURANCE_OPTIONS}
            selected={filters.insurance}
            onToggle={(v) => toggle("insurance", v)}
          />
        </div>

        <DrawerFooter className="px-6 pb-8">
          <Button surface={surface} variant="primary" fullWidth onClick={onApply}>
            Apply
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function FilterSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border py-4 first:border-t-0">
      <h3 className="font-display text-lg tracking-tight mb-3">
        {title}
        {count ? <span className="text-secondary-green"> · {count}</span> : null}
      </h3>
      {children}
    </section>
  );
}

const SHOW_LIMIT = 8;

function ChipSection({
  title,
  surface,
  placeholder,
  options,
  selected,
  onToggle,
}: {
  title: string;
  surface: "dark" | "light";
  placeholder: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const q = query.trim().toLowerCase();

  const matches = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  const ordered = [...selected.filter((s) => !matches.includes(s)), ...matches];
  const visible = q || showAll ? ordered : ordered.slice(0, SHOW_LIMIT);

  return (
    <FilterSection title={title} count={selected.length}>
      <div className="flex flex-col gap-3">
        <TextField
          surface={surface}
          placeholder={placeholder}
          leading={<Search size={16} className={surface === "dark" ? "text-white/60" : "text-foreground/50"} aria-hidden />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {visible.map((o) => (
            <Tag key={o} surface={surface} selected={selected.includes(o)} onClick={() => onToggle(o)}>
              {o}
            </Tag>
          ))}
        </div>
        {!q && ordered.length > SHOW_LIMIT && (
          <Button surface={surface} variant="link" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show fewer" : `Show all (${ordered.length})`}
          </Button>
        )}
      </div>
    </FilterSection>
  );
}

function LocationFilter({
  surface,
  value,
  onChange,
}: {
  surface: "dark" | "light";
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const dark = surface === "dark";
  const q = query.trim().toLowerCase();
  const matches = q
    ? LOCATIONS.filter(
        (l) => l.city.toLowerCase().includes(q) || l.state.toLowerCase().includes(q) || l.zip.includes(q),
      )
    : [];

  return (
    <FilterSection title="Location">
      {value ? (
        <Tag surface={surface} selected icon={<MapPin />} onClick={() => onChange(null)}>
          {value}
        </Tag>
      ) : (
        <div className="relative">
          <TextField
            surface={surface}
            placeholder="Search city, state, or ZIP"
            leading={<Search size={16} className={dark ? "text-white/60" : "text-foreground/50"} aria-hidden />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {q.length > 0 && matches.length > 0 && (
            <ul
              className={
                "mt-2 overflow-hidden rounded-2xl border " +
                (dark ? "border-white/20 bg-white/10 backdrop-blur-md" : "border-foreground/15 bg-white/70 backdrop-blur-md")
              }
            >
              {matches.slice(0, 5).map((l) => (
                <li key={l.zip}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(`${l.city}, ${l.state}`);
                      setQuery("");
                    }}
                    className={
                      "w-full flex items-center gap-2 px-4 py-3 text-left text-sm transition-colors " +
                      (dark ? "text-white active:bg-white/10" : "text-foreground active:bg-foreground/5")
                    }
                  >
                    <MapPin size={15} className={dark ? "text-white/60" : "text-foreground/50"} aria-hidden />
                    <span className="font-semibold">{l.city}</span>
                    <span className={dark ? "text-white/70" : "text-foreground/70"}>{l.state}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </FilterSection>
  );
}
