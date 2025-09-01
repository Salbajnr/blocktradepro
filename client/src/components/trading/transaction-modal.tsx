import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, X, Check } from "lucide-react";
import { formatCurrency, formatDate, formatTime, copyToClipboard } from "@/lib/trading";
import { Transaction } from "@shared/schema";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string | null;
}

export function TransactionModal({ isOpen, onClose, transactionId }: TransactionModalProps) {
  const [copied, setCopied] = useState(false);

  const { data: transaction, isLoading } = useQuery<Transaction>({
    queryKey: ["/api/transactions", transactionId],
    enabled: !!transactionId,
  });

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading || !transaction) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="p-6 text-center">
            <div className="loading-spinner w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading transaction details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="w-10 h-10 text-success" />;
      case "pending":
        return <i className="fas fa-clock text-warning text-3xl pending-spinner" />;
      case "failed":
        return <X className="w-10 h-10 text-destructive" />;
      default:
        return <i className="fas fa-clock text-warning text-3xl" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-success";
      case "pending":
        return "text-warning";
      case "failed":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "completed":
        return "Your transaction has been completed successfully";
      case "pending":
        return "Your transaction is being processed";
      case "failed":
        return "Your transaction has failed";
      default:
        return "Transaction status unknown";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "buy":
        return "fas fa-arrow-up";
      case "sell":
        return "fas fa-arrow-down";
      case "deposit":
        return "fas fa-plus-circle";
      case "withdrawal":
        return "fas fa-minus-circle";
      default:
        return "fas fa-exchange-alt";
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "buy":
        return "bg-success/10 text-success";
      case "sell":
        return "bg-destructive/10 text-destructive";
      case "deposit":
        return "bg-success/10 text-success";
      case "withdrawal":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto print-friendly">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0"
            onClick={onClose}
            data-testid="button-close-modal"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Status Header */}
          <div className="text-center py-8 border-b border-border">
            {transaction && transaction.metadata?.description && (
              <div className="mb-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <h3 className="font-semibold text-warning mb-2">{transaction.metadata.description}</h3>
                <p className="text-sm text-muted-foreground mb-2">{transaction.metadata.details}</p>
                <p className="text-xs text-muted-foreground mb-1">{transaction.metadata.note}</p>
                <p className="text-xs text-info font-medium">{transaction.metadata.approval}</p>
              </div>
            )}
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              transaction.status === "completed" ? "bg-success/10" :
              transaction.status === "pending" ? "bg-warning/10" : "bg-destructive/10"
            }`}>
              {getStatusIcon(transaction.status)}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${getStatusColor(transaction.status)}`}>
              Transaction {transaction.status === "completed" ? "Successful" : 
                         transaction.status === "pending" ? "Pending" : "Failed"}
            </h2>
            <p className="text-muted-foreground">{getStatusMessage(transaction.status)}</p>

            {transaction.status === "pending" && (
              <div className="mt-4 max-w-md mx-auto">
                <div className="bg-muted rounded-full h-2">
                  <div className="progress-bar bg-warning h-2 rounded-full" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Processing... Please wait</p>
              </div>
            )}
          </div>

          {/* Transaction Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                  <div className="flex items-center mt-1">
                    <span className="text-lg font-mono" data-testid="text-transaction-id">{transaction.id}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 h-6 w-6"
                      onClick={() => handleCopy(transaction.id)}
                      data-testid="button-copy-id"
                    >
                      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3 text-primary" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <div className={`text-2xl font-bold mt-1 ${getStatusColor(transaction.status)}`} data-testid="text-amount">
                    {formatCurrency(transaction.totalAmount)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Transaction Type</label>
                  <div className="flex items-center mt-1">
                    <Badge className={`${getTypeBadgeColor(transaction.type)}`} data-testid="badge-transaction-type">
                      <i className={`${getTypeIcon(transaction.type)} mr-1`} />
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </Badge>
                  </div>
                </div>

                {transaction.symbol && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Symbol</label>
                    <div className="flex items-center mt-1">
                      <span className="font-mono text-foreground" data-testid="text-symbol">{transaction.symbol}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                  <div className="mt-1">
                    <div className="text-lg" data-testid="text-date">{formatDate(transaction.createdAt)}</div>
                    <div className="text-sm text-muted-foreground" data-testid="text-time">
                      {transaction.metadata?.timeOverride || formatTime(transaction.createdAt)} UTC
                    </div>
                  </div>
                </div>

                {transaction.quantity && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                    <div className="text-lg mt-1 font-mono" data-testid="text-quantity">
                      {transaction.quantity} shares
                    </div>
                  </div>
                )}

                {transaction.price && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Price per Share</label>
                    <div className="text-lg mt-1 font-mono" data-testid="text-price">
                      {formatCurrency(transaction.price)}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Commission</label>
                  <div className="text-lg mt-1 font-mono" data-testid="text-commission">
                    {formatCurrency(transaction.commission)}
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Timeline */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Transaction Timeline</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                
                <div className="relative flex items-center mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-success rounded-full">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div className="ml-4">
                    <div className="font-medium">Transaction Initiated</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(transaction.createdAt)} at {formatTime(transaction.createdAt)}
                    </div>
                  </div>
                </div>

                {transaction.status === "completed" && (
                  <>
                    <div className="relative flex items-center mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-success rounded-full">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium">Payment Verified</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(transaction.updatedAt)} at {formatTime(transaction.updatedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="relative flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-success rounded-full">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium">Transaction Completed</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(transaction.updatedAt)} at {formatTime(transaction.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {transaction.status === "pending" && (
                  <div className="relative flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-warning rounded-full">
                      <i className="fas fa-clock text-white text-xs pending-spinner" />
                    </div>
                    <div className="ml-4">
                      <div className="font-medium">Processing Payment</div>
                      <div className="text-sm text-muted-foreground">Currently in progress</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
