import type { ReactNode } from "react";

type Props = {
  thumbnail?: string;
  initials?: string;
  title: string;
  meta?: string;
  trailing?: ReactNode;
  onClick?: () => void;
};

export function RichListRow({ thumbnail, initials, title, meta, trailing, onClick }: Props) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      className="rich-row"
      type={onClick ? "button" : undefined}
      onClick={onClick}
      style={onClick ? { width: "100%", border: 0, background: "transparent", textAlign: "left" } : undefined}
    >
      {thumbnail ? (
        <img className="rich-row__thumb" src={thumbnail} alt="" />
      ) : initials ? (
        <span className="rich-row__thumb rich-row__thumb--initials">{initials}</span>
      ) : (
        <span className="rich-row__thumb rich-row__thumb--initials">?</span>
      )}
      <span>
        <span className="rich-row__title">{title}</span>
        {meta && <span className="rich-row__meta">{meta}</span>}
      </span>
      {trailing && <span className="rich-row__trailing">{trailing}</span>}
    </Tag>
  );
}
