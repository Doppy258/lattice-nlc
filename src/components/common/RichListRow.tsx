import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  thumbnail?: string;
  initials?: string;
  title: string;
  meta?: string;
  trailing?: ReactNode;
  onClick?: () => void;
};

export function RichListRow({
  thumbnail,
  initials,
  title,
  meta,
  trailing,
  onClick,
}: Props) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl p-2.5 text-left outline-none transition-colors",
        onClick &&
          "cursor-pointer hover:bg-brand-tint/60 focus-visible:ring-2 focus-visible:ring-ring/40",
      )}
    >
      {thumbnail ? (
        <img
          className="size-12 shrink-0 rounded-xl object-cover"
          src={thumbnail}
          alt=""
        />
      ) : (
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-tint text-sm font-bold text-primary">
          {initials ?? "?"}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-foreground">
          {title}
        </span>
        {meta && (
          <span className="block truncate text-[13px] text-muted-foreground">
            {meta}
          </span>
        )}
      </span>
      {trailing && (
        <span className="flex shrink-0 items-center gap-2">{trailing}</span>
      )}
    </Tag>
  );
}
