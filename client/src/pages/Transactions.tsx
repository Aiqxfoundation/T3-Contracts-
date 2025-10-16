import { useQuery } from "@tanstack/react-query";
import { Transaction, WalletConfig, Network } from "@shared/schema";
import { TransactionHistory } from "@/components/TransactionHistory";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface TransactionsProps {
  wallet: WalletConfig | null;
  network: Network;
}

export default function Transactions({ wallet, network }: TransactionsProps) {
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', network],
    enabled: !!wallet,
  });

  if (!wallet) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">View your blockchain transaction history</p>
        </div>
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <AlertTriangle className="w-5 h-5 text-chart-4" />
            <p className="text-sm">
              Please connect or create a wallet to view transactions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground mt-1">
          View your transaction history on {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
        </p>
      </div>

      <TransactionHistory
        transactions={transactions}
        network={network}
        isLoading={isLoading}
      />
    </div>
  );
}
