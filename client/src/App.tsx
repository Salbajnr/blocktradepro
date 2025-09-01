import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Dashboard } from "@/pages/dashboard";
import { Trade } from "@/pages/trade";
import { Portfolio } from "@/pages/portfolio";
import { History } from "@/pages/history";
import NotFound from "@/pages/not-found";

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard onViewChange={handleViewChange} />;
      case "trade":
        return <Trade />;
      case "portfolio":
        return <Portfolio />;
      case "history":
        return <History />;
      default:
        return <Dashboard onViewChange={handleViewChange} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Header
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            activeView={activeView}
            onViewChange={handleViewChange}
          />
          <MobileNav
            isOpen={mobileMenuOpen}
            activeView={activeView}
            onViewChange={handleViewChange}
            onClose={() => setMobileMenuOpen(false)}
          />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="main-content">
            {renderActiveView()}
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
