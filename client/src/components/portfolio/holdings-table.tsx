import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/trading";

interface HoldingsTableProps {
  holdings: any[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <i className="fas fa-chart-pie text-4xl mb-4 block" />
        <p>No holdings found</p>
        <p className="text-sm">Start trading to build your portfolio</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead className="text-left">Symbol</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead className="text-right">Avg Cost</TableHead>
            <TableHead className="text-right">Current Price</TableHead>
            <TableHead className="text-right">Market Value</TableHead>
            <TableHead className="text-right">Gain/Loss</TableHead>
            <TableHead className="text-right">%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((holding) => (
            <TableRow key={holding.id} className="hover:bg-accent/50 transition-colors" data-testid={`holding-${holding.symbol}`}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{holding.symbol}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{holding.symbol}</p>
                    <p className="text-sm text-muted-foreground">{holding.stock?.name}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-foreground" data-testid={`shares-${holding.symbol}`}>
                {holding.quantity}
              </TableCell>
              <TableCell className="text-right font-mono text-foreground" data-testid={`avg-cost-${holding.symbol}`}>
                {formatCurrency(holding.averageCost)}
              </TableCell>
              <TableCell className="text-right font-mono text-foreground" data-testid={`current-price-${holding.symbol}`}>
                {formatCurrency(holding.currentPrice)}
              </TableCell>
              <TableCell className="text-right font-mono text-foreground" data-testid={`market-value-${holding.symbol}`}>
                {formatCurrency(holding.marketValue)}
              </TableCell>
              <TableCell className={`text-right font-mono ${
                parseFloat(holding.gainLoss) >= 0 ? "text-success" : "text-destructive"
              }`} data-testid={`gain-loss-${holding.symbol}`}>
                {parseFloat(holding.gainLoss) >= 0 ? "+" : ""}{formatCurrency(holding.gainLoss)}
              </TableCell>
              <TableCell className={`text-right font-mono ${
                parseFloat(holding.gainLossPercent) >= 0 ? "text-success" : "text-destructive"
              }`} data-testid={`gain-loss-percent-${holding.symbol}`}>
                {formatPercent(holding.gainLossPercent)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
