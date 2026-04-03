import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Layout.css";

const NAV_ITEMS = [
  { path: "/", labelKey: "nav.dashboard" },
  { path: "/attendance", labelKey: "nav.attendance" },
  { path: "/leave", labelKey: "nav.leave" },
  { path: "/reports", labelKey: "nav.reports" },
  { path: "/payroll", labelKey: "nav.payroll" },
  { path: "/team", labelKey: "nav.team" },
  { path: "/admin", labelKey: "nav.admin" },
  { path: "/settings", labelKey: "nav.settings" },
] as const;

export function Layout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="wd-layout">
      <aside className={`wd-sidebar ${sidebarOpen ? "wd-sidebar--open" : ""}`}>
        <div className="wd-sidebar__header">
          <NavLink to="/" className="wd-logo-link">
            <span className="wd-logo-text">WiLL Design HR</span>
          </NavLink>
        </div>
        <nav className="wd-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `wd-nav-item ${isActive ? "wd-nav-item--active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="wd-main">
        <header className="wd-header">
          <button
            className="wd-btn wd-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <h1 className="wd-header__title">{t("app.title")}</h1>
        </header>
        <main className="wd-content">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div className="wd-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <nav className="wd-bottom-nav">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `wd-bottom-nav__item ${isActive ? "wd-bottom-nav__item--active" : ""}`}
          >
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
