import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/trading";

export function MarketOverview() {
  const { data: stocks, isLoading } = useQuery({
    queryKey: ["/api/stocks"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div>
                    <div className="h-4 bg-muted rounded w-20 mb-1" />
                    <div className="h-3 bg-muted rounded w-16" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-muted rounded w-16 mb-1" />
                  <div className="h-3 bg-muted rounded w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stocks?.map((stock: any) => (
            <div
              key={stock.symbol}
              className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
              data-testid={`stock-${stock.symbol}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{stock.symbol}</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{stock.name}</p>
                  <p className="text-sm text-muted-foreground">{stock.exchange}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground" data-testid={`price-${stock.symbol}`}>
                  {formatCurrency(stock.currentPrice)}
                </p>
                <p className={`text-sm ${
                  parseFloat(stock.changeAmount) >= 0 ? "text-success" : "text-destructive"
                }`} data-testid={`change-${stock.symbol}`}>
                  {parseFloat(stock.changeAmount) >= 0 ? "+" : ""}{formatCurrency(stock.changeAmount)} ({formatPercent(stock.changePercent)})
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
