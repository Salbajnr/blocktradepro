import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/trading";

export function QuickTrade() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState("market");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  
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

    tradeMutation.mutate({
      symbol: selectedSymbol,
      type: tradeType,
      quantity: parseInt(quantity),
      price: selectedStock?.currentPrice,
      totalAmount: estimatedCost.toString(),
      orderType,
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Quick Trade</h3>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-quick-trade">
          <div>
            <Label htmlFor="symbol">Symbol</Label>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger data-testid="select-symbol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stocks?.map((stock: any) => (
                  <SelectItem key={stock.symbol} value={stock.symbol}>
                    {stock.symbol} - {stock.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={tradeType === "buy" ? "default" : "outline"}
              className={tradeType === "buy" ? "bg-success hover:bg-success/90 text-white" : ""}
              onClick={() => setTradeType("buy")}
              data-testid="button-buy"
            >
              Buy
            </Button>
            <Button
              type="button"
              variant={tradeType === "sell" ? "default" : "outline"}
              className={tradeType === "sell" ? "bg-destructive hover:bg-destructive/90" : ""}
              onClick={() => setTradeType("sell")}
              data-testid="button-sell"
            >
              Sell
            </Button>
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
              data-testid="input-quantity"
            />
          </div>

          <div>
            <Label htmlFor="order-type">Order Type</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger data-testid="select-order-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market Order</SelectItem>
                <SelectItem value="limit">Limit Order</SelectItem>
                <SelectItem value="stop">Stop Loss</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Estimated: <span className="font-mono text-foreground" data-testid="text-estimated-cost">
              {formatCurrency(estimatedCost)}
            </span></p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={tradeMutation.isPending}
            data-testid="button-place-order"
          >
            {tradeMutation.isPending ? (
              <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : null}
            Place Order
          </Button>
        </form>
      </div>
    </div>
  );
}
