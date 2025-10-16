import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wallet, Copy, Check, Eye, EyeOff, Plus, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WalletConfig } from "@shared/schema";

interface WalletPanelProps {
  wallet: WalletConfig | null;
  onCreateWallet: () => void;
  onImportWallet: (privateKey: string) => void;
  onDisconnect: () => void;
  trxBalance?: string;
}

export function WalletPanel({ wallet, onCreateWallet, onImportWallet, onDisconnect, trxBalance }: WalletPanelProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Address copied successfully",
    });
  };

  const handleImport = () => {
    if (privateKey.length === 64) {
      onImportWallet(privateKey);
      setImportDialogOpen(false);
      setPrivateKey("");
    } else {
      toast({
        title: "Invalid private key",
        description: "Private key must be 64 characters long",
        variant: "destructive",
      });
    }
  };

  if (!wallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Setup
          </CardTitle>
          <CardDescription>Create or import a wallet to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={onCreateWallet}
            className="w-full"
            data-testid="button-create-wallet"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Wallet
          </Button>
          
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full"
                data-testid="button-open-import-wallet"
              >
                Import Wallet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Wallet</DialogTitle>
                <DialogDescription>
                  Enter your private key to import an existing wallet
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="private-key">Private Key (64 characters)</Label>
                  <div className="relative">
                    <Input
                      id="private-key"
                      type={showPrivateKey ? "text" : "password"}
                      placeholder="Enter your private key"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      className="font-mono pr-10"
                      data-testid="input-import-private-key"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      data-testid="button-toggle-private-key"
                    >
                      {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleImport}
                  className="w-full"
                  data-testid="button-confirm-import-wallet"
                >
                  Import Wallet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet
          </div>
          <Badge variant="secondary" className="text-xs">Connected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Address
          </Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded-md truncate" data-testid="text-wallet-address">
              {wallet.address}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(wallet.address)}
              data-testid="button-copy-address"
            >
              {copied ? <Check className="w-4 h-4 text-chart-2" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {trxBalance !== undefined && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              TRX Balance
            </Label>
            <div className="text-2xl font-semibold" data-testid="text-trx-balance">
              {parseFloat(trxBalance).toLocaleString()} TRX
            </div>
          </div>
        )}

        <Button
          variant="outline"
          onClick={onDisconnect}
          className="w-full"
          data-testid="button-disconnect-wallet"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect Wallet
        </Button>
      </CardContent>
    </Card>
  );
}
