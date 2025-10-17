import TronWebImport from 'tronweb';
import { Network, DeployTokenParams, TransferTokenParams, MintTokenParams, BurnTokenParams } from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

// @ts-ignore - TronWeb doesn't have proper TypeScript types
const TronWeb = TronWebImport.TronWeb || TronWebImport;

// TronWeb configuration
const TRON_NETWORKS = {
  testnet: {
    fullHost: 'https://api.shasta.trongrid.io',
    solidityNode: 'https://api.shasta.trongrid.io',
    eventServer: 'https://api.shasta.trongrid.io',
  },
  mainnet: {
    fullHost: 'https://api.trongrid.io',
    solidityNode: 'https://api.trongrid.io',
    eventServer: 'https://api.trongrid.io',
  },
};

// Get TronGrid API key from environment (optional but recommended for better rate limits)
const TRONGRID_API_KEY = process.env.TRONGRID_API_KEY || '';

export class TronService {
  private tronWeb: any;
  private network: Network;
  private privateKey: string | null = null;

  constructor(network: Network = 'testnet', privateKey?: string) {
    this.network = network;
    this.privateKey = privateKey || null;
    this.initializeTronWeb();
  }

  private initializeTronWeb() {
    const config = TRON_NETWORKS[this.network];
    
    const tronWebConfig: any = {
      fullHost: config.fullHost,
      headers: TRONGRID_API_KEY ? { 'TRON-PRO-API-KEY': TRONGRID_API_KEY } : {},
    };
    
    if (this.privateKey) {
      tronWebConfig.privateKey = this.privateKey;
    }
    
    this.tronWeb = new TronWeb(tronWebConfig);
    
    if (TRONGRID_API_KEY) {
      console.log(`[TronService] Initialized with TronGrid API key for ${this.network}`);
    } else {
      console.log(`[TronService] Initialized without API key for ${this.network} (rate limits may apply)`);
    }
  }

  setNetwork(network: Network) {
    this.network = network;
    this.initializeTronWeb();
  }

  setPrivateKey(privateKey: string) {
    this.privateKey = privateKey;
    this.initializeTronWeb();
  }

  async createWallet() {
    const account = await this.tronWeb.createAccount();
    return {
      address: account.address.base58,
      privateKey: account.privateKey,
      network: this.network,
    };
  }

  importWallet(privateKey: string) {
    const address = this.tronWeb.address.fromPrivateKey(privateKey);
    return {
      address,
      privateKey,
      network: this.network,
    };
  }

  async getBalance(address: string): Promise<string> {
    try {
      console.log(`[TronService] Fetching balance for address: ${address} on ${this.network}`);
      const balance = await this.tronWeb.trx.getBalance(address);
      const balanceInTrx = this.tronWeb.fromSun(balance);
      console.log(`[TronService] Balance fetched successfully: ${balanceInTrx} TRX`);
      return balanceInTrx;
    } catch (error: any) {
      console.error(`[TronService] Error getting balance for ${address} on ${this.network}:`, {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      // Re-throw the error so the route can handle it properly
      throw new Error(`Failed to fetch balance from ${this.network}: ${error.message}`);
    }
  }

  async deployToken(params: DeployTokenParams, deployerPrivateKey: string): Promise<any> {
    try {
      console.log('[TronService] Starting token deployment with params:', { 
        name: params.name, 
        symbol: params.symbol, 
        decimals: params.decimals,
        initialSupply: params.initialSupply 
      });

      const tronWeb = new TronWeb({
        fullHost: TRON_NETWORKS[this.network].fullHost,
        headers: TRONGRID_API_KEY ? { 'TRON-PRO-API-KEY': TRONGRID_API_KEY } : {},
        privateKey: deployerPrivateKey,
      });

      const abi = this.getContractABI();
      const bytecode = this.getContractBytecode();

      console.log('[TronService] Deploying contract with TronWeb.contract().new()...');
      
      const contract = await tronWeb.contract().new({
        abi: abi,
        bytecode: bytecode,
        feeLimit: 1000000000,
        callValue: 0,
        userFeePercentage: 100,
        originEnergyLimit: 10000000,
        parameters: [
          params.name,
          params.symbol,
          params.decimals,
          params.initialSupply
        ]
      });

      // Convert hex address to base58 format
      const hexAddress = typeof contract.address === 'string' ? contract.address : '';
      if (!hexAddress) {
        throw new Error('No contract address returned from deployment');
      }
      
      const contractAddress = tronWeb.address.fromHex(hexAddress);
      
      if (!contractAddress) {
        throw new Error(`Failed to convert contract address: ${hexAddress}`);
      }
      
      console.log('[TronService] Contract deployed successfully at:', contractAddress);
      
      const txHash = contract.transaction?.txID ?? contract.txID ?? 'unknown';
      
      return {
        txHash: txHash,
        contractAddress: contractAddress,
      };
    } catch (error: any) {
      console.error('[TronService] Error deploying token:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      throw new Error(`Failed to deploy token: ${error.message}`);
    }
  }

  async transferToken(params: TransferTokenParams, senderPrivateKey: string): Promise<string> {
    try {
      const contract = await this.tronWeb.contract().at(params.tokenAddress);
      const amount = this.tronWeb.toSun(params.amount);

      const tx = await contract.transfer(params.toAddress, amount).send({
        feeLimit: 100000000,
        from: this.tronWeb.address.fromPrivateKey(senderPrivateKey),
      });

      return tx;
    } catch (error: any) {
      console.error('Error transferring token:', error);
      throw new Error(`Failed to transfer token: ${error.message}`);
    }
  }

  async mintToken(params: MintTokenParams, ownerPrivateKey: string): Promise<string> {
    try {
      const contract = await this.tronWeb.contract().at(params.tokenAddress);
      
      const tx = await contract.mint(params.amount).send({
        feeLimit: 100000000,
        from: this.tronWeb.address.fromPrivateKey(ownerPrivateKey),
      });

      return tx;
    } catch (error: any) {
      console.error('Error minting token:', error);
      throw new Error(`Failed to mint token: ${error.message}`);
    }
  }

  async burnToken(params: BurnTokenParams, ownerPrivateKey: string): Promise<string> {
    try {
      const contract = await this.tronWeb.contract().at(params.tokenAddress);
      
      const tx = await contract.burn(params.amount).send({
        feeLimit: 100000000,
        from: this.tronWeb.address.fromPrivateKey(ownerPrivateKey),
      });

      return tx;
    } catch (error: any) {
      console.error('Error burning token:', error);
      throw new Error(`Failed to burn token: ${error.message}`);
    }
  }

  async getTokenBalance(tokenAddress: string, holderAddress: string): Promise<string> {
    try {
      const contract = await this.tronWeb.contract().at(tokenAddress);
      const balance = await contract.balanceOf(holderAddress).call();
      const decimals = await contract.decimals().call();
      
      return (Number(balance) / Math.pow(10, Number(decimals))).toString();
    } catch (error) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  }

  async getTokenInfo(tokenAddress: string): Promise<any> {
    try {
      const contract = await this.tronWeb.contract().at(tokenAddress);
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name().call(),
        contract.symbol().call(),
        contract.decimals().call(),
        contract.totalSupply().call(),
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: (Number(totalSupply) / Math.pow(10, Number(decimals))).toString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }

  async getTransactionInfo(txHash: string): Promise<any> {
    try {
      const info = await this.tronWeb.trx.getTransactionInfo(txHash);
      return info;
    } catch (error) {
      console.error('Error getting transaction info:', error);
      return null;
    }
  }

  async estimateDeploymentFee(params: DeployTokenParams): Promise<{
    energyRequired: number;
    bandwidthRequired: number;
    estimatedTrxCost: string;
    estimatedUsdCost: string;
  }> {
    try {
      // Get current energy/bandwidth pricing from chain parameters
      const chainParameters = await this.getChainParameters();
      
      // Estimate energy and bandwidth for contract deployment
      // These are typical values for TRC-20 token deployment
      const energyRequired = 65000; // Average energy for TRC-20 deployment
      const bandwidthRequired = 350; // Average bandwidth
      
      // Energy cost calculation using actual chain parameters
      const sunPerEnergy = chainParameters.getEnergyFee || 420;
      const energyCostSun = energyRequired * sunPerEnergy;
      const energyCostTrx = this.tronWeb.fromSun(energyCostSun);
      
      // Bandwidth cost (if no free bandwidth available)
      const sunPerBandwidth = chainParameters.getTransactionFee || 1000;
      const bandwidthCostSun = bandwidthRequired * sunPerBandwidth;
      const bandwidthCostTrx = this.tronWeb.fromSun(bandwidthCostSun);
      
      // Add 20% safety margin for mainnet
      const safetyMargin = this.network === 'mainnet' ? 1.2 : 1.1;
      const totalTrx = ((parseFloat(energyCostTrx) + parseFloat(bandwidthCostTrx)) * safetyMargin).toFixed(2);
      
      // Estimate USD cost (approximate TRX price)
      const trxUsdPrice = 0.25;
      const estimatedUsd = (parseFloat(totalTrx) * trxUsdPrice).toFixed(2);
      
      return {
        energyRequired,
        bandwidthRequired,
        estimatedTrxCost: totalTrx,
        estimatedUsdCost: estimatedUsd,
      };
    } catch (error: any) {
      console.error('Error estimating deployment fee:', error);
      throw new Error(`Failed to estimate deployment fee: ${error.message}`);
    }
  }

  async estimateTransferFee(): Promise<{
    energyRequired: number;
    bandwidthRequired: number;
    estimatedTrxCost: string;
  }> {
    try {
      const chainParameters = await this.getChainParameters();
      
      // Typical values for TRC-20 token transfer
      const energyRequired = 14500;
      const bandwidthRequired = 345;
      
      const sunPerEnergy = chainParameters.getEnergyFee || 420;
      const energyCostSun = energyRequired * sunPerEnergy;
      const energyCostTrx = this.tronWeb.fromSun(energyCostSun);
      
      const sunPerBandwidth = chainParameters.getTransactionFee || 1000;
      const bandwidthCostSun = bandwidthRequired * sunPerBandwidth;
      const bandwidthCostTrx = this.tronWeb.fromSun(bandwidthCostSun);
      
      const safetyMargin = this.network === 'mainnet' ? 1.2 : 1.1;
      const totalTrx = ((parseFloat(energyCostTrx) + parseFloat(bandwidthCostTrx)) * safetyMargin).toFixed(2);
      
      return {
        energyRequired,
        bandwidthRequired,
        estimatedTrxCost: totalTrx,
      };
    } catch (error: any) {
      console.error('Error estimating transfer fee:', error);
      throw new Error(`Failed to estimate transfer fee: ${error.message}`);
    }
  }

  async estimateMintBurnFee(): Promise<{
    energyRequired: number;
    bandwidthRequired: number;
    estimatedTrxCost: string;
  }> {
    try {
      const chainParameters = await this.getChainParameters();
      
      // Typical values for mint/burn operations
      const energyRequired = 12000;
      const bandwidthRequired = 345;
      
      const sunPerEnergy = chainParameters.getEnergyFee || 420;
      const energyCostSun = energyRequired * sunPerEnergy;
      const energyCostTrx = this.tronWeb.fromSun(energyCostSun);
      
      const sunPerBandwidth = chainParameters.getTransactionFee || 1000;
      const bandwidthCostSun = bandwidthRequired * sunPerBandwidth;
      const bandwidthCostTrx = this.tronWeb.fromSun(bandwidthCostSun);
      
      const safetyMargin = this.network === 'mainnet' ? 1.2 : 1.1;
      const totalTrx = ((parseFloat(energyCostTrx) + parseFloat(bandwidthCostTrx)) * safetyMargin).toFixed(2);
      
      return {
        energyRequired,
        bandwidthRequired,
        estimatedTrxCost: totalTrx,
      };
    } catch (error: any) {
      console.error('Error estimating mint/burn fee:', error);
      throw new Error(`Failed to estimate mint/burn fee: ${error.message}`);
    }
  }

  private async getChainParameters(): Promise<any> {
    try {
      const params = await this.tronWeb.trx.getChainParameters();
      const result: any = {};
      
      params.forEach((param: any) => {
        if (param.key === 'getEnergyFee') {
          result.getEnergyFee = param.value;
        }
        if (param.key === 'getTransactionFee') {
          result.getTransactionFee = param.value;
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error getting chain parameters:', error);
      // Return default values if chain parameter fetch fails
      return {
        getEnergyFee: 420,
        getTransactionFee: 1000,
      };
    }
  }

  async getTokenOwner(tokenAddress: string): Promise<string> {
    try {
      const contract = await this.tronWeb.contract().at(tokenAddress);
      const owner = await contract.owner().call();
      return this.tronWeb.address.fromHex(owner);
    } catch (error: any) {
      console.error('Error getting token owner:', error);
      throw new Error(`Failed to get token owner: ${error.message}`);
    }
  }

  async verifyTokenOwner(tokenAddress: string, address: string): Promise<boolean> {
    try {
      const owner = await this.getTokenOwner(tokenAddress);
      return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Error verifying token owner:', error);
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getContractABI(): any[] {
    return [
      {
        "inputs": [
          {"internalType": "string", "name": "_name", "type": "string"},
          {"internalType": "string", "name": "_symbol", "type": "string"},
          {"internalType": "uint8", "name": "_decimals", "type": "uint8"},
          {"internalType": "uint256", "name": "_initialSupply", "type": "uint256"}
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
          {"indexed": true, "internalType": "address", "name": "spender", "type": "address"},
          {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
          {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "Burn",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
          {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "Mint",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
          {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
          {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "inputs": [],
        "name": "name",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "address", "name": "", "type": "address"},
          {"internalType": "address", "name": "", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "address", "name": "_to", "type": "address"},
          {"internalType": "uint256", "name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "address", "name": "_spender", "type": "address"},
          {"internalType": "uint256", "name": "_value", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "address", "name": "_from", "type": "address"},
          {"internalType": "address", "name": "_to", "type": "address"},
          {"internalType": "uint256", "name": "_value", "type": "uint256"}
        ],
        "name": "transferFrom",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}],
        "name": "mint",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}],
        "name": "burn",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
  }


  public getContractBytecode(): string {
    // IMPORTANT: Contract bytecode must be compiled from server/contracts/TRC20Token.sol
    //
    // TO COMPILE:
    // 1. Visit https://remix.ethereum.org/
    // 2. Create file: TRC20Token.sol
    // 3. Copy contract from server/contracts/TRC20Token.sol
    // 4. Compiler settings:
    //    - Version: 0.8.20
    //    - Optimization: ENABLED
    //    - Runs: 200
    // 5. Compile, then click "Compilation Details"
    // 6. Copy bytecode object (hex string without 0x)
    // 7. Replace 'PASTE_BYTECODE_HERE' below with the compiled bytecode
    //
    // Note: Optimized bytecode should be < 24KB for successful TRON deployment
    
    const bytecode = "PASTE_BYTECODE_HERE";
    
    if (bytecode === "PASTE_BYTECODE_HERE") {
      throw new Error(
        'Contract bytecode not yet compiled. Please compile server/contracts/TRC20Token.sol ' +
        'using Remix IDE (Solidity 0.8.20, optimizer enabled, 200 runs) and update the bytecode. ' +
        'See method comments for instructions.'
      );
    }
    
    return bytecode;
  }
}
