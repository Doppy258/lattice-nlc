import type { ReactNode } from "react";
import { Icon } from "./Icon";

type Segment = { id: string; label: string };

type Props = {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  segments?: Segment[];
  activeSegment?: string;
  onSegmentChange?: (id: string) => void;
  children?: ReactNode;
};

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  segments,
  activeSegment,
  onSegmentChange,
  children,
}: Props) {
  return (
    <div className="filter-bar rounded-[26px] border border-blue-100 bg-white/80 p-3">
      {onSearchChange !== undefined && (
        <div className="search-field">
          <Icon name="search" className="search-field__icon" size={16} />
          <input
            className="search-field__input"
            type="search"
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      )}
      <div className="filter-bar__row flex flex-wrap items-center gap-2.5">
        {segments && segments.length > 0 && onSegmentChange && (
          <div className="filter-bar__segmented" role="tablist">
            {segments.map((seg) => (
              <button
                key={seg.id}
                type="button"
                role="tab"
                aria-selected={activeSegment === seg.id}
                className={`filter-bar__segment${activeSegment === seg.id ? " filter-bar__segment--on" : ""}`}
                onClick={() => onSegmentChange(seg.id)}
              >
                {seg.label}
              </button>
            ))}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
