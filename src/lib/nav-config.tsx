// Single source of truth for navigation items.
// Used by both the desktop Sidebar and the mobile MobileNav.
import { LayoutDashboard, Briefcase, Wallet, CheckSquare, Calculator, Users, Settings } from 'lucide-react';
import type { ViewKey } from '@/lib/types';

export interface NavItem {
  key: ViewKey;
  labelKey: 'nav_dashboard' | 'nav_jobs' | 'nav_payments' | 'nav_tasks' | 'nav_wages' | 'nav_clients' | 'nav_settings';
  icon: React.ComponentType<{ className?: string }>;
  /** Shown in the mobile bottom nav (5-slot grid). When false, only appears in desktop sidebar. */
  mobile: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', labelKey: 'nav_dashboard', icon: LayoutDashboard, mobile: true },
  { key: 'jobs',      labelKey: 'nav_jobs',      icon: Briefcase,       mobile: true },
  { key: 'payments',  labelKey: 'nav_payments',  icon: Wallet,          mobile: true },
  { key: 'tasks',     labelKey: 'nav_tasks',     icon: CheckSquare,     mobile: true },
  { key: 'wages',     labelKey: 'nav_wages',     icon: Calculator,      mobile: false },
  { key: 'clients',   labelKey: 'nav_clients',   icon: Users,           mobile: false },
  { key: 'settings',  labelKey: 'nav_settings',  icon: Settings,        mobile: false },
];
