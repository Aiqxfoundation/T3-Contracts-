import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { TronService } from "./tronService";
import {
  deployTokenSchema,
  transferTokenSchema,
  mintTokenSchema,
  burnTokenSchema,
  importWalletSchema,
  type Network,
  type WalletConfig,
} from "@shared/schema";

let tronService: TronService;
let currentWallet: WalletConfig | null = null;

// Initialize TronService
function initTronService(network: Network, privateKey?: string) {
  tronService = new TronService(network, privateKey);
}

// Initialize with testnet
initTronService('testnet');

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Network endpoints
  app.get("/api/network", async (req, res) => {
    try {
      const network = await storage.getCurrentNetwork();
      res.json({ network });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/network/switch", async (req, res) => {
    try {
      const { network } = req.body;
      
      if (network !== 'testnet' && network !== 'mainnet') {
        return res.status(400).json({ message: "Invalid network" });
      }

      await storage.setCurrentNetwork(network);
      
      // Reinitialize TronService with new network
      const wallet = await storage.getWallet();
      initTronService(network, wallet?.privateKey);
      
      res.json({ network });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Wallet endpoints
  app.get("/api/wallet", async (req, res) => {
    try {
      const wallet = await storage.getWallet();
      
      if (!wallet) {
        return res.json(null);
      }

      // Don't send private key to frontend
      res.json({
        address: wallet.address,
        network: wallet.network,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wallet/create", async (req, res) => {
    try {
      const network = await storage.getCurrentNetwork();
      initTronService(network);
      
      const walletData = await tronService.createWallet();
      
      await storage.setWallet(walletData);
      currentWallet = walletData;
      
      // Reinitialize with private key
      initTronService(network, walletData.privateKey);

      res.json({
        address: walletData.address,
        network: walletData.network,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wallet/import", async (req, res) => {
    try {
      const parsed = importWalletSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid private key" });
      }

      const { privateKey } = parsed.data;
      const network = await storage.getCurrentNetwork();
      
      initTronService(network, privateKey);
      const walletData = tronService.importWallet(privateKey);
      
      await storage.setWallet(walletData);
      currentWallet = walletData;

      res.json({
        address: walletData.address,
        network: walletData.network,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wallet/disconnect", async (req, res) => {
    try {
      await storage.clearWallet();
      currentWallet = null;
      
      const network = await storage.getCurrentNetwork();
      initTronService(network);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/wallet/balance/:network?", async (req, res) => {
    try {
      const wallet = await storage.getWallet();
      
      if (!wallet) {
        return res.status(401).json({ message: "No wallet connected" });
      }

      const trxBalance = await tronService.getBalance(wallet.address);
      
      res.json({ trxBalance });
    } catch (error: any) {
      console.error('Balance endpoint error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Token endpoints
  app.get("/api/tokens/:network?", async (req, res) => {
    try {
      const network = await storage.getCurrentNetwork();
      const tokens = await storage.getTokens(network);
      res.json(tokens);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tokens/estimate-fee", async (req, res) => {
    try {
      const parsed = deployTokenSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid parameters",
          errors: parsed.error.errors 
        });
      }

      const params = parsed.data;
      const feeEstimate = await tronService.estimateDeploymentFee(params);
      
      res.json(feeEstimate);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tokens/deploy", async (req, res) => {
    try {
      const wallet = await storage.getWallet();
      
      if (!wallet || !wallet.privateKey) {
        return res.status(401).json({ message: "No wallet connected" });
      }

      const parsed = deployTokenSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid parameters",
          errors: parsed.error.errors 
        });
      }

      const params = parsed.data;
      const network = await storage.getCurrentNetwork();

      // Check wallet balance before deployment
      const balance = await tronService.getBalance(wallet.address);
      const feeEstimate = await tronService.estimateDeploymentFee(params);
      
      if (parseFloat(balance) < parseFloat(feeEstimate.estimatedTrxCost)) {
        return res.status(400).json({ 
          message: `Insufficient TRX balance. You have ${balance} TRX but need approximately ${feeEstimate.estimatedTrxCost} TRX for deployment.`,
          balance,
          required: feeEstimate.estimatedTrxCost
        });
      }

      // Create pending transaction
      const pendingTx = await storage.createTransaction({
        txHash: "pending",
        type: "deploy",
        status: "pending",
        fromAddress: wallet.address,
        toAddress: null,
        amount: null,
        tokenAddress: null,
        network,
        error: null,
      });

      try {
        // Deploy token
        const result = await tronService.deployToken(params, wallet.privateKey);

        // Update transaction
        await storage.updateTransactionStatus(pendingTx.id, "confirmed");
        
        // Update tx hash
        const tx = await storage.getTransaction(pendingTx.id);
        if (tx) {
          tx.txHash = result.txHash;
          tx.tokenAddress = result.contractAddress;
        }

        // Save token to storage
        const token = await storage.createToken({
          contractAddress: result.contractAddress,
          name: params.name,
          symbol: params.symbol,
          decimals: params.decimals,
          totalSupply: params.initialSupply,
          deployerAddress: wallet.address,
          network,
        });

        res.json({
          token,
          txHash: result.txHash,
        });
      } catch (error: any) {
        await storage.updateTransactionStatus(pendingTx.id, "failed", error.message);
        throw error;
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tokens/transfer", async (req, res) => {
    try {
      const wallet = await storage.getWallet();
      
      if (!wallet || !wallet.privateKey) {
        return res.status(401).json({ message: "No wallet connected" });
      }

      const parsed = transferTokenSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid parameters",
          errors: parsed.error.errors 
        });
      }

      const params = parsed.data;
      const network = await storage.getCurrentNetwork();

      // Check wallet has sufficient TRX for transaction fees
      const balance = await tronService.getBalance(wallet.address);
      const feeEstimate = await tronService.estimateTransferFee();
      
      if (parseFloat(balance) < parseFloat(feeEstimate.estimatedTrxCost)) {
        return res.status(400).json({ 
          message: `Insufficient TRX balance for transaction fees. You have ${balance} TRX but need approximately ${feeEstimate.estimatedTrxCost} TRX.`,
          balance,
          required: feeEstimate.estimatedTrxCost
        });
      }

      // Check sender has sufficient token balance
      const tokenBalance = await tronService.getTokenBalance(params.tokenAddress, wallet.address);
      
      if (parseFloat(tokenBalance) < parseFloat(params.amount)) {
        return res.status(400).json({ 
          message: `Insufficient token balance. You have ${tokenBalance} tokens but trying to transfer ${params.amount} tokens.`,
          balance: tokenBalance,
          required: params.amount
        });
      }

      // Create pending transaction
      const pendingTx = await storage.createTransaction({
        txHash: "pending",
        type: "transfer",
        status: "pending",
        fromAddress: wallet.address,
        toAddress: params.toAddress,
        amount: params.amount,
        tokenAddress: params.tokenAddress,
        network,
        error: null,
      });

      try {
        // Transfer tokens
        const txHash = await tronService.transferToken(params, wallet.privateKey);

        // Update transaction
        const tx = await storage.getTransaction(pendingTx.id);
        if (tx) {
          tx.txHash = txHash;
          tx.status = "confirmed";
        }

        res.json({ txHash });
      } catch (error: any) {
        await storage.updateTransactionStatus(pendingTx.id, "failed", error.message);
        throw error;
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tokens/mint", async (req, res) => {
    try {
      const wallet = await storage.getWallet();
      
      if (!wallet || !wallet.privateKey) {
        return res.status(401).json({ message: "No wallet connected" });
      }

      const parsed = mintTokenSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid parameters",
          errors: parsed.error.errors 
        });
      }

      const params = parsed.data;
      const network = await storage.getCurrentNetwork();

      // Verify token ownership before minting
      const isOwner = await tronService.verifyTokenOwner(params.tokenAddress, wallet.address);
      
      if (!isOwner) {
        return res.status(403).json({ 
          message: "Only the token owner can mint tokens. You are not the owner of this token.",
        });
      }

      // Check wallet has sufficient TRX for transaction fees
      const balance = await tronService.getBalance(wallet.address);
      const feeEstimate = await tronService.estimateMintBurnFee();
      
      if (parseFloat(balance) < parseFloat(feeEstimate.estimatedTrxCost)) {
        return res.status(400).json({ 
          message: `Insufficient TRX balance for transaction fees. You have ${balance} TRX but need approximately ${feeEstimate.estimatedTrxCost} TRX.`,
          balance,
          required: feeEstimate.estimatedTrxCost
        });
      }

      // Create pending transaction
      const pendingTx = await storage.createTransaction({
        txHash: "pending",
        type: "mint",
        status: "pending",
        fromAddress: wallet.address,
        toAddress: null,
        amount: params.amount,
        tokenAddress: params.tokenAddress,
        network,
        error: null,
      });

      try {
        // Mint tokens
        const txHash = await tronService.mintToken(params, wallet.privateKey);

        // Update transaction
        const tx = await storage.getTransaction(pendingTx.id);
        if (tx) {
          tx.txHash = txHash;
          tx.status = "confirmed";
        }

        // Update token supply
        const token = await storage.getTokenByAddress(params.tokenAddress, network);
        if (token) {
          const newSupply = parseFloat(token.totalSupply) + parseFloat(params.amount);
          await storage.updateTokenSupply(token.id, newSupply.toString());
        }

        res.json({ txHash });
      } catch (error: any) {
        await storage.updateTransactionStatus(pendingTx.id, "failed", error.message);
        throw error;
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tokens/burn", async (req, res) => {
    try {
      const wallet = await storage.getWallet();
      
      if (!wallet || !wallet.privateKey) {
        return res.status(401).json({ message: "No wallet connected" });
      }

      const parsed = burnTokenSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid parameters",
          errors: parsed.error.errors 
        });
      }

      const params = parsed.data;
      const network = await storage.getCurrentNetwork();

      // Verify token ownership before burning
      const isOwner = await tronService.verifyTokenOwner(params.tokenAddress, wallet.address);
      
      if (!isOwner) {
        return res.status(403).json({ 
          message: "Only the token owner can burn tokens. You are not the owner of this token.",
        });
      }

      // Check wallet has sufficient TRX for transaction fees
      const balance = await tronService.getBalance(wallet.address);
      const feeEstimate = await tronService.estimateMintBurnFee();
      
      if (parseFloat(balance) < parseFloat(feeEstimate.estimatedTrxCost)) {
        return res.status(400).json({ 
          message: `Insufficient TRX balance for transaction fees. You have ${balance} TRX but need approximately ${feeEstimate.estimatedTrxCost} TRX.`,
          balance,
          required: feeEstimate.estimatedTrxCost
        });
      }

      // Check owner has sufficient token balance to burn
      const tokenBalance = await tronService.getTokenBalance(params.tokenAddress, wallet.address);
      
      if (parseFloat(tokenBalance) < parseFloat(params.amount)) {
        return res.status(400).json({ 
          message: `Insufficient token balance to burn. You have ${tokenBalance} tokens but trying to burn ${params.amount} tokens.`,
          balance: tokenBalance,
          required: params.amount
        });
      }

      // Create pending transaction
      const pendingTx = await storage.createTransaction({
        txHash: "pending",
        type: "burn",
        status: "pending",
        fromAddress: wallet.address,
        toAddress: null,
        amount: params.amount,
        tokenAddress: params.tokenAddress,
        network,
        error: null,
      });

      try {
        // Burn tokens
        const txHash = await tronService.burnToken(params, wallet.privateKey);

        // Update transaction
        const tx = await storage.getTransaction(pendingTx.id);
        if (tx) {
          tx.txHash = txHash;
          tx.status = "confirmed";
        }

        // Update token supply
        const token = await storage.getTokenByAddress(params.tokenAddress, network);
        if (token) {
          const newSupply = parseFloat(token.totalSupply) - parseFloat(params.amount);
          await storage.updateTokenSupply(token.id, newSupply.toString());
        }

        res.json({ txHash });
      } catch (error: any) {
        await storage.updateTransactionStatus(pendingTx.id, "failed", error.message);
        throw error;
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Transaction endpoints
  app.get("/api/transactions/:network?", async (req, res) => {
    try {
      const network = await storage.getCurrentNetwork();
      const transactions = await storage.getTransactions(network, 50);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
