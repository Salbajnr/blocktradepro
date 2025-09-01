import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortfolioStats } from "@/components/portfolio/portfolio-stats";
import { MarketOverview } from "@/components/trading/market-overview";
import { QuickTrade } from "@/components/trading/quick-trade";
import { formatCurrency } from "@/lib/trading";

interface DashboardProps {
  onViewChange: (view: string) => void;
}

export function Dashboard({ onViewChange }: DashboardProps) {
  const { data: portfolio } = useQuery({
    queryKey: ["/api/portfolio"],
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Portfolio Stats */}
      {portfolio && <PortfolioStats summary={portfolio.summary} />}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Trade */}
        <div className="lg:col-span-1">
          <QuickTrade />
        </div>

        {/* Market Overview */}
        <div className="lg:col-span-2">
          <MarketOverview />
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewChange("history")}
            data-testid="button-view-all-transactions"
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <i className="fas fa-chart-line text-4xl mb-4 block" />
              <p>No recent transactions</p>
              <p className="text-sm">Start trading to see your activity here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction: any) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 bg-accent/20 rounded-lg"
                  data-testid={`recent-transaction-${transaction.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === "buy" ? "bg-success/10" : 
                      transaction.type === "sell" ? "bg-destructive/10" : "bg-info/10"
                    }`}>
                      <i className={`text-xs ${
                        transaction.type === "buy" ? "fas fa-arrow-up text-success" :
                        transaction.type === "sell" ? "fas fa-arrow-down text-destructive" :
                        transaction.type === "deposit" ? "fas fa-plus-circle text-success" :
                        "fas fa-minus-circle text-warning"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} {transaction.symbol}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.quantity ? `${transaction.quantity} shares` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-foreground">{formatCurrency(transaction.totalAmount)}</p>
                    <p className={`text-xs ${
                      transaction.status === "completed" ? "text-success" :
                      transaction.status === "pending" ? "text-warning" : "text-destructive"
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
