import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/trading";

interface PortfolioStatsProps {
  summary: {
    totalBalance: string;
    availableCash: string;
    totalInvested: string;
    totalGainLoss: string;
    totalGainLossPercent: string;
    todayPnL: string;
  };
}

export function PortfolioStats({ summary }: PortfolioStatsProps) {
  const stats = [
    {
      title: "Total Balance",
      value: summary.totalBalance,
      icon: "fas fa-wallet",
      change: "+$1,234.56 (5.2%)",
      changeColor: "text-success",
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
      testId: "total-balance"
    },
    {
      title: "Available Cash",
      value: summary.availableCash,
      icon: "fas fa-dollar-sign",
      bgColor: "bg-success/10",
      iconColor: "text-success",
      testId: "available-cash"
    },
    {
      title: "Invested",
      value: summary.totalInvested,
      icon: "fas fa-chart-pie",
      change: formatPercent(summary.totalGainLossPercent),
      changeColor: parseFloat(summary.totalGainLoss) >= 0 ? "text-success" : "text-destructive",
      bgColor: "bg-info/10",
      iconColor: "text-info",
      testId: "invested"
    },
    {
      title: "Today's P&L",
      value: summary.todayPnL,
      icon: "fas fa-trending-up",
      bgColor: "bg-success/10",
      iconColor: "text-success",
      testId: "daily-pnl"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground" data-testid={`text-${stat.testId}`}>
                  {formatCurrency(stat.value)}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                <i className={`${stat.icon} ${stat.iconColor}`} />
              </div>
            </div>
            {stat.change && (
              <div className="mt-4 flex items-center">
                <span className={`text-sm ${stat.changeColor}`}>{stat.change}</span>
                <span className="text-xs text-muted-foreground ml-2">24h</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
