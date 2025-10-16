import { useQuery } from "@tanstack/react-query";
import { Token, Transaction, WalletConfig, Network } from "@shared/schema";
import { WalletPanel } from "@/components/WalletPanel";
import { TokenList } from "@/components/TokenList";
import { TransactionHistory } from "@/components/TransactionHistory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, ArrowUpDown, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

interface DashboardProps {
  wallet: WalletConfig | null;
  network: Network;
  onCreateWallet: () => void;
  onImportWallet: (privateKey: string) => void;
  onDisconnect: () => void;
}

export default function Dashboard({ wallet, network, onCreateWallet, onImportWallet, onDisconnect }: DashboardProps) {
  const [, setLocation] = useLocation();

  const { data: tokens = [] } = useQuery<Token[]>({
    queryKey: ['/api/tokens', network],
    enabled: !!wallet,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', network],
    enabled: !!wallet,
  });

  const { data: balance } = useQuery<{ trxBalance: string }>({
    queryKey: ['/api/wallet/balance', network],
    enabled: !!wallet,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const handleSelectToken = (token: Token) => {
    setLocation(`/manage?token=${token.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your TRON TRC-20 tokens on {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <WalletPanel
          wallet={wallet}
          onCreateWallet={onCreateWallet}
          onImportWallet={onImportWallet}
          onDisconnect={onDisconnect}
          trxBalance={balance?.trxBalance}
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployed Tokens</CardTitle>
            <Coins className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-deployed-count">
              {tokens.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              TRC-20 tokens on {network}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-transaction-count">
              {transactions.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Blockchain operations
            </p>
          </CardContent>
        </Card>
      </div>

      {wallet && (
        <>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Your Tokens</h2>
            <TokenList
              tokens={tokens}
              onSelectToken={handleSelectToken}
              network={network}
            />
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
            <TransactionHistory
              transactions={transactions.slice(0, 5)}
              network={network}
            />
          </div>
        </>
      )}
    </div>
  );
}
