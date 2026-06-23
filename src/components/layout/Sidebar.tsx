import { useApp } from "../../app/providers";
import { navigate } from "../../app/navigation";
import { BrandMark, Icon } from "../common/Icon";
import { BUSINESS_NAV, DEMO_NAV, USER_NAV, type NavItem } from "../../app/routes";

type Group = { label: string; items: NavItem[] };

function groupsForRole(role: string): Group[] {
  const user: Group = { label: "Discover", items: USER_NAV };
  const business: Group = { label: "Business", items: BUSINESS_NAV };
  const demo: Group = { label: "Admin", items: DEMO_NAV };
  if (role === "businessOwner") return [business, demo];
  if (role === "admin") return [user, business, demo];
  return [user, demo];
}

type Props = {
  currentPath: string;
  onNavigate?: () => void;
};

export function Sidebar({ currentPath, onNavigate }: Props) {
  const { activeUser } = useApp();
  const groups = groupsForRole(activeUser.role);

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <aside className="sidebar">
      <button className="sidebar__brand" onClick={() => go("/home")} aria-label="Lattice home">
        <BrandMark className="sidebar__brand-mark" />
        <span className="sidebar__brand-word">Lattice</span>
      </button>

      <nav aria-label="Primary">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="sidebar__group-label">{group.label}</div>
            {group.items.map((item) => (
              <a
                key={item.path}
                className="nav-item"
                href={`#${item.path}`}
                aria-current={currentPath === item.path ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.path);
                }}
              >
                <Icon name={item.icon} className="nav-item__icon" />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
