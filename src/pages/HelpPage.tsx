/**
 * HelpPage — route: /help
 *
 * Searchable FAQ organised by category. Topics are role-filtered
 * (customer vs businessOwner) and can link directly to app routes
 * via action buttons. Uses an accordion pattern with AnimatePresence.
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { openAssistant } from "@/components/domain/Assistant";
import { topicVisibleTo } from "@/services/assistantService";
import { HELP_CATEGORIES, HELP_TOPICS, type HelpTopic } from "@/data/helpTopics";

function matchesQuery(topic: HelpTopic, q: string): boolean {
  if (!q) return true;
  const haystack = `${topic.question} ${topic.answer} ${topic.category}`.toLowerCase();
  return haystack.includes(q.toLowerCase());
}

function HelpRow({
  topic,
  open,
  onToggle,
}: {
  topic: HelpTopic;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex-1 font-display text-[15px] font-semibold tracking-[-0.02em]">
          {topic.question}
        </span>
        <Icon
          name="chevron"
          size={18}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-4 pb-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{topic.answer}</p>
              {topic.action && (
                <Button
                  variant="secondary"
                  size="sm"
                  iconRight={<Icon name="arrow" size={15} />}
                  onClick={() => navigate(topic.action!.path)}
                >
                  {topic.action.label}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HelpPage() {
  const { activeUser } = useApp();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const role = activeUser.role;

  // Topics for this role, narrowed by the search query, grouped by category.
  const grouped = useMemo(() => {
    const visible = HELP_TOPICS.filter((t) => topicVisibleTo(t, role) && matchesQuery(t, query));
    return HELP_CATEGORIES.map((cat) => ({
      ...cat,
      topics: visible.filter((t) => t.category === cat.id),
    })).filter((g) => g.topics.length > 0);
  }, [role, query]);

  const totalResults = grouped.reduce((n, g) => n + g.topics.length, 0);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Help"
        accent="center"
        subtitle="Search how-tos and answers, or browse by topic. Every answer can take you straight to the right place in the app."
      />

      {/* Interactive Q&A — the assistant answers free-text questions instantly. */}
      <Card variant="glassBlue" className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
            <Sparkles size={19} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em]">Ask the Lattice Assistant</h2>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
              Type a question in plain English and get an instant answer — works offline.
            </p>
          </div>
        </div>
        <Button
          variant="brand"
          iconLeft={<Sparkles size={16} />}
          onClick={() => openAssistant()}
          className="shrink-0"
        >
          Ask a question
        </Button>
      </Card>

      <Card variant="solid" className="p-4 sm:p-5">
        <div className="relative">
          <Icon
            name="search"
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help — e.g. claim, pass, export, reviews…"
            aria-label="Search help topics"
            className="pl-11"
          />
        </div>
      </Card>

      {totalResults === 0 ? (
        <EmptyState
          icon="help"
          title="No matching help topics"
          body="Try a different search term, ask the assistant in your own words, or clear the search to browse everything."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="brand" iconLeft={<Sparkles size={16} />} onClick={() => openAssistant(query)}>
                Ask the assistant
              </Button>
              <Button variant="secondary" onClick={() => setQuery("")}>
                Clear search
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.id} className="space-y-3">
              <h2 className="flex items-center gap-2.5 font-display text-[20px] font-semibold tracking-[-0.03em]">
                <span className="grid size-8 place-items-center rounded-xl bg-accent text-primary">
                  <Icon name={group.icon} size={17} />
                </span>
                {group.id}
              </h2>
              <div className="space-y-2.5">
                {group.topics.map((topic) => (
                  <HelpRow
                    key={topic.id}
                    topic={topic}
                    open={openId === topic.id}
                    onToggle={() => setOpenId((id) => (id === topic.id ? null : topic.id))}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
