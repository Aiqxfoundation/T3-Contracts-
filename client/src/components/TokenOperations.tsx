import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  transferTokenSchema,
  mintTokenSchema,
  burnTokenSchema,
  type TransferTokenParams,
  type MintTokenParams,
  type BurnTokenParams,
  type Token,
  type Network,
} from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Send, Plus, Flame, Loader2, ArrowLeft, AlertTriangle } from "lucide-react";

interface TokenOperationsProps {
  token: Token;
  onTransfer: (params: TransferTokenParams) => void;
  onMint: (params: MintTokenParams) => void;
  onBurn: (params: BurnTokenParams) => void;
  onBack: () => void;
  isProcessing: boolean;
  network: Network;
}

export function TokenOperations({ token, onTransfer, onMint, onBurn, onBack, isProcessing, network }: TokenOperationsProps) {
  const [activeTab, setActiveTab] = useState("transfer");

  const transferForm = useForm<TransferTokenParams>({
    resolver: zodResolver(transferTokenSchema),
    defaultValues: {
      tokenAddress: token.contractAddress,
      toAddress: "",
      amount: "",
    },
  });

  const mintForm = useForm<MintTokenParams>({
    resolver: zodResolver(mintTokenSchema),
    defaultValues: {
      tokenAddress: token.contractAddress,
      amount: "",
    },
  });

  const burnForm = useForm<BurnTokenParams>({
    resolver: zodResolver(burnTokenSchema),
    defaultValues: {
      tokenAddress: token.contractAddress,
      amount: "",
    },
  });

  // Reset forms when token changes
  useEffect(() => {
    transferForm.reset({
      tokenAddress: token.contractAddress,
      toAddress: "",
      amount: "",
    });
    mintForm.reset({
      tokenAddress: token.contractAddress,
      amount: "",
    });
    burnForm.reset({
      tokenAddress: token.contractAddress,
      amount: "",
    });
  }, [token.contractAddress]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          data-testid="button-back-to-tokens"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tokens
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{token.name}</CardTitle>
              <CardDescription className="mt-1">
                <span className="font-mono">{token.symbol}</span> • {token.decimals} decimals
              </CardDescription>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Contract Address</p>
              <code className="text-sm font-mono break-all">{token.contractAddress}</code>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Token Owner (Authority)</p>
              <code className="text-sm font-mono break-all">{token.deployerAddress}</code>
              <p className="text-xs text-muted-foreground mt-2">
                Only the owner can mint and burn tokens
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Total Supply</p>
              <p className="text-lg font-semibold">{parseFloat(token.totalSupply).toLocaleString()} {token.symbol}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transfer" data-testid="tab-transfer">
            <Send className="w-4 h-4 mr-2" />
            Transfer
          </TabsTrigger>
          <TabsTrigger value="mint" data-testid="tab-mint">
            <Plus className="w-4 h-4 mr-2" />
            Mint
          </TabsTrigger>
          <TabsTrigger value="burn" data-testid="tab-burn">
            <Flame className="w-4 h-4 mr-2" />
            Burn
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transfer" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Tokens</CardTitle>
              <CardDescription>Send tokens to another address</CardDescription>
            </CardHeader>
            <CardContent>
              {network === 'mainnet' && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>MAINNET Warning:</strong> This operation uses real TRX for fees and cannot be undone. Verify the recipient address carefully.
                  </AlertDescription>
                </Alert>
              )}
              <Form {...transferForm}>
                <form onSubmit={transferForm.handleSubmit(onTransfer)} className="space-y-4">
                  <FormField
                    control={transferForm.control}
                    name="toAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="TRx..."
                            className="font-mono"
                            {...field}
                            data-testid="input-transfer-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={transferForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0.00"
                            {...field}
                            data-testid="input-transfer-amount"
                          />
                        </FormControl>
                        <FormDescription>Amount of {token.symbol} to transfer</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isProcessing} data-testid="button-submit-transfer">
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Transfer Tokens
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mint" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Mint Tokens</CardTitle>
              <CardDescription>Create new tokens and add to total supply</CardDescription>
            </CardHeader>
            <CardContent>
              {network === 'mainnet' && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>MAINNET Warning:</strong> This operation uses real TRX for fees and permanently increases token supply.
                  </AlertDescription>
                </Alert>
              )}
              <Form {...mintForm}>
                <form onSubmit={mintForm.handleSubmit(onMint)} className="space-y-4">
                  <FormField
                    control={mintForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0.00"
                            {...field}
                            data-testid="input-mint-amount"
                          />
                        </FormControl>
                        <FormDescription>Amount of {token.symbol} to mint</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isProcessing} data-testid="button-submit-mint">
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Mint Tokens
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="burn" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Burn Tokens</CardTitle>
              <CardDescription className="text-destructive">
                Permanently destroy tokens and reduce total supply
              </CardDescription>
            </CardHeader>
            <CardContent>
              {network === 'mainnet' && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>MAINNET Warning:</strong> This operation uses real TRX for fees and permanently destroys tokens. This action CANNOT be undone.
                  </AlertDescription>
                </Alert>
              )}
              <Form {...burnForm}>
                <form onSubmit={burnForm.handleSubmit(onBurn)} className="space-y-4">
                  <FormField
                    control={burnForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0.00"
                            {...field}
                            data-testid="input-burn-amount"
                          />
                        </FormControl>
                        <FormDescription>Amount of {token.symbol} to burn</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    variant="destructive"
                    className="w-full"
                    disabled={isProcessing}
                    data-testid="button-submit-burn"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Flame className="w-4 h-4 mr-2" />
                        Burn Tokens
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
