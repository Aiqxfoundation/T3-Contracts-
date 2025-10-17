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
          params.initialSupply,
          params.logoURI || "",
          params.website || "",
          params.description || "",
        ]
      });

      console.log('[TronService] Contract deployed successfully at:', contract.address);
      
      const txHash = contract.transaction?.txID ?? contract.txID ?? 'unknown';
      
      return {
        txHash: txHash,
        contractAddress: contract.address,
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

  private getContractABI(): any[] {
    return [
      {
        "inputs": [
          {"internalType": "string", "name": "_name", "type": "string"},
          {"internalType": "string", "name": "_symbol", "type": "string"},
          {"internalType": "uint8", "name": "_decimals", "type": "uint8"},
          {"internalType": "uint256", "name": "_initialSupply", "type": "uint256"},
          {"internalType": "string", "name": "_logoURI", "type": "string"},
          {"internalType": "string", "name": "_website", "type": "string"},
          {"internalType": "string", "name": "_description", "type": "string"}
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
          {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
        ],
        "name": "Burn",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
          {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
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
        "inputs": [{"internalType": "address", "name": "_spender", "type": "address"}, {"internalType": "uint256", "name": "_value", "type": "uint256"}],
        "name": "approve",
        "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "_spender", "type": "address"}, {"internalType": "uint256", "name": "_addedValue", "type": "uint256"}],
        "name": "increaseAllowance",
        "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "_spender", "type": "address"}, {"internalType": "uint256", "name": "_subtractedValue", "type": "uint256"}],
        "name": "decreaseAllowance",
        "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
        "stateMutability": "nonpayable",
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
        "inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}],
        "name": "burn",
        "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
        "stateMutability": "nonpayable",
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
        "inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}],
        "name": "mint",
        "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
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
        "name": "owner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
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
        "name": "totalSupply",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "logoURI",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "website",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "description",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "_to", "type": "address"}, {"internalType": "uint256", "name": "_value", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
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
        "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
  }

  private getContractBytecode(): string {
    return "608060405234801561001057600080fd5b50604051612a03380380612a0383398181016040528101906100329190610563565b8660009081516020019061004792919061032d565b5085600190816051602001906100609291906103b3565b5084600260006101000a81548160ff021916908360ff16021790555033600360006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555083600690816100cd9190610685565b5082600790816100dd9190610685565b50816008908161016091906106fd565b50600260009054906101000a900460ff16600a61010d91906108cb565b8661011891906108e5565b600481905550600454600560003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055503373ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef6004546040516101c29190610960565b60405180910390a35050505050505061097b565b8280546101d99061099a565b90600052602060002090601f0160209004810192826101fb5760008555610242565b82601f1061021457805160ff1916838001178555610242565b82800160010185558215610242579182015b82811115610241578251825591602001919060010190610226565b5b50905061024f9190610253565b5090565b5b8082111561026c576000816000905550600101610254565b5090565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6102d78261028e565b810181811067ffffffffffffffff821117156102f6576102f561029f565b5b80604052505050565b6000610309610270565b905061031582826102ce565b919050565b600067ffffffffffffffff8211156103355761033461029f565b5b61033e8261028e565b9050602081019050919050565b60005b8381101561036957808201518184015260208101905061034e565b60008484015250505050565b600061038861038384610331a565b6102ff565b9050828152602081018484840111156103a4576103a3610289565b5b6103af84828561034b565b509392505050565b600082601f8301126103cc576103cb610284565b5b81516103dc848260208601610375565b91505092915050565b600060ff82169050919050565b6103fb816103e5565b811461040657600080fd5b50565b600081519050610418816103f2565b92915050565b6000819050919050565b6104318161041e565b811461043c57600080fd5b50565b60008151905061044e81610428565b92915050565b600080600080600080600060e0888a03121561047357610472610280565b5b600088015167ffffffffffffffff811115610491576104906102847565b5b61049d8a828b016103b7565b975050602088015167ffffffffffffffff8111156104be576104bd610284565b5b6104ca8a828b016103b7565b96505060406104db8a828b01610409565b95505060606104ec8a828b0161043f565b945050608088015167ffffffffffffffff81111561050d5761050c610284565b5b6105198a828b016103b7565b93505060a088015167ffffffffffffffff81111561053a57610539610284565b5b6105468a828b016103b7565b92505060c088015167ffffffffffffffff81111561056757610566610284565b5b6105738a828b016103b7565b91505092959891949750929550565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60008160011c9050919050565b6000808291508390505b600185111561060c578086048111156105e8576105e7610581565b5b60018516156105f75780820291505b8081029050610605856105b0565b94506105cc565b94509492505050565b60008261062557600190506106e1565b8161063357600090506106e1565b816001811461064957816002811461065357610682565b60019150506106e1565b60ff84111561066557610664610581565b5b8360020a91508482111561067c5761067b610581565b5b506106e1565b5060208310610133831016604e8410600b84101617156106b75782820a9050838111156106b2576106b1610581565b5b6106e1565b6106c484848460016105bd565b925090508184048111156106db576106da610581565b5b81810290505b9392505050565b60006106f38261041e565b91506106fe836103e5565b925061072b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8484610615565b905092915050565b600061073e8261041e565b91506107498361041e565b925082820261075781610412e565b9150828204841483151761076e5761076d610581565b5b5092915050565b612079806107846000396000f3fe608060405234801561001057600080fd5b50600436106101375760003560e01c806370a08231116100b857806395d89b411161007c57806395d89b41146103465780639dc29fac14610364578063a457c2d714610380578063a9059cbb146103b0578063dd62ed3e146103e057610137565b806370a08231146102a257806379cc6790146102d25780637ee49f52146102ee5780638da5cb5b1461030c578063902d55a51461032a57610137565b8063313ce567116100ff578063313ce567146101f657806339509351146102145780633f4ba83a1461024457806342966c681461024e57806356189cb41461026a57610137565b806306fdde031461013c578063095ea7b31461015a57806318160ddd1461018a57806323b872dd146101a85780632e1a7d4d146101d8575b600080fd5b610144610410565b6040516101519190611a85565b60405180910390f35b610174600480360381019061016f9190611b40565b61049e565b6040516101819190611b9b565b60405180910390f35b6101926104bc565b60405161019f9190611bc5565b60405180910390f35b6101c260048036038101906101bd9190611be0565b6104c2565b6040516101cf9190611b9b565b60405180910390f35b6101f260048036038101906101ed9190611c33565b610644565b005b6101fe6106ac565b60405161020b9190611c7c565b60405180910390f35b61022e60048036038101906102299190611b40565b6106bf565b60405161023b9190611b9b565b60405180910390f35b61024c61076b565b005b61026860048036038101906102639190611c33565b610823565b005b6102726108f8565b60405161029991906119eb565b60405180910390f35b6102bc60048036038101906102b79190611c97565b61091e565b6040516102c99190611bc5565b60405180910390f35b6102ec60048036038101906102e79190611b40565b610936565b005b6102f6610956565b6040516103039190611a85565b60405180910390f35b6103146109e4565b6040516103219190611cd3565b60405180910390f35b610332610a0a565b60405161033d9190611bc5565b60405180910390f35b61034e610a10565b60405161035b9190611a85565b60405180910390f35b61037e60048036038101906103799190611b40565b610a9e565b005b61039a60048036038101906103959190611b40565b610b6e565b6040516103a79190611b9b565b60405180910390f35b6103ca60048036038101906103c59190611b40565b610c59565b6040516103d79190611b9b565b60405180910390f35b6103fa60048036038101906103f59190611cee565b610c77565b6040516104079190611bc5565b60405180910390f35b6000805461041d90611d5d565b80601f016020809104026020016040519081016040528092919081815260200182805461044990611d5d565b80156104965780601f1061046b57610100808354040283529160200191610496565b820191906000526020600020905b81548152906001019060200180831161047957829003601f168201915b505050505081565b60006104b26104ab610cfe565b8484610d06565b6001905092915050565b60045481565b60008073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610532576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161052990611ddb565b60405180910390fd5b81600560008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205410156105b4576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105ab90611e47565b60405180910390fd5b81600a60008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006105fe610cfe565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054101561063b57600080fd5b6001905092915050565b600260009054906101000a900460ff16600a61066191906108cb565b8161066b91906108e5565b90506106758161091e565b811015610681576006005b61068a816104bc565b6106936106ac565b600460008282546106a49190611e96565b925050819055505050565b600260009054906101000a900460ff1681565b60006107616106cc610cfe565b8484600a60006106da610cfe565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008873ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461075c9190611eca565b610d06565b6001905092915050565b610773610cfe565b73ffffffffffffffffffffffffffffffffffffffff16600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16146107cc57600080fd5b600360149054906101000a900460ff161561081f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161081690611f4a565b60405180910390fd5b565b600260009054906101000a900460ff16600a61083d91906108cb565b8161084891906108e5565b9050600081600560003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015610898576006005b6108a181610ecf565b81600560003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546108f09190611e96565b925050819055505050565b600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60056020528060005260406000206000915090505481565b61093f8261094b610cfe565b8361095091906108d8565b610a9e565b5050565b6006805461096390611d5d565b80601f016020809104026020016040519081016040528092919081815260200182805461098f90611d5d565b80156109dc5780601f106109b1576101008083540402835291602001916109dc565b820191906000526020600020905b8154815290600101906020018083116109bf57829003601f168201915b505050505081565b600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60045481565b60018054610a1d90611d5d565b80601f0160208091040260200160405190810160405280929190818152602001828054610a4990611d5d565b8015610a965780601f10610a6b57610100808354040283529160200191610a96565b820191906000526020600020905b815481529060010190602001808311610a7957829003601f168201915b505050505081565b610aa6610cfe565b73ffffffffffffffffffffffffffffffffffffffff16600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614610aff57600080fd5b610b098282610fd4565b8173ffffffffffffffffffffffffffffffffffffffff16610b28610cfe565b73ffffffffffffffffffffffffffffffffffffffff167fcc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca583604051610b6d9190611bc5565b60405180910390a35050565b600080600a6000610b88610cfe565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905082811015610c45576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c3c90611fdc565b60405180910390fd5b610c4f8482610d06565b9150509392505050565b6000610c6d610c66610cfe565b8484611146565b6001905092915050565b600a6020528160005260406000206020528060005260406000206000915091505481565b600033905090565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610d75576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d6c9061206e565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610de4576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ddb9061206e565b60405180910390fd5b600a60008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054811480610e6e5750600081145b610ead576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ea490612100565b60405180910390fd5b80600a60008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92583604051610fc29190611bc5565b60405180910390a3505050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603611044576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161103b9061216c565b60405180910390fd5b80600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054101561109057600080fd5b80600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546110df9190611e96565b9250508190555080600460008282546110f89190611e96565b92505081905550600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516111139a9190611bc5565b60405180910390a35050565b600360149054906101000a900460ff1615611199576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401611190906121d8565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603611208576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016111ff90611ddb565b60405180910390fd5b80600560008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054101561128a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161128190611e47565b60405180910390fd5b80600560008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546112d99190611e96565b9250508190555080600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461132f9190611eca565b925050819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516113939190611bc5565b60405180910390a3505050565b600081519050919050565b600082825260208201905092915050565b60005b838110156113da5780820151818401526020810190506113bf565b60008484015250505050565b6000601f19601f8301169050919050565b6000611402826113a0565b61140c81856113ab565b935061141c8185602086016113bc565b611425816113e6565b840191505092915050565b6000602082019050818103600083015261144a81846113f7565b905092915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061148282611457565b9050919050565b61149281611477565b811461149d57600080fd5b50565b6000813590506114af81611489565b92915050565b6000819050919050565b6114c8816114b5565b81146114d357600080fd5b50565b6000813590506114e5816114bf565b92915050565b6000806040838503121561150257611501611452565b5b6000611510858286016114a0565b9250506020611521858286016114d6565b9150509250929050565b60008115159050919050565b6115408161152b565b82525050565b600060208201905061155b6000830184611537565b92915050565b611156a816114b5565b82525050565b600060208201905061157c6000830184611561565b92915050565b60008060006060848603121561159b5761159a611452565b5b60006115a9868287016114a0565b93505060206115ba868287016114a0565b92505060406115cb868287016114d6565b9150509250925092565b6000602082840312156115eb576115ea611452565b5b60006115f9848285016114d6565b91505092915050565b600060ff82169050919050565b61161881611602565b82525050565b6000602082019050611633600083018461160f565b92915050565b60006020828403121561164f5761164e611452565b5b600061165d848285016114a0565b91505092915050565b61166f81611477565b82525050565b600060208201905061168a6000830184611666565b92915050565b600080604083850312156116a7576116a6611452565b5b60006116b5858286016114a0565b92505060206116c6858286016114a0565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061171757607f821691505b60208210810361172a576117296116d0565b5b50919050565b7f496e76616c696420726563697069656e74206164647265737300000000000000600082015250565b60006117666019836113ab565b915061177182611730565b602082019050919050565b6000602082019050818103600083015261179581611759565b9050919050565b7f496e73756666696369656e742062616c616e636500000000000000000000000060008201525750565b60006117d26014836113ab565b91506117dd8261179c565b602082019050919050565b60006020820190508181036000830152611801816117c5565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000611842826114b5565b915061184d836114b5565b925082820390508181111561186557611864611808565b5b92915050565b6000611876826114b5565b9150611881836114b5565b925082820190508082111561189957611898611808565b5b92915050565b7f436f6e7472616374206973206e6f7420706175736564000000000000000000000600082015250565b60006118d56016836113ab565b91506118e08261189f565b602082019050919050565b60006020820190508181036000830152611904816118c8565b9050919050565b7f44656372656173656420616c6c6f77616e63652062656c6f77207a65726f0000600082015250565b6000611941601e836113ab565b915061194c8261190b565b602082019050919050565b6000602082019050818103600083015261197081611934565b9050919050565b7f496e76616c69642073706565756e6472206164647265737300000000000000000600082015250565b60006119ad6018836113ab565b91506119b882611977565b602082019050919050565b600060208201905081810360008301526119dc816119a0565b9050919050565b7f417070726f76652066726f6d206e6f6e2d7a65726f20746f206e6f6e2d7a657260008201527f6f20616c6c6f77616e6365206e6f7420616c6c6f7765642e205573652069636360208201527f726561736541006c6c6f77616e6365206f72206465637265617365416c6c6f7760408201527f616e636500000000000000000000000000000000000000000000000000000000606082015250565b6000611a906064836113ab565b9150611a9b826119e4565b608082019050919050565b60006020820190508181036000830152611abf81611a83565b9050919050565b7f43616e6e6f74206275726e2066726f6d207a65726f2061646472657373000000600082015250565b6000611afc601d836113ab565b9150611b0782611ac6565b602082019050919050565b60006020820190508181036000830152611b2b81611aef565b9050919050565b7f546f6b656e207472616e73666572732061726520706175736564000000000000600082015250565b6000611b68601a836113ab565b9150611b7382611b32565b602082019050919050565b60006020820190508181036000830152611b9781611b5b565b905092915050565b60008190508160005260206000209050919050565b60008190508160005260206000209050919050565b600081549050611bd881611ba2565b9050919050565b600081549050611bee81611bb2565b9050919050565b60006000905090565b611c0782611bf5565b67ffffffffffffffff811115611c2057611c1f6119d3565b5b611c2a82546116ff565b611c358282856118f7565b600060209050601f831160018114611c685760008415611c56578287015190505b611c608582611c62565b865550611cc8565b601f198416611c7686611ba2565b60005b82811015611c9e57848901518255600182019150602085019450602081019050611c79565b86831015611cbb5784890151611cb7601f891682611bda565b8355505b6001600288020188555050505b50505050505056fea2646970667358221220d97c763d57d2c1bcbf5e72e8a14dbef6f4b36e785e1a55b4e7a5f25c8a3b8c8964736f6c63430008110033";
  }
}
