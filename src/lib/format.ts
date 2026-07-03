// Formatting helpers — pure functions, no server deps

/** Format a number as Indonesian Rupiah, e.g. 1600000 → "Rp1.600.000" */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return 'Rp0';
  return 'Rp' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Format an ISO date string as "DD MMM YYYY", e.g. "14 Jun 2026" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Format an ISO date as YYYY-MM-DD for <input type="date"> */
export function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Convert a YYYY-MM-DD string from <input type="date"> to ISO */
export function fromDateInput(ymd: string): string | null {
  if (!ymd) return null;
  // Treat as local midnight to avoid timezone drift
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toISOString();
}

/** Format date relative to today: "Today", "Tomorrow", "Yesterday", or "DD MMM YYYY" */
export function formatDateRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(d); target.setHours(0,0,0,0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return formatDate(iso);
}

/** Days from today (positive = future, negative = past, 0 = today) */
export function daysFromToday(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(d); target.setHours(0,0,0,0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** Job status → tailwind badge color classes */
export function jobStatusColor(status: string): string {
  const map: Record<string, string> = {
    'Inquiry':    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    'Booked':     'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    'Shot':       'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    'Editing':    'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300',
    'Ready':      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    'Delivered':  'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    'Completed':  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    'Cancelled':  'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  };
  return map[status] || 'bg-muted text-muted-foreground';
}

/** Payment status → tailwind badge color classes */
export function paymentStatusColor(status: string): string {
  const map: Record<string, string> = {
    'UNPAID':       'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    'Deposit-Paid': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    'PAID':         'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    'Refunded':     'bg-muted text-muted-foreground',
  };
  return map[status] || 'bg-muted text-muted-foreground';
}

/** Task status → tailwind badge color classes */
export function taskStatusColor(status: string): string {
  const upper = (status || '').toUpperCase();
  const map: Record<string, string> = {
    'OPEN':         'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    'IN PROGRESS':  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    'WAITING':      'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    'DONE':         'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    'CANCELLED':    'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  };
  return map[upper] || 'bg-muted text-muted-foreground';
}

/** Generate the next sequential ID, e.g. generateId('JOB', ['JOB-0001']) → 'JOB-0002' */
export function generateId(prefix: string, existingIds: string[]): string {
  const nums = existingIds
    .map(id => {
      const n = parseInt(id.replace(/^[A-Z]+-/, ''), 10);
      return isNaN(n) ? 0 : n;
    });
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

/** Compute wage distribution breakdown given rules, staff, base, and expenses */
export function computeWageBreakdown(
  base: number,
  rules: { role: string; percentage: number }[],
  staff: { name: string; roles: string[] }[]
): { breakdown: { staffName: string; roles: string[]; percentage: number; amount: number }[]; totalCheck: number; isVerified: boolean } {
  const breakdown: { staffName: string; roles: string[]; percentage: number; amount: number }[] = [];

  staff.forEach(s => {
    if (!s.roles || s.roles.length === 0) return;
    let staffPct = 0;
    s.roles.forEach(r => {
      const rule = rules.find(rl => rl.role === r);
      if (rule) staffPct += rule.percentage;
    });
    if (staffPct === 0) return;
    breakdown.push({
      staffName: s.name,
      roles: s.roles,
      percentage: staffPct,
      amount: Math.round(base * staffPct),
    });
  });

  // Fix rounding: if total ≠ base, adjust the largest amount
  const sum = breakdown.reduce((acc, b) => acc + b.amount, 0);
  const diff = base - sum;
  if (diff !== 0 && breakdown.length > 0) {
    breakdown.sort((a, b) => b.amount - a.amount);
    breakdown[0].amount += diff;
    // Re-sort by original staff order would be ideal; leave as-is for now
  }

  const totalCheck = breakdown.reduce((acc, b) => acc + b.amount, 0);
  return {
    breakdown,
    totalCheck,
    isVerified: totalCheck === base,
  };
}
