import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  totalBalance: decimal("total_balance", { precision: 12, scale: 2 }).notNull().default("10000.00"),
  availableCash: decimal("available_cash", { precision: 12, scale: 2 }).notNull().default("10000.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stocks = pgTable("stocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  exchange: text("exchange").notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  changeAmount: decimal("change_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }).notNull().default("0.00"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const holdings = pgTable("holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  stockId: varchar("stock_id").notNull().references(() => stocks.id),
  symbol: text("symbol").notNull(),
  quantity: integer("quantity").notNull(),
  averageCost: decimal("average_cost", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // 'buy', 'sell', 'deposit', 'withdrawal'
  quantity: integer("quantity"),
  price: decimal("price", { precision: 10, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 10, scale: 2 }).notNull().default("0.00"),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'cancelled', 'failed'
  orderType: text("order_type").default("market"), // 'market', 'limit', 'stop'
  limitPrice: decimal("limit_price", { precision: 10, scale: 2 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertStockSchema = createInsertSchema(stocks).omit({
  id: true,
  lastUpdated: true,
});

export const insertHoldingSchema = createInsertSchema(holdings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Stock = typeof stocks.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;
export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
