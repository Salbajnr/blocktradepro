import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun, User } from "lucide-react";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Header({ onMobileMenuToggle, activeView, onViewChange }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: "fas fa-chart-line" },
    { id: "trade", label: "Trade", icon: "fas fa-exchange-alt" },
    { id: "portfolio", label: "Portfolio", icon: "fas fa-wallet" },
    { id: "history", label: "History", icon: "fas fa-history" },
  ];

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-3"
              onClick={onMobileMenuToggle}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-primary" data-testid="text-app-title">
              BlockTrade
            </h1>
            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
              PRO
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center transition-colors ${
                  activeView === item.id
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`nav-${item.id}`}
              >
                <i className={`${item.icon} mr-2`} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4 text-yellow-400" />
              )}
            </Button>
            <div className="relative">
              <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">JD</span>
                </div>
                <span className="hidden sm:block text-foreground">John Doe</span>
                <i className="fas fa-chevron-down text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
