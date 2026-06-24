import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function ScrollRail({ children, className = "" }: Props) {
  return <div className={`scroll-rail ${className}`.trim()}>{children}</div>;
}
