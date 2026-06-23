import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  pad?: boolean;
  interactive?: boolean;
  children: ReactNode;
};

export function Card({ pad = true, interactive = false, className = "", children, ...rest }: Props) {
  const classes = [
    "card",
    pad ? "card--pad" : "",
    interactive ? "card--interactive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
