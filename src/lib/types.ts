// Shared TypeScript types for Photography Client Management
// All domain types are centralized here — import from '@/lib/types' everywhere.

export type JobStatus =
  | 'Inquiry' | 'Booked' | 'Shot' | 'Editing'
  | 'Ready' | 'Delivered' | 'Completed' | 'Cancelled';

export type PaymentStatus = 'UNPAID' | 'Deposit-Paid' | 'PAID' | 'Refunded';

export type TaskStatus = 'OPEN' | 'IN PROGRESS' | 'WAITING' | 'DONE' | 'CANCELLED';

export type PaymentMethod =
  | 'Cash' | 'Bank Transfer' | 'QRIS' | 'E-wallet' | 'Card' | 'Other';

export type ClientSource =
  | 'WhatsApp' | 'Facebook' | 'Instagram' | 'Referral'
  | 'Returning Client' | 'Website' | 'Other';

export type JobType =
  | 'Wedding' | 'Engagement' | 'Company Event'
  | 'Portrait' | 'Family' | 'Product' | 'Other';

export interface Job {
  id: string;
  client: string;
  phone: string;
  jobType: string;
  jobDate: string; // ISO date string
  location: string;
  status: string;
  paymentStatus: string;
  totalFee: number;
  deposit: number;
  balance: number;
  photographers: string;
  editors: string;
  clientSource: string;
  notes: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  jobId: string | null;
  client: string;
  paymentDate: string;
  amount: number;
  method: string;
  status: string;
  jobTotalFee: number;
  jobBalance: number;
  notes: string;
  createdAt: string;
}

export interface Task {
  id: string;
  jobId: string | null;
  client: string;
  task: string;
  dueDate: string;
  status: string;
  notes: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  primaryRole: string;
  phone: string;
  notes: string;
  roles: string[]; // wage-role names
  sortOrder: number;
}

export interface WageRule {
  id: string;
  role: string;
  percentage: number; // 0-1
  sortOrder: number;
}

export interface WageConfig {
  distributableRatio: number; // legacy fallback, default 0.625
  defaultExpenses: OperationalExpense[];
}

export interface OperationalExpense {
  name: string;
  amount: number;
}

export interface WageBreakdownItem {
  staffName: string;
  role: string;
  roles: string[];
  percentage: number; // sum of role percentages, 0-1
  amount: number;
}

export interface WageDistribution {
  id: string;
  jobId: string | null;
  grossAmount: number;
  distributableBase: number;
  totalPaid: number;
  breakdown: WageBreakdownItem[];
  operationalExpenses: OperationalExpense[];
  notes: string;
  createdAt: string;
}

export interface WageCalculationResult {
  jobId: string | null;
  grossAmount: number;
  totalPaid: number;
  operationalExpenses: OperationalExpense[];
  totalExpenses: number;
  distributableBase: number;
  breakdown: WageBreakdownItem[];
  totalCheck: number; // sum of breakdown amounts (should equal distributableBase)
  isVerified: boolean;
}

export interface Lists {
  jobStatuses: string[];
  paymentStatuses: string[];
  clientSources: string[];
  jobTypes: string[];
  taskStatuses: string[];
  paymentMethods: string[];
}

export interface Metrics {
  activeJobs: number;
  upcomingActiveJobs: number;
  jobsInEditing: number;
  outstandingBalance: number;
  openTasks: number;
  overdueOpenTasks: number;
  totalWageRecords: number;
  totalWagesCalculated: number;
}

/** Top-level navigation views. Drives the active-view state in the Zustand store. */
export type ViewKey =
  | 'dashboard' | 'jobs' | 'payments' | 'tasks' | 'wages' | 'settings';
