interface MobileNavProps {
  isOpen: boolean;
  activeView: string;
  onViewChange: (view: string) => void;
  onClose: () => void;
}

export function MobileNav({ isOpen, activeView, onViewChange, onClose }: MobileNavProps) {
  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: "fas fa-chart-line" },
    { id: "trade", label: "Trade", icon: "fas fa-exchange-alt" },
    { id: "portfolio", label: "Portfolio", icon: "fas fa-wallet" },
    { id: "history", label: "History", icon: "fas fa-history" },
  ];

  const handleViewChange = (view: string) => {
    onViewChange(view);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-card border-b border-border">
      <div className="px-4 py-2 space-y-2">
        {navigation.map((item) => (
          <button
            key={item.id}
            onClick={() => handleViewChange(item.id)}
            className={`block w-full text-left py-2 ${
              activeView === item.id
                ? "text-primary font-medium"
                : "text-muted-foreground"
            }`}
            data-testid={`mobile-nav-${item.id}`}
          >
            <i className={`${item.icon} mr-3`} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
