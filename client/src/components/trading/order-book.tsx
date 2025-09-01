import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderBookProps {
  symbol: string;
}

export function OrderBook({ symbol }: OrderBookProps) {
  // Mock order book data - in a real app this would be real-time data
  const mockOrderBook = {
    bids: [
      { price: 182.50, quantity: 1250 },
      { price: 182.49, quantity: 890 },
      { price: 182.48, quantity: 2100 },
      { price: 182.47, quantity: 750 },
      { price: 182.46, quantity: 1500 },
    ],
    asks: [
      { price: 182.53, quantity: 750 },
      { price: 182.54, quantity: 1800 },
      { price: 182.55, quantity: 650 },
      { price: 182.56, quantity: 1200 },
      { price: 182.57, quantity: 900 },
    ]
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Book - {symbol}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-success mb-3">Bids</h4>
            <div className="space-y-2">
              {mockOrderBook.bids.map((order, index) => (
                <div key={index} className="flex justify-between text-sm" data-testid={`bid-${index}`}>
                  <span className="text-success font-mono">${order.price.toFixed(2)}</span>
                  <span className="text-muted-foreground font-mono">{order.quantity.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-destructive mb-3">Asks</h4>
            <div className="space-y-2">
              {mockOrderBook.asks.map((order, index) => (
                <div key={index} className="flex justify-between text-sm" data-testid={`ask-${index}`}>
                  <span className="text-destructive font-mono">${order.price.toFixed(2)}</span>
                  <span className="text-muted-foreground font-mono">{order.quantity.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
