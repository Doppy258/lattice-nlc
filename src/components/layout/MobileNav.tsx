import { navigate } from "../../app/navigation";
import { Icon } from "../common/Icon";
import { MOBILE_NAV } from "../../app/routes";

export function MobileNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="mobile-nav" aria-label="Primary mobile">
      {MOBILE_NAV.map((item) => (
        <a
          key={item.path}
          className="mobile-nav__item"
          href={`#${item.path}`}
          aria-current={currentPath === item.path ? "page" : undefined}
          onClick={(e) => {
            e.preventDefault();
            navigate(item.path);
          }}
        >
          <Icon name={item.icon} className="mobile-nav__icon" />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
