import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Bar,
  BarChart
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/trading';

interface PriceChartProps {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  onTimeframeChange: (timeframe: string) => void;
}

interface PriceData {
  timestamp: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Generate realistic price data based on current price
function generatePriceData(symbol: string, timeframe: string, currentPrice: number): PriceData[] {
  const data: PriceData[] = [];
  const periods = {
    '1D': { count: 24, interval: 'hour' },
    '1W': { count: 7, interval: 'day' },
    '1M': { count: 30, interval: 'day' },
    '1Y': { count: 52, interval: 'week' }
  };

  const config = periods[timeframe as keyof typeof periods] || periods['1W'];
  let price = currentPrice;
  const baseVolatility = 0.02; // 2% base volatility

  for (let i = config.count; i >= 0; i--) {
    const date = new Date();
    
    if (config.interval === 'hour') {
      date.setHours(date.getHours() - i);
    } else if (config.interval === 'day') {
      date.setDate(date.getDate() - i);
    } else if (config.interval === 'week') {
      date.setDate(date.getDate() - (i * 7));
    }

    // Create realistic OHLC data
    const openPrice = price;
    const volatility = baseVolatility * (0.5 + Math.random());
    const changePercent = (Math.random() - 0.5) * volatility;
    
    const high = openPrice * (1 + Math.abs(changePercent) * Math.random());
    const low = openPrice * (1 - Math.abs(changePercent) * Math.random());
    const close = openPrice * (1 + changePercent);
    
    // Ensure OHLC relationships are correct
    const actualHigh = Math.max(openPrice, close, high);
    const actualLow = Math.min(openPrice, close, low);
    
    data.push({
      timestamp: date.toISOString(),
      date: timeframe === '1D' 
        ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      open: Number(openPrice.toFixed(2)),
      high: Number(actualHigh.toFixed(2)),
      low: Number(actualLow.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 100000
    });
    
    price = close; // Use close as next open
  }

  return data;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Open:</span>
            <span className="font-mono text-foreground">{formatCurrency(data.open)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">High:</span>
            <span className="font-mono text-success">{formatCurrency(data.high)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Low:</span>
            <span className="font-mono text-destructive">{formatCurrency(data.low)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Close:</span>
            <span className="font-mono text-foreground font-bold">{formatCurrency(data.close)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Volume:</span>
            <span className="font-mono text-muted-foreground">{data.volume.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function PriceChart({ symbol, timeframe, currentPrice, onTimeframeChange }: PriceChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  
  const priceData = useMemo(() => {
    return generatePriceData(symbol, timeframe, currentPrice);
  }, [symbol, timeframe, currentPrice]);

  const chartConfig = {
    price: {
      label: 'Price',
      color: 'hsl(var(--primary))'
    },
    volume: {
      label: 'Volume',
      color: 'hsl(var(--muted-foreground))'
    }
  };

  const latestPrice = priceData[priceData.length - 1];
  const firstPrice = priceData[0];
  const priceChange = latestPrice && firstPrice ? latestPrice.close - firstPrice.open : 0;
  const priceChangePercent = firstPrice ? (priceChange / firstPrice.open) * 100 : 0;

  const renderChart = () => {
    const commonProps = {
      data: priceData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-xs fill-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={['auto', 'auto']}
            className="text-xs fill-muted-foreground"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, className: "fill-primary stroke-background" }}
          />
        </LineChart>
      );
    } else {
      return (
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-xs fill-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={['auto', 'auto']}
            className="text-xs fill-muted-foreground"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke="hsl(var(--primary))" 
            fillOpacity={1}
            fill="url(#priceGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      );
    }
  };

  return (
    <Card className="chart-animation" style={{ height: "400px" }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-lg">{symbol} Price Chart</CardTitle>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-muted-foreground">Change:</span>
              <span className={`font-mono font-medium ${
                priceChange >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {priceChange >= 0 ? '+' : ''}{formatCurrency(priceChange)} ({priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Chart Type Selector */}
            <div className="flex items-center space-x-1">
              {[
                { type: 'line' as const, icon: 'fas fa-chart-line', label: 'Line' },
                { type: 'area' as const, icon: 'fas fa-chart-area', label: 'Area' }
              ].map(({ type, icon, label }) => (
                <Button
                  key={type}
                  variant={chartType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType(type)}
                  className="h-8 px-2"
                  data-testid={`button-chart-${type}`}
                >
                  <i className={`${icon} text-xs`} />
                  <span className="ml-1 hidden sm:inline">{label}</span>
                </Button>
              ))}
            </div>
            
            {/* Timeframe Selector */}
            <div className="flex items-center space-x-1">
              {['1D', '1W', '1M', '1Y'].map((period) => (
                <Button
                  key={period}
                  variant={timeframe === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onTimeframeChange(period)}
                  className="h-8 px-3"
                  data-testid={`button-timeframe-${period}`}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-full">
        <div className="h-full w-full p-4" style={{ height: "320px" }}>
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}