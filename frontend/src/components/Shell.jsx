import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "◈" },
  { to: "/profile", label: "Profile", icon: "◇" },
  { to: "/documents", label: "Document Vault", icon: "▤" },
  { to: "/scholarships", label: "Find Scholarships", icon: "✦" },
  { to: "/applications", label: "Applications", icon: "▣" },
  { to: "/chat", label: "Ask the Assistant", icon: "◆" },
];

export default function Shell({ children }) {
  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-64 shrink-0 bg-ink-800 text-paper flex flex-col">
        <div className="px-6 py-7 flex items-center gap-3 border-b border-ink-600/60">
          <img
            src={logo}
            alt="Scholarship Assistant logo"
            className="w-10 h-10 rounded-seal object-cover shadow-card"
          />
          <div>
            <p className="font-display text-lg leading-tight tracking-tight">ScholarMate</p>
            <p className="font-display text-lg leading-tight tracking-tight -mt-1"></p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-seal/20 text-seal-light"
                    : "text-ink-100 hover:bg-ink-700 hover:text-paper"
                }`
              }
            >
              <span className="text-base w-4 text-center opacity-80">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-5 border-t border-ink-600/60 text-xs text-ink-200">
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
