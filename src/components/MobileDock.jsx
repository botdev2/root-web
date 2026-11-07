import { useEffect, useState } from "react";
import { Icon } from "./Icons.jsx";
import { APP_VERSION, publicIdUrl } from "../version.js";

export function useMobileShell() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false,
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const go = () => {
      const next = query.matches;
      setMobile(next);
      document.documentElement.dataset.shell = next ? "mobile" : "desktop";
      document.documentElement.dataset.version = APP_VERSION;
    };
    go();
    query.addEventListener("change", go);
    return () => query.removeEventListener("change", go);
  }, []);

  return mobile;
}

export default function MobileDock({ view, address, onNew, onMenu, onAccount, onId }) {
  const idHref = publicIdUrl(address);
  const items = [
    { id: "new", label: "New", icon: "plus", active: view === "home" && !idHref, onClick: onNew },
    { id: "menu", label: "Menu", icon: "menu", active: false, onClick: onMenu },
    { id: "account", label: "Account", icon: "user", active: view === "account", onClick: onAccount },
    {
      id: "id",
      label: "ID",
      icon: "id",
      active: false,
      onClick: () => {
        if (idHref) {
          window.location.href = idHref;
          return;
        }
        onId?.();
      },
    },
  ];

  return (
    <nav
      className="frost-header z-40 flex shrink-0 border-t border-[var(--stroke-soft)] pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          className={`flex h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] ${
            item.active ? "text-[var(--accent)]" : "text-[var(--muted)]"
          }`}
        >
          <Icon name={item.icon} size={18} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}
