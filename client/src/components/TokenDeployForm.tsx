import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { deployTokenSchema, type DeployTokenParams, type Network } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Rocket, Loader2, AlertTriangle, DollarSign } from "lucide-react";

interface TokenDeployFormProps {
  onDeploy: (params: DeployTokenParams) => void;
  isDeploying: boolean;
  network: Network;
  trxBalance?: string;
}

export function TokenDeployForm({ onDeploy, isDeploying, network, trxBalance }: TokenDeployFormProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [feeEstimate, setFeeEstimate] = useState<{
    energyRequired: number;
    bandwidthRequired: number;
    estimatedTrxCost: string;
    estimatedUsdCost: string;
  } | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [pendingDeployData, setPendingDeployData] = useState<DeployTokenParams | null>(null);

  const form = useForm<DeployTokenParams>({
    resolver: zodResolver(deployTokenSchema),
    defaultValues: {
      name: "",
      symbol: "",
      decimals: 6,
      initialSupply: "",
    },
  });

  const formValues = form.watch();

  const handleFormSubmit = (data: DeployTokenParams) => {
    // Show confirmation dialog - fees will be fetched when user confirms
    setPendingDeployData(data);
    setFeeEstimate(null); // Clear any previous fee estimates
    setShowConfirmDialog(true);
  };

  const handleConfirmDeploy = async () => {
    if (!pendingDeployData) return;
    
    // Fetch real blockchain fees ONLY when user confirms deployment
    setIsEstimating(true);
    
    try {
      const response = await fetch('/api/tokens/estimate-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingDeployData),
      });
      
      if (response.ok) {
        const feeData = await response.json();
        setFeeEstimate(feeData);
        
        // Check if user has sufficient balance
        if (trxBalance && parseFloat(trxBalance) < parseFloat(feeData.estimatedTrxCost)) {
          // Show error but keep dialog open so user sees the fee
          setIsEstimating(false);
          return;
        }
        
        // Sufficient balance - proceed with deployment
        setShowConfirmDialog(false);
        onDeploy(pendingDeployData);
      }
    } catch (error) {
      console.error('Failed to estimate fee:', error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleCancelDeploy = () => {
    setShowConfirmDialog(false);
    setPendingDeployData(null);
    setFeeEstimate(null);
  };

  const hasSufficientBalance = () => {
    if (!trxBalance || !feeEstimate) return true;
    return parseFloat(trxBalance) >= parseFloat(feeEstimate.estimatedTrxCost);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Deploy New Token
          </CardTitle>
          <CardDescription>
            Create and deploy a new TRC-20 token to the {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {network === 'mainnet' && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> You are deploying to MAINNET. This will use real TRX and cannot be undone. Double-check all parameters before proceeding.
              </AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="My Token"
                          {...field}
                          data-testid="input-token-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="MTK"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          data-testid="input-token-symbol"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="decimals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decimals</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="18"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-token-decimals"
                        />
                      </FormControl>
                      <FormDescription>Usually 6 or 18</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="initialSupply"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Supply</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1000000"
                          {...field}
                          data-testid="input-token-supply"
                        />
                      </FormControl>
                      <FormDescription>Total tokens to mint</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isDeploying}
                data-testid="button-deploy-token"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploying Token...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Deploy Token
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Review your token configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="font-medium" data-testid="text-preview-name">
                {formValues.name || "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Symbol</span>
              <span className="font-medium font-mono" data-testid="text-preview-symbol">
                {formValues.symbol || "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Decimals</span>
              <span className="font-medium" data-testid="text-preview-decimals">
                {formValues.decimals}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Initial Supply</span>
              <span className="font-medium" data-testid="text-preview-supply">
                {formValues.initialSupply ? parseFloat(formValues.initialSupply).toLocaleString() : "—"}
              </span>
            </div>
          </div>

          {formValues.name && formValues.symbol && formValues.initialSupply && (
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Ready to Deploy</p>
              <p className="text-lg font-semibold">
                {formValues.name} ({formValues.symbol})
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Initial Supply: {parseFloat(formValues.initialSupply).toLocaleString()} {formValues.symbol}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Click "Deploy Token" to see blockchain fees and confirm deployment
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Token Deployment</DialogTitle>
            <DialogDescription>
              {network === 'mainnet' 
                ? "⚠️ You are deploying to MAINNET with real TRX. Review the blockchain fees below."
                : "Review the blockchain fees for testnet deployment below."}
            </DialogDescription>
          </DialogHeader>

          {pendingDeployData && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-semibold">Token Details</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{pendingDeployData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Symbol:</span>
                    <span className="font-medium">{pendingDeployData.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supply:</span>
                    <span className="font-medium">{parseFloat(pendingDeployData.initialSupply).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {!feeEstimate && !isEstimating && (
                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
                  Click "Confirm & Deploy" to calculate blockchain fees and proceed with deployment
                </div>
              )}

              {isEstimating && (
                <div className="p-4 bg-muted rounded-lg flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Calculating blockchain fees...</span>
                </div>
              )}

              {feeEstimate && (
                <>
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <p className="text-sm font-semibold">Blockchain Deployment Fees</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Energy Required:</span>
                        <span className="font-medium">{feeEstimate.energyRequired.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bandwidth Required:</span>
                        <span className="font-medium">{feeEstimate.bandwidthRequired.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">TRX Cost:</span>
                        <span className="font-bold text-lg">{feeEstimate.estimatedTrxCost} TRX</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">USD Cost:</span>
                        <span className="font-medium">${feeEstimate.estimatedUsdCost}</span>
                      </div>
                    </div>
                    {trxBalance && (
                      <div className={`flex justify-between pt-2 border-t ${hasSufficientBalance() ? 'text-chart-2' : 'text-destructive'}`}>
                        <span className="text-sm">Your Balance:</span>
                        <span className="font-semibold">{parseFloat(trxBalance).toFixed(2)} TRX</span>
                      </div>
                    )}
                  </div>

                  {!hasSufficientBalance() && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Insufficient balance. You need {feeEstimate.estimatedTrxCost} TRX but have {trxBalance || '0'} TRX.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded">
                    ✓ Platform Fee: 0% (No additional charges)
                    <br />
                    ✓ You only pay blockchain network fees
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCancelDeploy}
              disabled={isDeploying}
              data-testid="button-cancel-deploy"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDeploy}
              disabled={isDeploying || isEstimating || !hasSufficientBalance()}
              data-testid="button-confirm-deploy"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>Confirm & Deploy</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
