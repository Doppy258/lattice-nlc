import { navigate } from "../../app/navigation";
import { Icon } from "../common/Icon";
import { MOBILE_NAV } from "../../app/routes";

export function MobileNav({ currentPath }: { currentPath: string }) {
  const pingPath = "/create-ping";
  const items = MOBILE_NAV.filter((item) => item.path !== pingPath);
  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const right = items.slice(mid);

  return (
    <nav className="mobile-nav" aria-label="Primary mobile">
      {left.map((item) => (
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
      <div className="mobile-nav__item mobile-nav__item--fab">
        <button
          type="button"
          className="mobile-nav__fab"
          aria-label="Create a Ping"
          aria-current={currentPath === pingPath ? "page" : undefined}
          onClick={() => navigate(pingPath)}
        >
          <Icon name="ping" className="mobile-nav__icon" />
        </button>
      </div>
      {right.map((item) => (
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
