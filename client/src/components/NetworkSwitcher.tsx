import { Network } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface NetworkSwitcherProps {
  currentNetwork: Network;
  onNetworkChange: (network: Network) => void;
  className?: string;
}

export function NetworkSwitcher({ currentNetwork, onNetworkChange, className }: NetworkSwitcherProps) {
  const [showMainnetWarning, setShowMainnetWarning] = useState(false);
  const [pendingNetwork, setPendingNetwork] = useState<Network | null>(null);

  const handleNetworkSelect = (network: Network) => {
    if (network === 'mainnet' && currentNetwork !== 'mainnet') {
      setPendingNetwork(network);
      setShowMainnetWarning(true);
    } else {
      onNetworkChange(network);
    }
  };

  const confirmMainnetSwitch = () => {
    if (pendingNetwork) {
      onNetworkChange(pendingNetwork);
      setPendingNetwork(null);
    }
    setShowMainnetWarning(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-between ${className}`}
            data-testid="button-network-switcher"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentNetwork === 'mainnet' ? 'bg-chart-1' : 'bg-chart-4'
                }`}
              />
              <span className="font-medium">
                {currentNetwork === 'mainnet' ? 'Mainnet' : 'Testnet (Shasta)'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuItem
            onClick={() => handleNetworkSelect('testnet')}
            className="flex items-center justify-between"
            data-testid="menuitem-network-testnet"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-4" />
              <span>Testnet (Shasta)</span>
            </div>
            {currentNetwork === 'testnet' && (
              <Badge variant="secondary" className="text-xs">Active</Badge>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleNetworkSelect('mainnet')}
            className="flex items-center justify-between"
            data-testid="menuitem-network-mainnet"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-1" />
              <span>Mainnet</span>
            </div>
            {currentNetwork === 'mainnet' && (
              <Badge variant="secondary" className="text-xs">Active</Badge>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showMainnetWarning} onOpenChange={setShowMainnetWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Switch to Mainnet?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to switch to the <strong>TRON Mainnet</strong>. All operations will use real TRX and affect real blockchain data.
              </p>
              <p className="text-destructive">
                Make sure you understand the implications and have sufficient funds before proceeding.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-mainnet">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMainnetSwitch}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-mainnet"
            >
              Switch to Mainnet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
