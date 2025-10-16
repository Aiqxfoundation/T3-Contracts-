import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Network, WalletConfig } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import Dashboard from "@/pages/Dashboard";
import Deploy from "@/pages/Deploy";
import Manage from "@/pages/Manage";
import Transactions from "@/pages/Transactions";
import NotFound from "@/pages/not-found";

function Router() {
  const [network, setNetwork] = useState<Network>('testnet');
  const [wallet, setWallet] = useState<WalletConfig | null>(null);
  const queryClientInstance = useQueryClient();
  const { toast } = useToast();

  // Fetch current wallet and network on mount
  const { data: walletData } = useQuery<WalletConfig | null>({
    queryKey: ['/api/wallet'],
  });

  const { data: networkData } = useQuery<{ network: Network }>({
    queryKey: ['/api/network'],
  });

  useEffect(() => {
    if (walletData) {
      setWallet(walletData);
    }
  }, [walletData]);

  useEffect(() => {
    if (networkData) {
      setNetwork(networkData.network);
    }
  }, [networkData]);

  const createWalletMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/wallet/create", {});
    },
    onSuccess: (data: WalletConfig) => {
      setWallet(data);
      queryClientInstance.invalidateQueries({ queryKey: ['/api/wallet'] });
      toast({
        title: "Wallet created",
        description: "Your new wallet has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create wallet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importWalletMutation = useMutation({
    mutationFn: async (privateKey: string) => {
      return await apiRequest("POST", "/api/wallet/import", { privateKey });
    },
    onSuccess: (data: WalletConfig) => {
      setWallet(data);
      queryClientInstance.invalidateQueries({ queryKey: ['/api/wallet'] });
      toast({
        title: "Wallet imported",
        description: "Your wallet has been imported successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to import wallet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectWalletMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/wallet/disconnect", {});
    },
    onSuccess: () => {
      setWallet(null);
      queryClientInstance.invalidateQueries({ queryKey: ['/api/wallet'] });
      queryClientInstance.invalidateQueries({ queryKey: ['/api/tokens'] });
      queryClientInstance.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected",
      });
    },
  });

  const switchNetworkMutation = useMutation({
    mutationFn: async (newNetwork: Network) => {
      return await apiRequest("POST", "/api/network/switch", { network: newNetwork });
    },
    onSuccess: (data: { network: Network }) => {
      setNetwork(data.network);
      queryClientInstance.invalidateQueries({ queryKey: ['/api/network'] });
      queryClientInstance.invalidateQueries({ queryKey: ['/api/tokens'] });
      queryClientInstance.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Network switched",
        description: `Switched to ${data.network === 'mainnet' ? 'Mainnet' : 'Testnet'}`,
      });
    },
  });

  const handleNetworkChange = (newNetwork: Network) => {
    switchNetworkMutation.mutate(newNetwork);
  };

  const handleCreateWallet = () => {
    createWalletMutation.mutate();
  };

  const handleImportWallet = (privateKey: string) => {
    importWalletMutation.mutate(privateKey);
  };

  const handleDisconnect = () => {
    disconnectWalletMutation.mutate();
  };

  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          currentNetwork={network}
          onNetworkChange={handleNetworkChange}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto p-6 lg:p-8">
              <Switch>
                <Route path="/">
                  <Dashboard
                    wallet={wallet}
                    network={network}
                    onCreateWallet={handleCreateWallet}
                    onImportWallet={handleImportWallet}
                    onDisconnect={handleDisconnect}
                  />
                </Route>
                <Route path="/deploy">
                  <Deploy wallet={wallet} network={network} />
                </Route>
                <Route path="/manage">
                  <Manage wallet={wallet} network={network} />
                </Route>
                <Route path="/transactions">
                  <Transactions wallet={wallet} network={network} />
                </Route>
                <Route component={NotFound} />
              </Switch>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
