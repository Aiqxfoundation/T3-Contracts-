import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
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
import { Rocket, Loader2, AlertTriangle, DollarSign } from "lucide-react";

interface TokenDeployFormProps {
  onDeploy: (params: DeployTokenParams) => void;
  isDeploying: boolean;
  network: Network;
  trxBalance?: string;
}

export function TokenDeployForm({ onDeploy, isDeploying, network, trxBalance }: TokenDeployFormProps) {
  const [feeEstimate, setFeeEstimate] = useState<{
    energyRequired: number;
    bandwidthRequired: number;
    estimatedTrxCost: string;
    estimatedUsdCost: string;
  } | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const form = useForm<DeployTokenParams>({
    resolver: zodResolver(deployTokenSchema),
    defaultValues: {
      name: "",
      symbol: "",
      decimals: 6,
      initialSupply: "",
    },
  });

  const onSubmit = (data: DeployTokenParams) => {
    onDeploy(data);
  };

  const formValues = form.watch();

  // Fetch fee estimate when form values change
  useEffect(() => {
    const fetchFeeEstimate = async () => {
      if (formValues.name && formValues.symbol && formValues.initialSupply) {
        setIsEstimating(true);
        try {
          const response = await fetch('/api/tokens/estimate-fee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formValues),
          });
          if (response.ok) {
            const data = await response.json();
            setFeeEstimate(data);
          }
        } catch (error) {
          console.error('Failed to estimate fee:', error);
        } finally {
          setIsEstimating(false);
        }
      } else {
        setFeeEstimate(null);
      }
    };

    const debounce = setTimeout(fetchFeeEstimate, 500);
    return () => clearTimeout(debounce);
  }, [formValues.name, formValues.symbol, formValues.decimals, formValues.initialSupply]);

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              {feeEstimate && !hasSufficientBalance() && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient balance. You need {feeEstimate.estimatedTrxCost} TRX but have {trxBalance || '0'} TRX.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isDeploying || !hasSufficientBalance()}
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

          {feeEstimate && (
            <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-semibold">Estimated Deployment Cost</p>
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
                  <span className="text-muted-foreground">Estimated TRX Cost:</span>
                  <span className="font-bold text-lg">{feeEstimate.estimatedTrxCost} TRX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated USD Cost:</span>
                  <span className="font-medium">${feeEstimate.estimatedUsdCost}</span>
                </div>
              </div>
              {trxBalance && (
                <div className={`flex justify-between pt-2 border-t ${hasSufficientBalance() ? 'text-chart-2' : 'text-destructive'}`}>
                  <span className="text-sm">Your TRX Balance:</span>
                  <span className="font-semibold">{parseFloat(trxBalance).toFixed(2)} TRX</span>
                </div>
              )}
            </div>
          )}

          {isEstimating && (
            <div className="mt-6 p-4 bg-muted rounded-lg flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Calculating deployment cost...</span>
            </div>
          )}

          {formValues.name && formValues.symbol && formValues.initialSupply && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Final Token</p>
              <p className="text-lg font-semibold">
                {formValues.name} ({formValues.symbol})
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supply: {parseFloat(formValues.initialSupply).toLocaleString()} {formValues.symbol}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
