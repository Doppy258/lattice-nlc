import { useEffect, useRef, useState } from "react";
import { useApp } from "../../app/providers";
import { navigate } from "../../app/navigation";
import { Icon } from "../common/Icon";
import { initials } from "../../utils/formatting";
import { CATEGORY_META, DEMO_ORIGINS } from "../../data/catalog";

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  businessOwner: "Business owner",
  admin: "Admin",
};

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const {
    data,
    activeUser,
    activeUserId,
    setActiveUserId,
    ownedBusinesses,
    activeBusinessId,
    setActiveBusinessId,
  } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bizOpen, setBizOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const bizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
      if (bizRef.current && !bizRef.current.contains(e.target as Node)) setBizOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const originName =
    DEMO_ORIGINS.find((o) => o.id === activeUser.homeLocationId)?.name ?? "Oakville";

  const switchUser = (id: string) => {
    setActiveUserId(id);
    setMenuOpen(false);
    const role = data.users.find((u) => u.id === id)?.role;
    navigate(role === "businessOwner" ? "/business" : "/home");
  };

  const switchBusiness = (id: string) => {
    setActiveBusinessId(id);
    setBizOpen(false);
  };

  const showBizSwitch =
    (activeUser.role === "businessOwner" || activeUser.role === "admin") &&
    ownedBusinesses.length > 0;
  const activeBusiness = ownedBusinesses.find((b) => b.id === activeBusinessId);

  return (
    <header className="topbar">
      <button className="btn btn--ghost btn--sm topbar__menu-btn" onClick={onOpenMenu} aria-label="Open menu">
        <Icon name="offers" size={18} />
      </button>

      <div className="topbar__location">
        <Icon name="location" size={16} />
        <span>{originName}</span>
      </div>

      {showBizSwitch && (
        <div className="profile-switch biz-switch" ref={bizRef}>
          <button
            className="profile-switch__btn"
            onClick={() => setBizOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={bizOpen}
          >
            <span className="profile-switch__avatar">
              <Icon name="store" size={15} />
            </span>
            <span style={{ textAlign: "left" }}>
              <span className="profile-switch__name" style={{ display: "block" }}>
                {activeBusiness?.name ?? "Select business"}
              </span>
              <span className="profile-switch__role">
                {ownedBusinesses.length} business{ownedBusinesses.length === 1 ? "" : "es"}
              </span>
            </span>
            <Icon name="chevron" size={14} />
          </button>

          {bizOpen && (
            <div className="profile-switch__menu biz-switch__menu" role="menu">
              <div
                className="sidebar__group-label"
                style={{ padding: "var(--space-2) var(--space-3)" }}
              >
                Managing
              </div>
              {ownedBusinesses.map((biz) => (
                <button
                  key={biz.id}
                  className="profile-switch__option"
                  role="menuitemradio"
                  aria-checked={biz.id === activeBusinessId}
                  onClick={() => switchBusiness(biz.id)}
                >
                  <span style={{ flex: 1 }}>
                    <span className="profile-switch__name" style={{ display: "block" }}>
                      {biz.name}
                    </span>
                    <span className="profile-switch__role">
                      {CATEGORY_META[biz.category].label}
                    </span>
                  </span>
                  {biz.id === activeBusinessId && <Icon name="check" size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="topbar__spacer" />

      <div className="profile-switch" ref={ref}>
        <button
          className="profile-switch__btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="profile-switch__avatar">{initials(activeUser.name)}</span>
          <span style={{ textAlign: "left" }}>
            <span className="profile-switch__name" style={{ display: "block" }}>
              {activeUser.name}
            </span>
            <span className="profile-switch__role">{ROLE_LABELS[activeUser.role]}</span>
          </span>
          <Icon name="chevron" size={14} />
        </button>

        {menuOpen && (
          <div className="profile-switch__menu" role="menu">
            <div className="sidebar__group-label" style={{ padding: "var(--space-2) var(--space-3)" }}>
              Switch profile
            </div>
            {data.users.map((user) => (
              <button
                key={user.id}
                className="profile-switch__option"
                role="menuitemradio"
                aria-checked={user.id === activeUserId}
                onClick={() => switchUser(user.id)}
              >
                <span className="profile-switch__avatar">{initials(user.name)}</span>
                <span style={{ flex: 1 }}>
                  <span className="profile-switch__name" style={{ display: "block" }}>
                    {user.name}
                  </span>
                  <span className="profile-switch__role">{ROLE_LABELS[user.role]}</span>
                </span>
                {user.id === activeUserId && <Icon name="check" size={16} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
