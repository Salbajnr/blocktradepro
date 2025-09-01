import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PortfolioStats } from "@/components/portfolio/portfolio-stats";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { formatCurrency, formatPercent } from "@/lib/trading";

export function Portfolio() {
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ["/api/portfolio"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-muted rounded mb-4" />
                  <div className="h-8 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded w-1/4 mb-4" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <i className="fas fa-exclamation-circle text-4xl mb-4 block" />
        <p>Failed to load portfolio data</p>
      </div>
    );
  }

  const totalReturn = parseFloat(portfolio.summary.totalGainLoss);
  const totalReturnPercent = parseFloat(portfolio.summary.totalGainLossPercent);
  const todayReturn = parseFloat(portfolio.summary.todayPnL);

  return (
    <div className="space-y-6">
      {/* Portfolio Stats */}
      <PortfolioStats summary={portfolio.summary} />

      {/* Portfolio Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${totalReturn >= 0 ? "text-success" : "text-destructive"}`} data-testid="text-total-return">
              {totalReturn >= 0 ? "+" : ""}{formatCurrency(totalReturn)}
            </p>
            <p className={totalReturn >= 0 ? "text-success" : "text-destructive"}>
              {formatPercent(totalReturnPercent)} All Time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Today's Return</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${todayReturn >= 0 ? "text-success" : "text-destructive"}`} data-testid="text-today-return">
              {todayReturn >= 0 ? "+" : ""}{formatCurrency(todayReturn)}
            </p>
            <p className={todayReturn >= 0 ? "text-success" : "text-destructive"}>
              +2.3% Today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Diversity Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-1 mr-3">
                <Progress value={75} className="h-2" />
              </div>
              <span className="text-foreground font-semibold" data-testid="text-diversity-score">75%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <HoldingsTable holdings={portfolio.holdings} />
        </CardContent>
      </Card>
    </div>
  );
}
