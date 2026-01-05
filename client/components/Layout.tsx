import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Search,
  Upload,
  Download,
  Trash2,
  GitBranch,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LastAddedDate } from "@/components/LastAddedDate";
import { translations } from "@/i18n/translations";

interface LayoutProps {
  children: ReactNode;
}

const navigationItems = [
  {
    label: translations.dashboard,
    href: "/",
    icon: BarChart3,
  },
  {
    label: translations.upload,
    href: "/upload",
    icon: Upload,
  },
  {
    label: translations.download,
    href: "/download",
    icon: Download,
  },
  {
    label: translations.delete,
    href: "/delete",
    icon: Trash2,
  },
  {
    label: translations.groups,
    href: "/groups",
    icon: GitBranch,
  },
  {
    label: translations.workers,
    href: "/workers",
    icon: Search,
  },
];

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Button (visible only on mobile when sidebar is closed) */}
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 text-primary hover:bg-primary/10"
        >
          <Menu className="w-6 h-6" />
        </Button>
      )}

      {/* Mobile Overlay (closes sidebar when clicked) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 bg-primary text-primary-foreground transition-all duration-300 overflow-hidden ${
          sidebarOpen ? "w-64" : "w-0 md:w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div
            className={`p-6 border-b border-primary-foreground/20 flex items-center justify-between ${!sidebarOpen && "md:p-3"}`}
          >
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-accent/30 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">
                    {translations.farmPointage}
                  </h1>
                  <p className="text-xs opacity-80">{translations.manager}</p>
                </div>
              </div>
            )}
            {!sidebarOpen && (
              <div className="w-8 h-8 rounded bg-accent/30 flex items-center justify-center mx-auto">
                <BarChart3 className="w-5 h-5 text-accent" />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="group block"
                  title={sidebarOpen ? "" : item.label}
                  onClick={() => {
                    // Close sidebar on mobile after clicking a link
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <div
                    className={`rounded-lg hover:bg-primary-foreground/15 transition-all duration-200 ${sidebarOpen ? "px-4 py-3" : "px-2 py-3"}`}
                  >
                    <div
                      className={`flex items-center ${sidebarOpen ? "gap-3" : "justify-center"}`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <p className="font-medium text-sm">{item.label}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          {sidebarOpen && (
            <div className="p-4 border-t border-primary-foreground/20">
              <p className="text-xs opacity-75 text-center">
                {translations.version}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Last Added Date Footer */}
        <div className="border-t border-border bg-muted/30 px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <LastAddedDate />
          </div>
        </div>
      </div>
    </div>
  );
};
