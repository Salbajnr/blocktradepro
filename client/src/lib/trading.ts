export const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatPercent = (percent: string | number): string => {
  const num = typeof percent === 'string' ? parseFloat(percent) : percent;
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
};

export const calculateTotalReturn = (holdings: any[]): { amount: number; percent: number } => {
  let totalCost = 0;
  let totalValue = 0;

  holdings.forEach(holding => {
    const cost = parseFloat(holding.averageCost) * holding.quantity;
    const value = parseFloat(holding.currentPrice) * holding.quantity;
    totalCost += cost;
    totalValue += value;
  });

  const amount = totalValue - totalCost;
  const percent = totalCost > 0 ? (amount / totalCost) * 100 : 0;

  return { amount, percent };
};
