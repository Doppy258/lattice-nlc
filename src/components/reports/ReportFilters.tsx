import type { BusinessCategory, ClaimStatus, ReportFilters as Filters } from "../../models";
import { ALL_CATEGORIES, CATEGORY_META } from "../../data/catalog";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

const CLAIM_STATUSES: ClaimStatus[] = ["active", "redeemed", "expired", "cancelled"];

/** Date/category/claim-status controls that customize the user report (PRD 10.12). */
export function ReportFilters({ filters, onChange }: Props) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    const next = { ...filters };
    if (value === undefined || value === "") delete next[key];
    else next[key] = value;
    onChange(next);
  };

  const active = Object.keys(filters).length > 0;

  return (
    <div className="report-filters">
      <div className="field report-filters__field">
        <label className="field__label" htmlFor="rf-from">
          From
        </label>
        <input
          id="rf-from"
          type="date"
          className="text-input"
          value={filters.fromDate?.slice(0, 10) ?? ""}
          max={filters.toDate?.slice(0, 10)}
          onChange={(e) => set("fromDate", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
        />
      </div>

      <div className="field report-filters__field">
        <label className="field__label" htmlFor="rf-to">
          To
        </label>
        <input
          id="rf-to"
          type="date"
          className="text-input"
          value={filters.toDate?.slice(0, 10) ?? ""}
          min={filters.fromDate?.slice(0, 10)}
          onChange={(e) => set("toDate", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
        />
      </div>

      <div className="field report-filters__field">
        <label className="field__label" htmlFor="rf-category">
          Category
        </label>
        <select
          id="rf-category"
          className="select-input"
          value={filters.category ?? ""}
          onChange={(e) => set("category", (e.target.value || undefined) as BusinessCategory | undefined)}
        >
          <option value="">All categories</option>
          {ALL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_META[c].label}
            </option>
          ))}
        </select>
      </div>

      <div className="field report-filters__field">
        <label className="field__label" htmlFor="rf-status">
          Claim status
        </label>
        <select
          id="rf-status"
          className="select-input"
          value={filters.claimStatus ?? ""}
          onChange={(e) => set("claimStatus", (e.target.value || undefined) as ClaimStatus | undefined)}
        >
          <option value="">Any status</option>
          {CLAIM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {active && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({})}
          iconLeft={<Icon name="close" size={14} />}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
