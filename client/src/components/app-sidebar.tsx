import { Home, Rocket, Settings, Coins, History } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { NetworkSwitcher } from "./NetworkSwitcher";
import { Network } from "@shared/schema";

interface AppSidebarProps {
  currentNetwork: Network;
  onNetworkChange: (network: Network) => void;
}

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Deploy Token",
    url: "/deploy",
    icon: Rocket,
  },
  {
    title: "Manage Tokens",
    url: "/manage",
    icon: Coins,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: History,
  },
];

export function AppSidebar({ currentNetwork, onNetworkChange }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Coins className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold">TRON Token</h2>
            <p className="text-xs text-muted-foreground">Manager</p>
          </div>
        </div>
        <NetworkSwitcher
          currentNetwork={currentNetwork}
          onNetworkChange={onNetworkChange}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <p className="text-xs text-muted-foreground text-center">
          TRC-20 Token Management Tool
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
