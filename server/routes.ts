import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertHoldingSchema, type Transaction } from "@shared/schema";
import { randomUUID } from "crypto";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current user (mock for demo)
  app.get("/api/user", async (req, res) => {
    const user = await storage.getUserByUsername("johndoe");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  // Get all stocks
  app.get("/api/stocks", async (req, res) => {
    const stocks = await storage.getAllStocks();
    res.json(stocks);
  });

  // Get specific stock
  app.get("/api/stocks/:symbol", async (req, res) => {
    const stock = await storage.getStock(req.params.symbol);
    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }
    res.json(stock);
  });

  // Get user portfolio
  app.get("/api/portfolio", async (req, res) => {
    const user = await storage.getUserByUsername("johndoe");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const holdings = await storage.getUserHoldings(user.id);
    const stocks = await storage.getAllStocks();
    
    const portfolioHoldings = holdings.map(holding => {
      const stock = stocks.find(s => s.symbol === holding.symbol);
      const currentValue = stock ? parseFloat(stock.currentPrice) * holding.quantity : 0;
      const costBasis = parseFloat(holding.averageCost) * holding.quantity;
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
      
      return {
        ...holding,
        currentPrice: stock?.currentPrice || "0.00",
        marketValue: currentValue.toFixed(2),
        gainLoss: gainLoss.toFixed(2),
        gainLossPercent: gainLossPercent.toFixed(2),
        stock
      };
    });

    const totalInvested = portfolioHoldings.reduce((sum, holding) => 
      sum + (parseFloat(holding.averageCost) * holding.quantity), 0
    );
    
    const totalMarketValue = portfolioHoldings.reduce((sum, holding) => 
      sum + parseFloat(holding.marketValue), 0
    );
    
    const totalGainLoss = totalMarketValue - totalInvested;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    res.json({
      user,
      holdings: portfolioHoldings,
      summary: {
        totalBalance: user.totalBalance,
        availableCash: user.availableCash,
        totalInvested: totalInvested.toFixed(2),
        totalMarketValue: totalMarketValue.toFixed(2),
        totalGainLoss: totalGainLoss.toFixed(2),
        totalGainLossPercent: totalGainLossPercent.toFixed(2),
        todayPnL: "567.89" // Mock value
      }
    });
  });

  // Get user transactions
  app.get("/api/transactions", async (req, res) => {
    const user = await storage.getUserByUsername("johndoe");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const transactions = await storage.getUserTransactions(user.id);
    res.json(transactions);
  });

  // Get specific transaction
  app.get("/api/transactions/:id", async (req, res) => {
    const transaction = await storage.getTransaction(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  });

  // Create new transaction (buy/sell)
  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      
      const user = await storage.getUserByUsername("johndoe");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const stock = await storage.getStock(validatedData.symbol);
      if (!stock) {
        return res.status(404).json({ error: "Stock not found" });
      }

      // Calculate total amount
      const price = validatedData.price ? parseFloat(validatedData.price) : parseFloat(stock.currentPrice);
      const quantity = validatedData.quantity || 0;
      const totalAmount = price * quantity;

      // Check if user has enough balance for buy orders
      if (validatedData.type === "buy" && parseFloat(user.availableCash) < totalAmount) {
        return res.status(400).json({ error: "Insufficient funds" });
      }

      // Check if user has enough shares for sell orders
      if (validatedData.type === "sell") {
        const holding = await storage.getHolding(user.id, validatedData.symbol);
        if (!holding || holding.quantity < quantity) {
          return res.status(400).json({ error: "Insufficient shares" });
        }
      }

      const transaction = await storage.createTransaction({
        ...validatedData,
        userId: user.id,
        price: price.toString(),
        totalAmount: totalAmount.toString(),
        status: validatedData.orderType === "market" ? "completed" : "pending"
      });

      // Process market orders immediately
      if (validatedData.orderType === "market") {
        await processTransaction(transaction);
      }

      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Cancel transaction
  app.patch("/api/transactions/:id/cancel", async (req, res) => {
    const transaction = await storage.updateTransaction(req.params.id, { status: "cancelled" });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  });

  // Helper function to process completed transactions
  async function processTransaction(transaction: Transaction) {
    const user = await storage.getUser(transaction.userId);
    if (!user) return;

    const totalAmount = parseFloat(transaction.totalAmount);
    const commission = parseFloat(transaction.commission);
    
    if (transaction.type === "buy") {
      // Deduct from available cash
      const newAvailableCash = parseFloat(user.availableCash) - totalAmount - commission;
      await storage.updateUser(user.id, { availableCash: newAvailableCash.toString() });

      // Update or create holding
      const existingHolding = await storage.getHolding(user.id, transaction.symbol);
      if (existingHolding) {
        const newQuantity = existingHolding.quantity + (transaction.quantity || 0);
        const newTotalCost = (parseFloat(existingHolding.averageCost) * existingHolding.quantity) + 
                           (parseFloat(transaction.price || "0") * (transaction.quantity || 0));
        const newAverageCost = newTotalCost / newQuantity;
        
        await storage.updateHolding(existingHolding.id, {
          quantity: newQuantity,
          averageCost: newAverageCost.toString()
        });
      } else {
        await storage.createHolding({
          userId: user.id,
          stockId: randomUUID(),
          symbol: transaction.symbol,
          quantity: transaction.quantity || 0,
          averageCost: transaction.price || "0"
        });
      }
    } else if (transaction.type === "sell") {
      // Add to available cash
      const newAvailableCash = parseFloat(user.availableCash) + totalAmount - commission;
      await storage.updateUser(user.id, { availableCash: newAvailableCash.toString() });

      // Update holding
      const holding = await storage.getHolding(user.id, transaction.symbol);
      if (holding) {
        const newQuantity = holding.quantity - (transaction.quantity || 0);
        if (newQuantity <= 0) {
          await storage.deleteHolding(holding.id);
        } else {
          await storage.updateHolding(holding.id, { quantity: newQuantity });
        }
      }
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
