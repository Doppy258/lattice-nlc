/**
 * Assistant — the "Ask Lattice" interactive Q&A intelligent feature.
 *
 * A globally-available conversational helper: a floating trigger opens an
 * accessible chat panel where users type questions in natural language and get
 * the best answer from the knowledge base (ranked by assistantService), with
 * one-tap deep links and related follow-up suggestions. Fully offline — no
 * network or external service — so it works during the competition demo.
 *
 * Mounted once in AppLayout. Other surfaces can open it via openAssistant().
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Send, Sparkles } from "lucide-react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/ui/input";
import { answerQuestion, starterQuestions } from "@/services/assistantService";
import type { HelpTopic } from "@/data/helpTopics";

const ASSISTANT_OPEN_EVENT = "lattice:open-assistant";

/** Opens the assistant from anywhere; an optional prefill is asked immediately. */
export function openAssistant(prefill?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ASSISTANT_OPEN_EVENT, { detail: prefill ?? "" }));
}

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Assistant-only: a deep link surfaced as a button. */
  action?: { label: string; path: string };
  /** Assistant-only: related follow-up questions. */
  related?: HelpTopic[];
};

const FALLBACK_TEXT =
  "I couldn't find an exact answer to that. Here are some topics that might help — or try rephrasing with a keyword like “claim”, “pass”, “review”, or “export”.";

/** A pill-styled suggestion button used for starters and related follow-ups. */
function SuggestionChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-full border border-[var(--tint-blue-border)] bg-[var(--tint-blue)] px-3 py-1.5 text-left text-[12.5px] font-medium text-[var(--primary-strong)] transition-colors hover:bg-card"
    >
      {label}
    </button>
  );
}

export function Assistant() {
  const { activeUser } = useApp();
  const role = activeUser.role;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const idRef = useRef(0);
  const threadRef = useRef<HTMLDivElement>(null);

  const starters = useMemo(() => starterQuestions(role), [role]);
  const nextId = () => `m${(idRef.current += 1)}`;

  /** Runs one question through the retrieval engine and appends the exchange. */
  function ask(question: string) {
    const q = question.trim();
    if (!q) return;
    const answer = answerQuestion(q, role);
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", text: q },
      {
        id: nextId(),
        role: "assistant",
        text: answer.best ? answer.best.answer : FALLBACK_TEXT,
        action: answer.best?.action,
        related: answer.related,
      },
    ]);
    setInput("");
  }

  // Allow any surface (e.g. the Help page) to open the assistant, optionally
  // with a question that is asked right away.
  useEffect(() => {
    function onOpen(e: Event) {
      setOpen(true);
      const prefill = (e as CustomEvent<string>).detail;
      if (prefill) ask(prefill);
    }
    window.addEventListener(ASSISTANT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(ASSISTANT_OPEN_EVENT, onOpen);
    // `ask` closes over `role`; rebind when it changes so answers stay correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Keep the newest message in view.
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, open]);

  function goTo(path: string) {
    navigate(path);
    setOpen(false);
  }

  return (
    <>
      {/* Floating trigger — clears the mobile bottom nav (68px) on small screens. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the Lattice assistant"
        className="glass-strong fixed bottom-[84px] right-5 z-30 inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-3 text-[14px] font-semibold text-[var(--primary-strong)] shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5 min-[900px]:bottom-6 min-[900px]:right-6 print:hidden"
      >
        <Sparkles size={18} aria-hidden="true" />
        <span className="hidden sm:inline">Ask Lattice</span>
      </button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        className="sm:max-w-lg"
        title={
          <span className="inline-flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles size={15} aria-hidden="true" />
            </span>
            Lattice Assistant
          </span>
        }
        description="Ask anything about using Lattice — claiming offers, reviews, reports, or running your storefront. Answers are instant and work offline."
      >
        {/* Conversation thread */}
        <div
          ref={threadRef}
          role="log"
          aria-live="polite"
          aria-label="Assistant conversation"
          className="max-h-[46vh] space-y-3 overflow-y-auto pr-1"
        >
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card/70 p-4 text-[13.5px] leading-relaxed text-muted-foreground">
              Hi! I'm your Lattice guide. Type a question below, or pick one to start:
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  {m.role === "user" ? (
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[13.5px] font-medium text-primary-foreground">
                      {m.text}
                    </p>
                  ) : (
                    <div className="max-w-[88%] space-y-2.5">
                      <div className="flex gap-2.5">
                        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                          <Sparkles size={14} aria-hidden="true" />
                        </span>
                        <p className="rounded-2xl rounded-tl-md border border-border bg-card px-3.5 py-2.5 text-[13.5px] leading-relaxed text-foreground">
                          {m.text}
                        </p>
                      </div>
                      {m.action && (
                        <div className="pl-[38px]">
                          <Button
                            variant="brand"
                            size="sm"
                            iconRight={<Icon name="arrow" size={15} />}
                            onClick={() => goTo(m.action!.path)}
                          >
                            {m.action.label}
                          </Button>
                        </div>
                      )}
                      {m.related && m.related.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pl-[38px]">
                          {m.related.map((t) => (
                            <SuggestionChip key={t.id} label={t.question} onClick={() => ask(t.question)} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Starter suggestions (only before the first question) */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {starters.map((t) => (
              <SuggestionChip key={t.id} label={t.question} onClick={() => ask(t.question)} />
            ))}
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            aria-label="Ask the Lattice assistant a question"
            autoComplete="off"
          />
          <Button type="submit" variant="brand" aria-label="Send" disabled={!input.trim()}>
            <Send size={16} aria-hidden="true" />
          </Button>
        </form>
      </Modal>
    </>
  );
}
