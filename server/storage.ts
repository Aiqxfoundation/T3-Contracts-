import { 
  type Token, 
  type InsertToken,
  type Transaction,
  type InsertTransaction,
  type Network,
  type WalletConfig,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Wallet operations
  getWallet(): Promise<WalletConfig | undefined>;
  setWallet(wallet: WalletConfig): Promise<void>;
  clearWallet(): Promise<void>;
  
  // Network operations
  getCurrentNetwork(): Promise<Network>;
  setCurrentNetwork(network: Network): Promise<void>;
  
  // Token operations
  getTokens(network: Network): Promise<Token[]>;
  getToken(id: string): Promise<Token | undefined>;
  getTokenByAddress(address: string, network: Network): Promise<Token | undefined>;
  createToken(token: InsertToken): Promise<Token>;
  deleteToken(id: string): Promise<void>;
  updateTokenSupply(id: string, newSupply: string): Promise<void>;
  
  // Transaction operations
  getTransactions(network: Network, limit?: number): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionByHash(hash: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string, error?: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private wallet: WalletConfig | undefined;
  private currentNetwork: Network = 'testnet';
  private tokens: Map<string, Token>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.tokens = new Map();
    this.transactions = new Map();
  }

  // Wallet operations
  async getWallet(): Promise<WalletConfig | undefined> {
    return this.wallet;
  }

  async setWallet(wallet: WalletConfig): Promise<void> {
    this.wallet = wallet;
  }

  async clearWallet(): Promise<void> {
    this.wallet = undefined;
  }

  // Network operations
  async getCurrentNetwork(): Promise<Network> {
    return this.currentNetwork;
  }

  async setCurrentNetwork(network: Network): Promise<void> {
    this.currentNetwork = network;
  }

  // Token operations
  async getTokens(network: Network): Promise<Token[]> {
    return Array.from(this.tokens.values()).filter(t => t.network === network);
  }

  async getToken(id: string): Promise<Token | undefined> {
    return this.tokens.get(id);
  }

  async getTokenByAddress(address: string, network: Network): Promise<Token | undefined> {
    return Array.from(this.tokens.values()).find(
      t => t.contractAddress.toLowerCase() === address.toLowerCase() && t.network === network
    );
  }

  async createToken(insertToken: InsertToken): Promise<Token> {
    const id = randomUUID();
    const token: Token = {
      ...insertToken,
      id,
      deployedAt: new Date(),
    };
    this.tokens.set(id, token);
    return token;
  }

  async deleteToken(id: string): Promise<void> {
    this.tokens.delete(id);
  }

  // Transaction operations
  async getTransactions(network: Network, limit?: number): Promise<Transaction[]> {
    const txs = Array.from(this.transactions.values())
      .filter(t => t.network === network)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? txs.slice(0, limit) : txs;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionByHash(hash: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(
      t => t.txHash === hash
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      timestamp: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransactionStatus(id: string, status: string, error?: string): Promise<void> {
    const tx = this.transactions.get(id);
    if (tx) {
      tx.status = status;
      if (error) {
        tx.error = error;
      }
      this.transactions.set(id, tx);
    }
  }

  async updateTokenSupply(id: string, newSupply: string): Promise<void> {
    const token = this.tokens.get(id);
    if (token) {
      token.totalSupply = newSupply;
      this.tokens.set(id, token);
    }
  }
}

export const storage = new MemStorage();
