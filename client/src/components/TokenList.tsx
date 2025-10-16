import { Token } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TokenListProps {
  tokens: Token[];
  onSelectToken: (token: Token) => void;
  network: string;
}

export function TokenList({ tokens, onSelectToken, network }: TokenListProps) {
  const { toast } = useToast();

  const copyAddress = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied to clipboard",
      description: "Token address copied successfully",
    });
  };

  const openExplorer = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const baseUrl = network === 'mainnet' 
      ? 'https://tronscan.org/#/token20/' 
      : 'https://shasta.tronscan.org/#/token20/';
    window.open(baseUrl + address, '_blank');
  };

  if (tokens.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Coins className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Tokens Deployed</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Deploy your first TRC-20 token to get started with token management on TRON.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tokens.map((token) => (
        <Card
          key={token.id}
          className="hover-elevate cursor-pointer transition-shadow"
          onClick={() => onSelectToken(token)}
          data-testid={`card-token-${token.id}`}
        >
          <CardHeader className="space-y-0 pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{token.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs font-mono">
                    {token.symbol}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {token.decimals} decimals
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Total Supply
              </p>
              <p className="text-lg font-semibold" data-testid={`text-supply-${token.id}`}>
                {parseFloat(token.totalSupply).toLocaleString()}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Contract Address
              </p>
              <div className="flex items-center gap-1">
                <code className="text-xs font-mono truncate flex-1" data-testid={`text-address-${token.id}`}>
                  {token.contractAddress.slice(0, 8)}...{token.contractAddress.slice(-6)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => copyAddress(token.contractAddress, e)}
                  data-testid={`button-copy-${token.id}`}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => openExplorer(token.contractAddress, e)}
                  data-testid={`button-explorer-${token.id}`}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Deployed {new Date(token.deployedAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
