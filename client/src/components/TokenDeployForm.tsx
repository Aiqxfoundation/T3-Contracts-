import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deployTokenSchema, type DeployTokenParams } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Rocket, Loader2 } from "lucide-react";

interface TokenDeployFormProps {
  onDeploy: (params: DeployTokenParams) => void;
  isDeploying: boolean;
}

export function TokenDeployForm({ onDeploy, isDeploying }: TokenDeployFormProps) {
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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Deploy New Token
          </CardTitle>
          <CardDescription>
            Create and deploy a new TRC-20 token to the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
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
