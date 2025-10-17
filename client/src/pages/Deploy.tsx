import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DeployTokenParams, WalletConfig, Network } from "@shared/schema";
import { TokenDeployForm } from "@/components/TokenDeployForm";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface DeployProps {
  wallet: WalletConfig | null;
  network: Network;
}

export default function Deploy({ wallet, network }: DeployProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: balance } = useQuery<{ trxBalance: string }>({
    queryKey: ['/api/wallet/balance', network],
    enabled: !!wallet,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const deployMutation = useMutation({
    mutationFn: async (params: DeployTokenParams) => {
      const response: any = await apiRequest("POST", "/api/tokens/deploy", params);
      
      // Check if TronLink deployment is required
      if (response.useTronLink) {
        const tronWeb = (window as any).tronWeb;
        
        console.log('TronLink deployment requested');
        console.log('TronWeb available:', !!tronWeb);
        console.log('TronWeb ready:', tronWeb?.ready);
        
        // Check if TronLink is available in iframe
        if (!tronWeb) {
          throw new Error(
            'TronLink not detected in this environment. ' +
            'TronLink extensions cannot work inside Replit iframe. ' +
            'Please use "Create New Wallet" or "Import Wallet" for testing in Replit.'
          );
        }
        
        if (!tronWeb.ready) {
          throw new Error('TronLink wallet not ready. Please unlock your wallet and refresh the page.');
        }

        toast({
          title: "TronLink confirmation required",
          description: "Please check TronLink popup to confirm the transaction",
        });

        try {
          // Deploy contract using TronLink
          console.log('Deploying contract with TronLink...');
          const contract = await tronWeb.contract().new({
            abi: response.contractABI,
            bytecode: response.contractBytecode,
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

          console.log('Contract deployed:', contract);
          
          const hexAddress = typeof contract.address === 'string' ? contract.address : contract;
          const contractAddress = tronWeb.address.fromHex(hexAddress);
          const txHash = contract.transaction?.txID || contract.txID || 'unknown';

          console.log('Contract address:', contractAddress);
          console.log('Transaction hash:', txHash);

          // Save deployment to backend
          const result = await apiRequest("POST", "/api/tokens/save-tronlink-deployment", {
            txHash,
            contractAddress,
            name: params.name,
            symbol: params.symbol,
            decimals: params.decimals,
            totalSupply: params.initialSupply,
            logoURI: params.logoURI,
            website: params.website,
            description: params.description,
          });

          return result;
        } catch (error: any) {
          console.error('TronLink deployment error:', error);
          throw new Error(`TronLink deployment failed: ${error.message || 'User rejected or popup blocked'}`);
        }
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Token deployed successfully",
        description: "Your token has been deployed to the blockchain",
      });
      setLocation("/manage");
    },
    onError: (error: any) => {
      toast({
        title: "Deployment failed",
        description: error.message || "Failed to deploy token",
        variant: "destructive",
      });
    },
  });

  if (!wallet) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Deploy Token</h1>
          <p className="text-muted-foreground mt-1">Create a new TRC-20 token</p>
        </div>
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <AlertTriangle className="w-5 h-5 text-chart-4" />
            <p className="text-sm">
              Please connect or create a wallet to deploy tokens.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deploy Token</h1>
        <p className="text-muted-foreground mt-1">
          Create a new TRC-20 token on {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
        </p>
      </div>

      <TokenDeployForm
        onDeploy={(params) => deployMutation.mutate(params)}
        isDeploying={deployMutation.isPending}
        network={network}
        trxBalance={balance?.trxBalance}
      />
    </div>
  );
}
