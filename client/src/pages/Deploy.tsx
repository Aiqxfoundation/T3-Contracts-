import { useMutation, useQueryClient } from "@tanstack/react-query";
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

  const deployMutation = useMutation({
    mutationFn: async (params: DeployTokenParams) => {
      return await apiRequest("POST", "/api/tokens/deploy", params);
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
      />
    </div>
  );
}
