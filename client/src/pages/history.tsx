import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TransactionModal } from "@/components/trading/transaction-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, formatTime } from "@/lib/trading";

export function History() {
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30days");
  const [transactionType, setTransactionType] = useState("all");
  const [symbol, setSymbol] = useState("all");
  const [status, setStatus] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: stocks } = useQuery({
    queryKey: ["/api/stocks"],
  });

  const cancelMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await apiRequest("PATCH", `/api/transactions/${transactionId}/cancel`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction Cancelled",
        description: "The transaction has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel transaction.",
        variant: "destructive",
      });
    },
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "buy": return "fas fa-arrow-up";
      case "sell": return "fas fa-arrow-down";
      case "deposit": return "fas fa-plus-circle";
      case "withdrawal": return "fas fa-minus-circle";
      default: return "fas fa-exchange-alt";
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "buy": return "bg-success/10 text-success";
      case "sell": return "bg-destructive/10 text-destructive";
      case "deposit": return "bg-success/10 text-success";
      case "withdrawal": return "bg-warning/10 text-warning";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/10 text-success"><i className="fas fa-check-circle mr-1" />Completed</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning"><i className="fas fa-clock mr-1" />Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-muted text-muted-foreground"><i className="fas fa-times-circle mr-1" />Cancelled</Badge>;
      case "failed":
        return <Badge className="bg-destructive/10 text-destructive"><i className="fas fa-exclamation-circle mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">{status}</Badge>;
    }
  };

  const filteredTransactions = transactions?.filter((transaction: any) => {
    if (transactionType !== "all" && transaction.type !== transactionType) return false;
    if (symbol !== "all" && transaction.symbol !== symbol) return false;
    if (status !== "all" && transaction.status !== status) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="select-date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="3months">Last 3 months</SelectItem>
                  <SelectItem value="1year">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Transaction Type</label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger data-testid="select-transaction-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Symbol</label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger data-testid="select-symbol-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Symbols</SelectItem>
                  {stocks?.map((stock: any) => (
                    <SelectItem key={stock.symbol} value={stock.symbol}>
                      {stock.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-4 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div>
                      <div className="h-4 bg-muted rounded w-24 mb-1" />
                      <div className="h-3 bg-muted rounded w-32" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded w-16" />
                    <div className="h-6 bg-muted rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <i className="fas fa-history text-4xl mb-4 block" />
              <p>No transactions found</p>
              <p className="text-sm">Try adjusting your filters or start trading</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="text-left">Date</TableHead>
                    <TableHead className="text-left">Type</TableHead>
                    <TableHead className="text-left">Symbol</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction: any) => (
                    <TableRow 
                      key={transaction.id} 
                      className="hover:bg-accent/50 transition-colors"
                      data-testid={`row-transaction-${transaction.id}`}
                    >
                      <TableCell>
                        <div>
                          <p className="text-sm text-foreground" data-testid={`date-${transaction.id}`}>
                            {formatDate(transaction.createdAt)}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid={`time-${transaction.id}`}>
                            {formatTime(transaction.createdAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTransactionColor(transaction.type)} data-testid={`type-${transaction.id}`}>
                          <i className={`${getTransactionIcon(transaction.type)} mr-1`} />
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-foreground" data-testid={`symbol-${transaction.id}`}>
                        {transaction.symbol || "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-foreground" data-testid={`quantity-${transaction.id}`}>
                        {transaction.quantity || "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-foreground" data-testid={`price-${transaction.id}`}>
                        {transaction.price ? formatCurrency(transaction.price) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-foreground" data-testid={`total-${transaction.id}`}>
                        {formatCurrency(transaction.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center" data-testid={`status-${transaction.id}`}>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          {transaction.status === "pending" && (
                            <Button
                              variant="link"
                              size="sm"
                              className="text-destructive hover:text-destructive/80"
                              onClick={() => cancelMutation.mutate(transaction.id)}
                              disabled={cancelMutation.isPending}
                              data-testid={`button-cancel-${transaction.id}`}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            variant="link"
                            size="sm"
                            className="text-primary hover:text-primary/80"
                            onClick={() => setSelectedTransactionId(transaction.id)}
                            data-testid={`button-view-details-${transaction.id}`}
                          >
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={!!selectedTransactionId}
        onClose={() => setSelectedTransactionId(null)}
        transactionId={selectedTransactionId}
      />
    </div>
  );
}
