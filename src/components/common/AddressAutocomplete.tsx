import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/common/Icon";
import type { GeoPoint } from "@/models";

type Suggestion = {
  displayName: string;
  location: GeoPoint;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: string, location: GeoPoint) => void;
  placeholder?: string;
  id?: string;
  autoFocus?: boolean;
};

async function searchAddress(query: string): Promise<Suggestion[]> {
  if (query.trim().length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: Array<{ lat: string; lon: string; display_name: string }> = await res.json();
    return data.map((d) => ({
      displayName: d.display_name,
      location: { lat: parseFloat(d.lat), lng: parseFloat(d.lon) },
    }));
  } catch {
    return [];
  }
}

export function AddressAutocomplete({ value, onChange, onSelect, placeholder, id, autoFocus }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (q.trim().length < 3) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      const results = await searchAddress(q);
      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIndex(-1);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);
    debouncedSearch(val);
  }

  function handleSelect(s: Suggestion) {
    onSelect(s.displayName, s.location);
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder={placeholder ?? "Search for an address"}
          autoFocus={autoFocus}
          className="pr-10"
        />
        <Icon name="location" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card py-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={s.displayName}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => handleSelect(s)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-3 py-2.5 text-[13px] leading-snug transition-colors ${
                i === activeIndex ? "bg-accent text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.displayName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
