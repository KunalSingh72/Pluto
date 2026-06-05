import { useState, useEffect } from "react";
import { NavLink } from "react-router";
import { Settings, Moon, Sun, LogOut, Menu } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { NAVIGATION_LINKS } from "@/config/navigation";

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", isCollapsed.toString());
  }, [isCollapsed]);

  return (
    <aside
      className={`shrink-0 bg-background-surface flex-col transition-all duration-300 ease-in-out hidden md:flex border-r border-border-subtle ${
        isCollapsed ? "w-20" : "w-70"
      }`}
    >
      {/* Branding Area & Toggle */}
      <div
        className={`h-24 flex items-center ${isCollapsed ? "justify-center" : "px-6 justify-between"}`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden transition-opacity duration-300">
            <div className="w-6 h-6 rounded bg-accent-primary shrink-0 grid place-items-center">
              <div className="w-3 h-3 bg-background-surface rounded-sm"></div>
            </div>
            <span className="text-3xl font-bold text-text-primary whitespace-nowrap">
              Pluto
            </span>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-background-main transition-colors cursor-pointer shrink-0"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-hidden hover:overflow-y-auto py-2 px-4 space-y-2">
        {NAVIGATION_LINKS.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            title={isCollapsed ? item.name : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-xl text-sm font-medium transition-all overflow-hidden ${
                isCollapsed ? "justify-center p-3" : "gap-4 px-4 py-3"
              } ${
                isActive
                  ? "bg-accent-subtle text-accent-primary"
                  : "text-text-secondary hover:bg-background-main hover:text-text-primary"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? "text-accent-primary" : "text-text-secondary"
                  }`}
                />
                {!isCollapsed && (
                  <span className="whitespace-nowrap animate-in fade-in duration-300">
                    {item.name}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 space-y-2 border-t border-border-subtle shrink-0">
        <NavLink
          to="/settings"
          title={isCollapsed ? "Settings" : undefined}
          className={({ isActive }) =>
            `flex items-center rounded-xl text-sm font-medium transition-all overflow-hidden ${
              isCollapsed ? "justify-center p-3" : "gap-4 px-4 py-3"
            } ${
              isActive
                ? "bg-accent-subtle text-accent-primary"
                : "text-text-secondary hover:bg-background-main hover:text-text-primary"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Settings
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? "text-accent-primary" : "text-text-secondary"
                }`}
              />
              {!isCollapsed && (
                <span className="whitespace-nowrap animate-in fade-in duration-300">
                  Settings
                </span>
              )}
            </>
          )}
        </NavLink>

        <button
          onClick={toggleTheme}
          title={isCollapsed ? "Toggle Theme" : undefined}
          className={`w-full flex items-center rounded-xl text-sm font-medium text-text-secondary hover:bg-background-main hover:text-text-primary transition-all overflow-hidden cursor-pointer ${
            isCollapsed ? "justify-center p-3" : "gap-4 px-4 py-3 text-left"
          }`}
        >
          <div className="shrink-0">
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </div>
          {!isCollapsed && (
            <span className="whitespace-nowrap animate-in fade-in duration-300">
              Theme
            </span>
          )}
        </button>

        <button
          title={isCollapsed ? "Sign Out" : undefined}
          className={`w-full flex items-center rounded-xl text-sm font-medium text-text-secondary hover:bg-background-main hover:text-text-primary transition-all overflow-hidden cursor-pointer mt-2 ${
            isCollapsed ? "justify-center p-3" : "gap-4 px-4 py-3 text-left"
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && (
            <span className="whitespace-nowrap animate-in fade-in duration-300">
              Sign Out
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
