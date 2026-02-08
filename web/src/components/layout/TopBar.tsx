import { Link, useLocation } from "react-router-dom";

export default function TopBar() {
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  return (
    <header className="flex items-center gap-4 px-6 py-2.5 bg-bg-secondary border-b border-border shrink-0">
      <h1 className="text-lg font-semibold text-accent">OIDC Autopilot</h1>
      {isDashboard ? (
        <Link
          to="/config-manager"
          className="text-xs text-text-secondary border border-border rounded-md px-2.5 py-1 hover:text-accent hover:border-accent transition-colors"
        >
          Config Manager
        </Link>
      ) : (
        <Link
          to="/"
          className="text-xs text-text-secondary border border-border rounded-md px-2.5 py-1 hover:text-accent hover:border-accent transition-colors"
        >
          Dashboard
        </Link>
      )}
      {!isDashboard && (
        <span className="text-sm font-semibold text-text-primary">
          Config Manager
        </span>
      )}
    </header>
  );
}
