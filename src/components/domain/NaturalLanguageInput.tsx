import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, X, RotateCcw, Check, AlertCircle, Loader2, Type, Hash, MapPin, Clock, DollarSign, Tag } from "lucide-react";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";
import { parseNaturalLanguage, type NLParseState, type NLParseResult } from "@/services/nlpParser";
import { CATEGORY_META, NEED_TYPE_LABELS, TIME_WINDOW_PRESETS } from "@/data/catalog";
import { presetForTimeWindow } from "@/utils/timeWindows";
import type { BusinessCategory, NeedType } from "@/models";

const EXAMPLE_QUERIES = [
  "find me cheap tacos near the Pearl around 2pm",
  "looking for a haircut under $30 within 3km",
  "need a phone repair near downtown this weekend",
  "best coffee shop near campus open now",
  "where can I get a group meal for under $50",
];

const CONFIDENCE_COLORS = {
  high: "bg-[var(--success)]",
  mid: "bg-[var(--warning)]",
  low: "bg-[var(--danger)]",
};

function confidenceColor(v: number): string {
  if (v >= 0.7) return CONFIDENCE_COLORS.high;
  if (v >= 0.4) return CONFIDENCE_COLORS.mid;
  return CONFIDENCE_COLORS.low;
}

function confidenceBg(v: number): string {
  if (v >= 0.7) return "bg-[var(--success-tint)]";
  if (v >= 0.4) return "bg-[var(--warning-tint)]";
  return "bg-[var(--danger-tint)]";
}

function FieldConfidenceBar({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl bg-card px-3.5 py-2.5 ring-1 ring-inset ring-border/70"
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[13px] font-medium text-foreground truncate">{label}</span>
          <span className="mono text-[11px] font-semibold tabular-nums text-muted-foreground">
            {Math.round(value * 100)}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value * 100}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={cn("h-full rounded-full", confidenceColor(value))}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ResultCard({
  result,
  onApply,
  onRetry,
}: {
  result: NLParseResult;
  onApply: () => void;
  onRetry: () => void;
}) {
  const isHigh = result.confidence.overall >= 0.7;

  const fields: { label: string; value: string; icon: React.ReactNode; conf: number }[] = [];

  if (result.category) {
    const meta = CATEGORY_META[result.category];
    fields.push({
      label: "Category",
      value: meta?.label ?? result.category,
      icon: <Type size={14} />,
      conf: result.confidence.category,
    });
  }

  if (result.needType) {
    fields.push({
      label: "Need",
      value: NEED_TYPE_LABELS[result.needType] ?? result.needType,
      icon: <Tag size={14} />,
      conf: result.confidence.needType,
    });
  }

  if (result.budgetMax != null || result.budgetMin != null) {
    const parts: string[] = [];
    if (result.budgetMin != null) parts.push(`$${result.budgetMin}`);
    if (result.budgetMax != null) parts.push(`$${result.budgetMax}`);
    fields.push({
      label: "Budget",
      value: result.budgetMin != null && result.budgetMax != null && result.budgetMin !== result.budgetMax
        ? `${parts.join(" – ")}`
        : parts[0] ?? "Any",
      icon: <DollarSign size={14} />,
      conf: result.confidence.budget,
    });
  } else {
    // No budget parsed — still surface the factor (defaults to "No budget" /
    // any price) so it isn't silently dropped from the summary.
    fields.push({
      label: "Budget",
      value: "No budget",
      icon: <DollarSign size={14} />,
      conf: result.confidence.budget,
    });
  }

  if (result.distanceKm != null) {
    fields.push({
      label: "Distance",
      value: result.distanceKm >= 999 ? "No limit" : `Within ${result.distanceKm} km`,
      icon: <MapPin size={14} />,
      conf: result.confidence.distance,
    });
  }

  if (result.timeStart && result.timeEnd) {
    // Show the friendly preset label ("Now", "Tonight", …) when the parsed
    // window matches one — matching what gets applied to the form — and only
    // fall back to a literal time range for genuinely specific times.
    const preset = presetForTimeWindow(result.timeStart, result.timeEnd);
    const presetLabel =
      preset !== "custom" ? TIME_WINDOW_PRESETS.find((p) => p.id === preset)?.label : undefined;
    const fmt = (iso: string) => {
      const d = new Date(iso);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    };
    fields.push({
      label: "Time",
      value: presetLabel ?? `${fmt(result.timeStart)} – ${fmt(result.timeEnd)}`,
      icon: <Clock size={14} />,
      conf: result.confidence.time,
    });
  } else {
    // No time mentioned → most permissive default (anytime), surfaced so the
    // factor isn't silently dropped from the summary.
    fields.push({
      label: "Time",
      value: "Anytime",
      icon: <Clock size={14} />,
      conf: result.confidence.time,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      {/* Overall confidence + explanation */}
      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className={cn(
          "flex flex-col gap-3 rounded-2xl p-4 ring-1 ring-inset",
          isHigh
            ? "bg-[var(--success-tint)] ring-[var(--success)]/20"
            : "bg-[var(--warning-tint)] ring-[var(--warning)]/20",
        )}
      >
        <div className="flex items-center gap-2">
          {isHigh ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-[var(--success)] text-white">
                <Check size={15} />
              </div>
            </motion.div>
          ) : (
            <AlertCircle size={18} className="shrink-0 text-[var(--warning)]" />
          )}
          <span className={cn(
            "text-sm font-semibold",
            isHigh ? "text-[var(--success)]" : "text-[var(--warning)]",
          )}>
            {isHigh ? "Got it!" : "I think I understand, but let's double-check:"}
          </span>
        </div>
        {result.explanation && (
          <p className="text-[13px] leading-relaxed text-muted-foreground">{result.explanation}</p>
        )}
        {result.locationHint && (
          <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <MapPin size={13} className="shrink-0 text-primary" />
            Location hint: {result.locationHint}
            <span className="text-[11px] text-muted-foreground/60">(browser location will be used for matching)</span>
          </p>
        )}
        {/* Overall confidence */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="mono text-[11px] font-semibold tracking-wide text-muted-foreground">Confidence</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.confidence.overall * 100}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className={cn("h-full rounded-full", confidenceColor(result.confidence.overall))}
            />
          </div>
          <span className="mono text-[11px] font-semibold tabular-nums text-muted-foreground">
            {Math.round(result.confidence.overall * 100)}%
          </span>
        </div>
      </motion.div>

      {/* Per-field confidence bars */}
      <div className="grid gap-2">
        {fields.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.08 }}
          >
            <FieldConfidenceBar label={f.value} value={f.conf} icon={f.icon} />
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 + fields.length * 0.08 + 0.1 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <Button
          variant="brand"
          size="lg"
          onClick={onApply}
          iconRight={<ArrowRight size={18} />}
          className={cn(
            "flex-1",
            !isHigh && "animate-pulse",
          )}
        >
          Apply to form
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={onRetry}
          iconLeft={<RotateCcw size={16} />}
        >
          Try again
        </Button>
      </motion.div>
    </motion.div>
  );
}

function FailedState({
  error,
  onRetry,
  onSwitchToForm,
}: {
  error: string;
  onRetry: () => void;
  onSwitchToForm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--danger-tint)] p-5 text-center ring-1 ring-inset ring-[var(--danger)]/20"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-[var(--danger)] text-white">
          <X size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--danger)]">Couldn't parse your request</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{error}</p>
        </div>
      </motion.div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" size="lg" onClick={onRetry} iconLeft={<RotateCcw size={16} />} className="flex-1">
          Try again
        </Button>
        <Button variant="primary" size="lg" onClick={onSwitchToForm} iconRight={<ArrowRight size={16} />} className="flex-1">
          Use the form instead
        </Button>
      </div>
    </motion.div>
  );
}

function ScanningAnimation() {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="size-2.5 rounded-full bg-primary"
            animate={{
              y: [0, -8, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="text-[13px] font-medium text-muted-foreground"
      >
        Scanning your request…
      </motion.p>
    </div>
  );
}

export function NaturalLanguageInput({
  onApply,
  onSwitchToForm,
}: {
  onApply: (result: NLParseResult) => void;
  onSwitchToForm: () => void;
}) {
  const [query, setQuery] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [state, setState] = useState<NLParseState>({ status: "idle" });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cycle placeholder examples
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setExampleIndex((i) => (i + 1) % EXAMPLE_QUERIES.length);
        setShowPlaceholder(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setState({ status: "parsing" });
    const result = await parseNaturalLanguage(trimmed);
    setState(result);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleApply = useCallback(() => {
    if (state.status === "success" || state.status === "partial") {
      onApply(state.result);
    }
  }, [state, onApply]);

  const handleRetry = useCallback(() => {
    setState({ status: "idle" });
    setQuery("");
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="space-y-5">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-2"
      >
        <Sparkles size={20} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Describe what you're looking for</span>
      </motion.div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="relative"
      >
        <div className="relative rounded-2xl bg-card ring-1 ring-inset ring-border/70 shadow-[var(--shadow-card)] transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/30 focus-within:shadow-[var(--shadow-lift)]">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            disabled={state.status === "parsing"}
            placeholder=""
            rows={1}
            className="w-full resize-none bg-transparent px-4 pt-4 pb-14 text-[16px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
          />
          {/* Placeholder (cycling examples) when empty */}
          {!query && (
            <AnimatePresence mode="wait">
              {showPlaceholder && (
                <motion.div
                  key={exampleIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-none absolute left-4 top-[17px] text-[16px] leading-relaxed text-muted-foreground/60"
                >
                  {EXAMPLE_QUERIES[exampleIndex]}
                </motion.div>
              )}
            </AnimatePresence>
          )}
          {/* Bottom bar: hint + submit */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3">
            <span className="mono text-[11px] text-muted-foreground/50">
              {state.status === "parsing" ? "Parsing…" : "Press Enter to parse"}
            </span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleSubmit}
              disabled={!query.trim() || state.status === "parsing"}
              className={cn(
                "flex size-9 items-center justify-center rounded-xl bg-primary text-white shadow-[var(--shadow-cta)] transition-all duration-200",
                "hover:bg-primary-strong disabled:opacity-40 disabled:cursor-not-allowed",
              )}
            >
              {state.status === "parsing" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Status area */}
      <AnimatePresence mode="wait">
        {state.status === "parsing" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ScanningAnimation />
          </motion.div>
        )}

        {state.status === "success" && (
          <ResultCard
            key="result"
            result={state.result}
            onApply={handleApply}
            onRetry={handleRetry}
          />
        )}

        {state.status === "partial" && (
          <motion.div key="partial">
            {state.warnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--warning-tint)] px-3.5 py-2.5 ring-1 ring-inset ring-[var(--warning)]/20"
              >
                <AlertCircle size={14} className="shrink-0 text-[var(--warning)]" />
                <span className="text-[13px] text-muted-foreground">
                  {state.warnings.map((w, i) => (
                    <span key={i}>{i > 0 && "; "}{w}</span>
                  ))}
                </span>
              </motion.div>
            )}
            <ResultCard
              result={state.result}
              onApply={handleApply}
              onRetry={handleRetry}
            />
          </motion.div>
        )}

        {state.status === "failed" && (
          <FailedState
            key="failed"
            error={state.error}
            onRetry={handleRetry}
            onSwitchToForm={onSwitchToForm}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
