import { type User, type InsertUser, type Stock, type InsertStock, type Holding, type InsertHolding, type Transaction, type InsertTransaction } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  getAllStocks(): Promise<Stock[]>;
  getStock(symbol: string): Promise<Stock | undefined>;
  createStock(stock: InsertStock): Promise<Stock>;
  updateStock(symbol: string, updates: Partial<Stock>): Promise<Stock | undefined>;
  
  getUserHoldings(userId: string): Promise<Holding[]>;
  getHolding(userId: string, symbol: string): Promise<Holding | undefined>;
  createHolding(holding: InsertHolding): Promise<Holding>;
  updateHolding(id: string, updates: Partial<Holding>): Promise<Holding | undefined>;
  deleteHolding(id: string): Promise<boolean>;
  
  getUserTransactions(userId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private stocks: Map<string, Stock>;
  private holdings: Map<string, Holding>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.users = new Map();
    this.stocks = new Map();
    this.holdings = new Map();
    this.transactions = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample user
    const sampleUser = await this.createUser({
      username: "johndoe",
      password: "password123",
      totalBalance: "24892.41",
      availableCash: "8450.30"
    });

    // Create sample stocks
    const stocks = [
      { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", currentPrice: "182.52", changeAmount: "2.34", changePercent: "1.3" },
      { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", currentPrice: "238.45", changeAmount: "-5.67", changePercent: "-2.3" },
      { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", currentPrice: "134.78", changeAmount: "1.23", changePercent: "0.9" },
    ];

    for (const stock of stocks) {
      await this.createStock(stock);
    }

    // Create sample holdings
    const holdings = [
      { userId: sampleUser.id, stockId: "stock1", symbol: "AAPL", quantity: 50, averageCost: "175.20" },
      { userId: sampleUser.id, stockId: "stock2", symbol: "TSLA", quantity: 25, averageCost: "245.80" },
      { userId: sampleUser.id, stockId: "stock3", symbol: "AMZN", quantity: 10, averageCost: "128.90" },
    ];

    for (const holding of holdings) {
      await this.createHolding(holding);
    }

    // Create sample transactions
    const transactions = [
      {
        userId: sampleUser.id,
        symbol: "",
        type: "deposit",
        quantity: null,
        price: null,
        totalAmount: "1350.89",
        commission: "0.00",
        status: "pending",
        orderType: "transfer",
        metadata: {
          reason: "Transaction in Progress",
          description: "Pending Funds Transfer",
          details: "International Funds Transfer Clearance (IFTC) Requires Authorisation and Review.",
          note: "Please note that the transaction may be delayed, held, or declined if the payment is not made on time.",
          approval: "As soon as you deposit is made, the Approval of your profit Bill will be ordered for disbursement.",
          timeOverride: "6:44"
        }
      },
      {
        userId: sampleUser.id,
        symbol: "AAPL",
        type: "buy",
        quantity: 10,
        price: "182.52",
        totalAmount: "1825.20",
        commission: "0.00",
        status: "completed",
        orderType: "market"
      },
      {
        userId: sampleUser.id,
        symbol: "TSLA",
        type: "sell",
        quantity: 5,
        price: "238.45",
        totalAmount: "1192.25",
        commission: "0.00",
        status: "completed",
        orderType: "market"
      },
      {
        userId: sampleUser.id,
        symbol: "AMZN",
        type: "buy",
        quantity: 15,
        price: "134.78",
        totalAmount: "2021.70",
        commission: "0.00",
        status: "pending",
        orderType: "limit",
        limitPrice: "134.78"
      }
    ];

    for (const transaction of transactions) {
      await this.createTransaction(transaction);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      totalBalance: insertUser.totalBalance || "10000.00",
      availableCash: insertUser.availableCash || "10000.00",
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllStocks(): Promise<Stock[]> {
    return Array.from(this.stocks.values());
  }

  async getStock(symbol: string): Promise<Stock | undefined> {
    return Array.from(this.stocks.values()).find(stock => stock.symbol === symbol);
  }

  async createStock(insertStock: InsertStock): Promise<Stock> {
    const id = randomUUID();
    const now = new Date();
    const stock: Stock = { 
      ...insertStock, 
      id,
      changeAmount: insertStock.changeAmount || "0.00",
      changePercent: insertStock.changePercent || "0.00",
      lastUpdated: now
    };
    this.stocks.set(id, stock);
    return stock;
  }

  async updateStock(symbol: string, updates: Partial<Stock>): Promise<Stock | undefined> {
    const stock = Array.from(this.stocks.values()).find(s => s.symbol === symbol);
    if (!stock) return undefined;
    
    const updatedStock = { ...stock, ...updates, lastUpdated: new Date() };
    this.stocks.set(stock.id, updatedStock);
    return updatedStock;
  }

  async getUserHoldings(userId: string): Promise<Holding[]> {
    return Array.from(this.holdings.values()).filter(holding => holding.userId === userId);
  }

  async getHolding(userId: string, symbol: string): Promise<Holding | undefined> {
    return Array.from(this.holdings.values()).find(
      holding => holding.userId === userId && holding.symbol === symbol
    );
  }

  async createHolding(insertHolding: InsertHolding): Promise<Holding> {
    const id = randomUUID();
    const now = new Date();
    const holding: Holding = { 
      ...insertHolding, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.holdings.set(id, holding);
    return holding;
  }

  async updateHolding(id: string, updates: Partial<Holding>): Promise<Holding | undefined> {
    const holding = this.holdings.get(id);
    if (!holding) return undefined;
    
    const updatedHolding = { ...holding, ...updates, updatedAt: new Date() };
    this.holdings.set(id, updatedHolding);
    return updatedHolding;
  }

  async deleteHolding(id: string): Promise<boolean> {
    return this.holdings.delete(id);
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = `TRX-${randomUUID().slice(0, 8).toUpperCase()}`;
    const now = new Date();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      metadata: insertTransaction.metadata || null,
      createdAt: now,
      updatedAt: now
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...updates, updatedAt: new Date() };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
}

export const storage = new MemStorage();
