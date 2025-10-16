import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Token,
  WalletConfig,
  Network,
  TransferTokenParams,
  MintTokenParams,
  BurnTokenParams,
} from "@shared/schema";
import { TokenList } from "@/components/TokenList";
import { TokenOperations } from "@/components/TokenOperations";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface ManageProps {
  wallet: WalletConfig | null;
  network: Network;
}

export default function Manage({ wallet, network }: ManageProps) {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location] = useLocation();

  const { data: tokens = [] } = useQuery<Token[]>({
    queryKey: ['/api/tokens', network],
    enabled: !!wallet,
  });

  // Check URL for token selection - using useEffect to avoid setState during render
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1]);
    const tokenIdFromUrl = urlParams.get('token');
    
    if (tokenIdFromUrl && !selectedToken && tokens.length > 0) {
      const token = tokens.find(t => t.id === tokenIdFromUrl);
      if (token) {
        setSelectedToken(token);
      }
    }
  }, [location, tokens, selectedToken]);

  const transferMutation = useMutation({
    mutationFn: async (params: TransferTokenParams) => {
      return await apiRequest("POST", "/api/tokens/transfer", params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Transfer successful",
        description: "Tokens transferred successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Transfer failed",
        description: error.message || "Failed to transfer tokens",
        variant: "destructive",
      });
    },
  });

  const mintMutation = useMutation({
    mutationFn: async (params: MintTokenParams) => {
      return await apiRequest("POST", "/api/tokens/mint", params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Mint successful",
        description: "Tokens minted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Mint failed",
        description: error.message || "Failed to mint tokens",
        variant: "destructive",
      });
    },
  });

  const burnMutation = useMutation({
    mutationFn: async (params: BurnTokenParams) => {
      return await apiRequest("POST", "/api/tokens/burn", params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Burn successful",
        description: "Tokens burned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Burn failed",
        description: error.message || "Failed to burn tokens",
        variant: "destructive",
      });
    },
  });

  if (!wallet) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Tokens</h1>
          <p className="text-muted-foreground mt-1">Transfer, mint, and burn your tokens</p>
        </div>
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <AlertTriangle className="w-5 h-5 text-chart-4" />
            <p className="text-sm">
              Please connect or create a wallet to manage tokens.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProcessing = transferMutation.isPending || mintMutation.isPending || burnMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Tokens</h1>
        <p className="text-muted-foreground mt-1">
          Transfer, mint, and burn your tokens on {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
        </p>
      </div>

      {selectedToken ? (
        <TokenOperations
          token={selectedToken}
          onTransfer={(params) => transferMutation.mutate(params)}
          onMint={(params) => mintMutation.mutate(params)}
          onBurn={(params) => burnMutation.mutate(params)}
          onBack={() => setSelectedToken(null)}
          isProcessing={isProcessing}
        />
      ) : (
        <TokenList
          tokens={tokens}
          onSelectToken={setSelectedToken}
          network={network}
        />
      )}
    </div>
  );
}
