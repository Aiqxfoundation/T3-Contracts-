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
    
    if (this.privateKey) {
      this.tronWeb = new TronWeb({
        fullHost: config.fullHost,
        privateKey: this.privateKey,
      });
    } else {
      this.tronWeb = new TronWeb({
        fullHost: config.fullHost,
      });
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
      const balance = await this.tronWeb.trx.getBalance(address);
      return this.tronWeb.fromSun(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  async deployToken(params: DeployTokenParams, deployerPrivateKey: string): Promise<any> {
    try {
      // Read contract source
      const contractPath = path.join(__dirname, 'contracts', 'TRC20Token.sol');
      const contractSource = fs.readFileSync(contractPath, 'utf8');

      // Compile contract
      const compiled = await this.tronWeb.transactionBuilder.createSmartContract({
        abi: this.getContractABI(),
        bytecode: this.getContractBytecode(),
        parameters: [
          params.name,
          params.symbol,
          params.decimals,
          params.initialSupply,
        ],
        feeLimit: 1000000000,
        callValue: 0,
        userFeePercentage: 100,
        originEnergyLimit: 10000000,
      }, this.tronWeb.address.fromPrivateKey(deployerPrivateKey));

      // Sign and broadcast
      const signedTx = await this.tronWeb.trx.sign(compiled, deployerPrivateKey);
      const broadcast = await this.tronWeb.trx.sendRawTransaction(signedTx);

      if (broadcast.result) {
        // Wait for contract to be deployed
        await this.sleep(3000);
        
        // Get contract address from transaction
        const contractAddress = this.tronWeb.address.fromHex(
          signedTx.contract_address || broadcast.transaction.contract_address
        );

        return {
          txHash: broadcast.txid || signedTx.txID,
          contractAddress,
        };
      } else {
        throw new Error('Transaction broadcast failed');
      }
    } catch (error: any) {
      console.error('Error deploying token:', error);
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
    // This is a simplified bytecode. In production, you'd compile the actual contract
    return "608060405234801561001057600080fd5b506040516110c43803806110c48339818101604052810190610032919061023f565b836000908051906020019061004892919061011f565b50826001908051906020019061005f92919061011f565b5081600260006101000a81548160ff021916908360ff16021790555033600360006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600260009054906101000a900460ff16600a6100d8919061041e565b816100e3919061046f565b6004819055506004546005600033815260200190815260200160002081905550600073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60045460405161016391906104da565b60405180910390a350505050610597565b8280546101319061061f565b90600052602060002090601f016020900481019282601f1061015257805160ff1916838001178555610180565b82800160010185558215610180579182015b8281111561017f578251825591602001919060010190610164565b5b50905061018d9190610191565b5090565b5b808211156101aa576000816000905550600101610192565b5090565b60006101c16101bc84610520565b6104f5565b9050828152602081018484840111156101d957600080fd5b6101e48482856105dd565b509392505050565b600082601f8301126101fd57600080fd5b815161020d8482602086016101ae565b91505092915050565b60008151905061022581610580565b92915050565b60008151905061023a81610580565b92915050565b6000806000806080858703121561025657600080fd5b600085015167ffffffffffffffff81111561027057600080fd5b61027c878288016101ec565b945050602085015167ffffffffffffffff81111561029957600080fd5b6102a5878288016101ec565b93505060406102b687828801610216565b92505060606102c78782880161022b565b91505092959194509250565b60006102de82610551565b6102e8818561055c565b93506102f88185602086016105ec565b610301816106d9565b840191505092915050565b60006103196028836105";
  }
}
