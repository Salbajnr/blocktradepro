import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderBook } from "@/components/trading/order-book";
import { PriceChart } from "@/components/trading/price-chart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/trading";

export function Trade() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState("market");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [timeframe, setTimeframe] = useState("1W");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stocks } = useQuery({
    queryKey: ["/api/stocks"],
  });

  const { data: portfolio } = useQuery({
    queryKey: ["/api/portfolio"],
  });

  const selectedStock = stocks?.find((stock: any) => stock.symbol === selectedSymbol);
  const estimatedCost = selectedStock && quantity ? 
    parseFloat(selectedStock.currentPrice) * parseInt(quantity) : 0;

  const tradeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Placed",
        description: `${tradeType === "buy" ? "Buy" : "Sell"} order for ${quantity} shares of ${selectedSymbol} has been placed successfully.`,
      });
      setQuantity("");
      setLimitPrice("");
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quantity || parseInt(quantity) <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    const price = orderType === "limit" ? limitPrice : selectedStock?.currentPrice;
    
    tradeMutation.mutate({
      symbol: selectedSymbol,
      type: tradeType,
      quantity: parseInt(quantity),
      price,
      totalAmount: estimatedCost.toString(),
      orderType,
      limitPrice: orderType === "limit" ? limitPrice : undefined,
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Trading Chart Area */}
      <div className="xl:col-span-3 space-y-6">
        {/* Stock Selector */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                  <SelectTrigger className="w-auto border-none text-xl font-bold bg-transparent" data-testid="select-stock">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stocks?.map((stock: any) => (
                      <SelectItem key={stock.symbol} value={stock.symbol}>
                        {stock.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-stock-price">
                    {selectedStock ? formatCurrency(selectedStock.currentPrice) : "$0.00"}
                  </p>
                  <p className={`text-sm ${
                    selectedStock && parseFloat(selectedStock.changeAmount) >= 0 ? "text-success" : "text-destructive"
                  }`} data-testid="text-stock-change">
                    {selectedStock ? (
                      `${parseFloat(selectedStock.changeAmount) >= 0 ? "+" : ""}${formatCurrency(selectedStock.changeAmount)} (${selectedStock.changePercent}%)`
                    ) : "+$0.00 (0.0%)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {["1D", "1W", "1M", "1Y"].map((period) => (
                  <Button
                    key={period}
                    variant={timeframe === period ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeframe(period)}
                    data-testid={`button-timeframe-${period}`}
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Price Chart */}
        <PriceChart 
          symbol={selectedSymbol} 
          timeframe={timeframe} 
          currentPrice={selectedStock ? parseFloat(selectedStock.currentPrice) : 0}
          onTimeframeChange={setTimeframe}
        />

        {/* Order Book */}
        <OrderBook symbol={selectedSymbol} />
      </div>

      {/* Trading Panel */}
      <div className="space-y-6">
        {/* Buy/Sell Panel */}
        <Card>
          <div className="flex border-b border-border">
            <Button
              variant="ghost"
              className={`flex-1 rounded-none ${
                tradeType === "buy" ? "bg-success/10 text-success" : "text-muted-foreground"
              }`}
              onClick={() => setTradeType("buy")}
              data-testid="button-trade-buy"
            >
              Buy
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 rounded-none ${
                tradeType === "sell" ? "bg-destructive/10 text-destructive" : "text-muted-foreground"
              }`}
              onClick={() => setTradeType("sell")}
              data-testid="button-trade-sell"
            >
              Sell
            </Button>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-trade">
              <div>
                <Label htmlFor="order-type">Order Type</Label>
                <Select value={orderType} onValueChange={setOrderType}>
                  <SelectTrigger data-testid="select-trade-order-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                    <SelectItem value="stop">Stop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="1"
                  data-testid="input-trade-quantity"
                />
              </div>

              {orderType === "limit" && (
                <div>
                  <Label htmlFor="limit-price">Limit Price</Label>
                  <Input
                    id="limit-price"
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder="$0.00"
                    step="0.01"
                    data-testid="input-limit-price"
                  />
                </div>
              )}

              <div className="bg-muted rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Cost:</span>
                    <span className="font-mono text-foreground" data-testid="text-estimated-cost">
                      {formatCurrency(estimatedCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission:</span>
                    <span className="font-mono text-foreground">$0.00</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-foreground">Total:</span>
                    <span className="font-mono text-foreground" data-testid="text-trade-total">
                      {formatCurrency(estimatedCost)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className={`w-full ${
                  tradeType === "buy" 
                    ? "bg-success hover:bg-success/90 text-white" 
                    : "bg-destructive hover:bg-destructive/90"
                }`}
                disabled={tradeMutation.isPending}
                data-testid="button-submit-trade"
              >
                {tradeMutation.isPending ? (
                  <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : null}
                {tradeType === "buy" ? "Buy" : "Sell"} {selectedSymbol}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Account Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Buying Power:</span>
              <span className="font-mono text-foreground" data-testid="text-buying-power">
                {portfolio ? formatCurrency(portfolio.user.availableCash) : "$0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Day Trade Limit:</span>
              <span className="font-mono text-foreground">3/3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Portfolio Value:</span>
              <span className="font-mono text-foreground" data-testid="text-portfolio-value">
                {portfolio ? formatCurrency(portfolio.user.totalBalance) : "$0.00"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Open Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Open Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground text-sm py-4" data-testid="text-no-open-orders">
              No open orders
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
