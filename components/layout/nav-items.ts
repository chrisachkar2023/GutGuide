import { ChefHat, Home, MapPin, ScanLine, Search, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/search", label: "Search", icon: Search },
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/near-you", label: "Near you", icon: MapPin },
  { href: "/cook", label: "Cook", icon: ChefHat },
  { href: "/progress", label: "Progress", icon: TrendingUp },
];
