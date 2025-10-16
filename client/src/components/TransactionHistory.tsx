import { Transaction } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Loader2, CheckCircle2, XCircle, Clock, Receipt } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TransactionHistoryProps {
  transactions: Transaction[];
  network: string;
  isLoading?: boolean;
}

export function TransactionHistory({ transactions, network, isLoading }: TransactionHistoryProps) {
  const openExplorer = (txHash: string) => {
    const baseUrl = network === 'mainnet' 
      ? 'https://tronscan.org/#/transaction/' 
      : 'https://shasta.tronscan.org/#/transaction/';
    window.open(baseUrl + txHash, '_blank');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="w-4 h-4 text-chart-2" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 text-chart-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      confirmed: "default",
      pending: "secondary",
      failed: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deploy: "Deploy",
      transfer: "Transfer",
      mint: "Mint",
      burn: "Burn",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Transactions</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Your transaction history will appear here once you start deploying and managing tokens.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Recent blockchain transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Hash</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Time</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tx.status)}
                      {getStatusBadge(tx.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTypeLabel(tx.type)}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono" data-testid={`text-hash-${tx.id}`}>
                      {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                    </code>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {tx.amount ? parseFloat(tx.amount).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openExplorer(tx.txHash)}
                      data-testid={`button-explorer-${tx.id}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
