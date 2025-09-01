import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  country: text("country"),
  role: text("role").notNull().default("user"), // 'user', 'admin'
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
  is2faEnabled: boolean("is_2fa_enabled").notNull().default(false),
  kycStatus: text("kyc_status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  status: text("status").notNull().default("active"), // 'active', 'suspended', 'banned'
  lastLoginAt: timestamp("last_login_at"),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  totalBalance: decimal("total_balance", { precision: 12, scale: 2 }).notNull().default("10000.00"),
  availableCash: decimal("available_cash", { precision: 12, scale: 2 }).notNull().default("10000.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Crypto/Trading Pairs table (enhanced from stocks)
export const tradingPairs = pgTable("trading_pairs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  baseCurrency: text("base_currency").notNull(), // BTC, ETH, etc.
  quoteCurrency: text("quote_currency").notNull(), // USDT, USD, etc.
  symbol: text("symbol").notNull().unique(), // BTCUSDT, ETHUSDT
  name: text("name").notNull(),
  exchange: text("exchange").notNull(),
  currentPrice: decimal("current_price", { precision: 20, scale: 8 }).notNull(),
  changeAmount: decimal("change_amount", { precision: 20, scale: 8 }).notNull().default("0.00"),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }).notNull().default("0.00"),
  volume24h: decimal("volume_24h", { precision: 20, scale: 8 }).notNull().default("0.00"),
  high24h: decimal("high_24h", { precision: 20, scale: 8 }),
  low24h: decimal("low_24h", { precision: 20, scale: 8 }),
  minTradeAmount: decimal("min_trade_amount", { precision: 20, scale: 8 }).notNull(),
  maxTradeAmount: decimal("max_trade_amount", { precision: 20, scale: 8 }).notNull(),
  makerFee: decimal("maker_fee", { precision: 5, scale: 4 }).notNull().default("0.001"),
  takerFee: decimal("taker_fee", { precision: 5, scale: 4 }).notNull().default("0.002"),
  isActive: boolean("is_active").notNull().default(true),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Wallets table for multi-currency support
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  currency: text("currency").notNull(), // BTC, ETH, USDT, USD
  balance: decimal("balance", { precision: 20, scale: 8 }).notNull().default("0.00000000"),
  lockedBalance: decimal("locked_balance", { precision: 20, scale: 8 }).notNull().default("0.00000000"),
  address: text("address").unique(), // Wallet address for crypto
  type: text("type").notNull().default("spot"), // 'spot', 'margin', 'savings'
  status: text("status").notNull().default("active"), // 'active', 'frozen', 'disabled'
  isActive: boolean("is_active").notNull().default(true),
  lastTransactionAt: timestamp("last_transaction_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Orders table for trading
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tradingPairId: varchar("trading_pair_id").notNull().references(() => tradingPairs.id),
  type: text("type").notNull(), // 'limit', 'market', 'stop_limit', 'stop_market'
  side: text("side").notNull(), // 'buy', 'sell'
  status: text("status").notNull().default("pending"), // 'pending', 'partial', 'filled', 'cancelled', 'rejected'
  price: decimal("price", { precision: 20, scale: 8 }),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  filledAmount: decimal("filled_amount", { precision: 20, scale: 8 }).notNull().default("0"),
  remainingAmount: decimal("remaining_amount", { precision: 20, scale: 8 }),
  total: decimal("total", { precision: 20, scale: 8 }),
  stopPrice: decimal("stop_price", { precision: 20, scale: 8 }),
  makerFeeRate: decimal("maker_fee_rate", { precision: 5, scale: 4 }),
  takerFeeRate: decimal("taker_fee_rate", { precision: 5, scale: 4 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Trades table for executed trades
export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  makerOrderId: varchar("maker_order_id").notNull().references(() => orders.id),
  takerOrderId: varchar("taker_order_id").notNull().references(() => orders.id),
  tradingPairId: varchar("trading_pair_id").notNull().references(() => tradingPairs.id),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  total: decimal("total", { precision: 20, scale: 8 }).notNull(),
  makerFee: decimal("maker_fee", { precision: 20, scale: 8 }).notNull(),
  takerFee: decimal("taker_fee", { precision: 20, scale: 8 }).notNull(),
  makerUserId: varchar("maker_user_id").notNull().references(() => users.id),
  takerUserId: varchar("taker_user_id").notNull().references(() => users.id),
  side: text("side").notNull(), // 'buy', 'sell'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Enhanced transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull().references(() => wallets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  orderId: varchar("order_id").references(() => orders.id),
  type: text("type").notNull(), // 'deposit', 'withdrawal', 'trade', 'fee', 'transfer'
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'failed', 'cancelled'
  txHash: text("tx_hash").unique(), // Blockchain transaction hash
  fee: decimal("fee", { precision: 20, scale: 8 }).notNull().default("0"),
  feeCurrency: text("fee_currency"),
  description: text("description"),
  metadata: json("metadata"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Market data table for price history
export const marketData = pgTable("market_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tradingPairId: varchar("trading_pair_id").notNull().references(() => tradingPairs.id),
  openPrice: decimal("open_price", { precision: 20, scale: 8 }).notNull(),
  closePrice: decimal("close_price", { precision: 20, scale: 8 }).notNull(),
  highPrice: decimal("high_price", { precision: 20, scale: 8 }).notNull(),
  lowPrice: decimal("low_price", { precision: 20, scale: 8 }).notNull(),
  volume: decimal("volume", { precision: 20, scale: 8 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  intervalType: text("interval_type").notNull(), // '1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
}).extend({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  role: z.enum(["user", "admin"]).default("user"),
  kycStatus: z.enum(["pending", "approved", "rejected"]).default("pending"),
  status: z.enum(["active", "suspended", "banned"]).default("active"),
});

export const insertTradingPairSchema = createInsertSchema(tradingPairs).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum(["limit", "market", "stop_limit", "stop_market"]),
  side: z.enum(["buy", "sell"]),
  status: z.enum(["pending", "partial", "filled", "cancelled", "rejected"]).default("pending"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
}).extend({
  type: z.enum(["deposit", "withdrawal", "trade", "fee", "transfer"]),
  status: z.enum(["pending", "completed", "failed", "cancelled"]).default("pending"),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type TradingPair = typeof tradingPairs.$inferSelect;
export type InsertTradingPair = z.infer<typeof insertTradingPairSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Trade = typeof trades.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type MarketData = typeof marketData.$inferSelect;
