import { NavLink, useLocation } from "react-router";
import { Menu, X, Moon, Sun, Settings, LogOut } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { NAVIGATION_LINKS } from "@/config/navigation";
import { useUiStore } from "@/stores/ui.store";

export default function MobileHeader() {
  const { theme, toggleTheme } = useTheme();
  const { isMobileMenuOpen, openMobileMenu, closeMobileMenu } = useUiStore();
  const location = useLocation();

  const isFullScreenPage = [
    "/tasks",
    "/notes",
    "/calendar",
    "/habits",
  ].includes(location.pathname);

  return (
    <>
      {!isFullScreenPage && (
        <header className="h-16 border-b border-border-subtle bg-background-surface flex items-center px-4 md:hidden justify-between z-20 relative">
          <div className="flex items-center gap-3">
            <button
              onClick={openMobileMenu}
              className="p-2 -ml-2 text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-accent-primary grid place-items-center">
                <div className="w-2.5 h-2.5 bg-background-surface rounded-sm"></div>
              </div>
              <span className="font-bold text-text-primary">Business</span>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 -mr-2 text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </header>
      )}

      {/* Slide-out Navigation Drawer (Z-Index increased to 60 to clear all sidebars) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-60 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={closeMobileMenu}
            aria-hidden="true"
          ></div>

          <aside className="relative w-70 max-w-sm h-full bg-background-surface flex flex-col shadow-2xl animate-in slide-in-from-left-2 duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border-subtle shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-accent-primary grid place-items-center">
                  <div className="w-3 h-3 bg-background-surface rounded-sm"></div>
                </div>
                <span className="text-xl font-bold text-text-primary">
                  Business
                </span>
              </div>
              <button
                onClick={closeMobileMenu}
                className="p-2 -mr-2 text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
              {NAVIGATION_LINKS.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-accent-subtle text-accent-primary"
                        : "text-text-secondary hover:bg-background-main hover:text-text-primary"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`w-5 h-5 transition-colors ${isActive ? "text-accent-primary" : "text-text-secondary"}`}
                      />
                      {item.name}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 space-y-2 border-t border-border-subtle shrink-0">
              <NavLink
                to="/settings"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-accent-subtle text-accent-primary"
                      : "text-text-secondary hover:bg-background-main hover:text-text-primary"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Settings
                      className={`w-5 h-5 transition-colors ${
                        isActive ? "text-accent-primary" : "text-text-secondary"
                      }`}
                    />
                    Settings
                  </>
                )}
              </NavLink>

              {/* Theme Toggle Button added to Mobile Drawer */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:bg-background-main hover:text-text-primary transition-all text-left cursor-pointer"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
                Theme
              </button>

              <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:bg-background-main hover:text-text-primary transition-all text-left cursor-pointer">
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
