import { pgTable, text, varchar, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Token schema for deployed TRC-20 tokens
export const tokens = pgTable("tokens", {
  id: varchar("id").primaryKey(),
  contractAddress: text("contract_address").notNull().unique(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  decimals: integer("decimals").notNull(),
  totalSupply: text("total_supply").notNull(),
  deployerAddress: text("deployer_address").notNull(),
  network: text("network").notNull(), // 'testnet' or 'mainnet'
  logoURI: text("logo_uri"),
  website: text("website"),
  description: text("description"),
  deployedAt: timestamp("deployed_at").notNull(),
});

// Transaction schema for tracking blockchain transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey(),
  txHash: text("tx_hash").notNull().unique(),
  type: text("type").notNull(), // 'deploy', 'transfer', 'mint', 'burn'
  status: text("status").notNull(), // 'pending', 'confirmed', 'failed'
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  amount: text("amount"),
  tokenAddress: text("token_address"),
  network: text("network").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  error: text("error"),
});

// Insert schemas
export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  deployedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true,
});

// Types
export type Token = typeof tokens.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Network type
export type Network = 'testnet' | 'mainnet';

// Wallet configuration
export interface WalletConfig {
  address: string;
  privateKey?: string;
  network: Network;
}

// Token deployment parameters
export const deployTokenSchema = z.object({
  name: z.string().min(1, "Token name is required").max(50),
  symbol: z.string().min(1, "Token symbol is required").max(10).toUpperCase(),
  decimals: z.number().int().min(0).max(18).default(6),
  initialSupply: z.string().min(1, "Initial supply is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Initial supply must be a valid positive number")
    .refine((val) => {
      const num = parseFloat(val);
      return num <= 1000000000;
    }, "Maximum supply is 1 billion tokens"),
  logoURI: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  description: z.string().max(500, "Description too long").optional().or(z.literal("")),
});

export type DeployTokenParams = z.infer<typeof deployTokenSchema>;

// Token transfer parameters
export const transferTokenSchema = z.object({
  tokenAddress: z.string().min(1, "Token address is required"),
  toAddress: z.string().min(1, "Recipient address is required"),
  amount: z.string().min(1, "Amount is required"),
});

export type TransferTokenParams = z.infer<typeof transferTokenSchema>;

// Token mint parameters
export const mintTokenSchema = z.object({
  tokenAddress: z.string().min(1, "Token address is required"),
  amount: z.string().min(1, "Amount is required"),
});

export type MintTokenParams = z.infer<typeof mintTokenSchema>;

// Token burn parameters
export const burnTokenSchema = z.object({
  tokenAddress: z.string().min(1, "Token address is required"),
  amount: z.string().min(1, "Amount is required"),
});

export type BurnTokenParams = z.infer<typeof burnTokenSchema>;

// Wallet import parameters
export const importWalletSchema = z.object({
  privateKey: z.string().min(64, "Invalid private key").max(64, "Invalid private key"),
});

export type ImportWalletParams = z.infer<typeof importWalletSchema>;

// Balance response
export interface BalanceResponse {
  trxBalance: string;
  tokenBalances: Array<{
    tokenAddress: string;
    balance: string;
    symbol: string;
    decimals: number;
  }>;
}

// Gas estimation response
export interface GasEstimate {
  energyRequired: number;
  bandwidthRequired: number;
  estimatedCost: string;
}
