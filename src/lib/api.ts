// Lightweight typed API client for fetching from route handlers

import type {
  Job, Payment, Task, Staff, WageRule, WageConfig, Lists, Metrics, Client,
  WageDistribution, WageCalculationResult, User, UserRole,
} from '@/lib/types';
import { useAppStore } from '@/lib/store';

/**
 * Custom error type for 401 responses. We use a dedicated class so that:
 *  1. React Query can identify it and skip retrying (no point retrying an
 *     unauthenticated request).
 *  2. Global error handlers can distinguish "session expired" from other
 *     errors and sign the user out gracefully without surfacing a noisy
 *     console error.
 */
export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    // Prevent this error from cluttering the console — it is expected and
    // handled by the global query error handler in QueryProvider.
    Object.defineProperty(this, 'silent', { value: true });
  }
}

/**
 * Sign the user out from the client side. Centralized here so that any 401
 * response — whether from a query or a mutation — triggers a single, clean
 * sign-out flow instead of throwing errors that surface in the console.
 */
function handleSessionExpired() {
  // Mark as not authenticated. The AuthGate will swap to the LoginView.
  // We deliberately do NOT call /api/auth/signout here — the session is
  // already invalid on the server, so we just clear local state.
  useAppStore.getState().setAuth(false);
}

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
  });
  if (!res.ok) {
    // 401 — session expired or not authenticated. Sign the user out
    // gracefully and throw a typed AuthenticationError so callers can
    // distinguish it from other failures.
    if (res.status === 401) {
      handleSessionExpired();
      throw new AuthenticationError();
    }
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Shared onError handler for useQuery / useMutation hooks.
 * Silently swallows AuthenticationError — the fetchJson helper already
 * called setAuth(false) on 401, so the AuthGate will swap to the LoginView.
 * Showing a "Authentication required" toast on top of that is just noise.
 *
 * Usage:
 *   useMutation({ ..., onError: toastApiError })
 */
export function toastApiError(error: Error) {
  if (error instanceof AuthenticationError) return;
  // Lazy-import sonner to avoid pulling it into the server bundle.
  import('sonner').then(({ toast }) => toast.error(error.message));
}

// ── Clients ───────────────────────────────────────────────────
export const clientsApi = {
  list: () => fetchJson<{ clients: (Client & { jobCount: number })[] }>('/api/clients').then(r => r.clients),
  create: (data: Partial<Client>) => fetchJson<{ client: Client }>('/api/clients', { method: 'POST', body: JSON.stringify(data) }).then(r => r.client),
  update: (id: string, changes: Partial<Client>) => fetchJson<{ client: Client }>(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(changes) }).then(r => r.client),
  remove: (id: string) => fetchJson(`/api/clients/${id}`, { method: 'DELETE' }),
};

// ── Jobs ──────────────────────────────────────────────────────
export const jobsApi = {
  list: () => fetchJson<{ jobs: Job[] }>('/api/jobs').then(r => r.jobs),
  get: (id: string) => fetchJson<{ job: Job; payments: Payment[]; tasks: Task[]; wageDistributions: WageDistribution[] }>(`/api/jobs/${id}`),
  create: (data: Partial<Job>) => fetchJson<{ job: Job }>('/api/jobs', { method: 'POST', body: JSON.stringify(data) }).then(r => r.job),
  update: (id: string, changes: Partial<Job>) => fetchJson<{ job: Job }>(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(changes) }).then(r => r.job),
  remove: (id: string) => fetchJson(`/api/jobs/${id}`, { method: 'DELETE' }),
};

// ── Payments ──────────────────────────────────────────────────
export const paymentsApi = {
  list: () => fetchJson<{ payments: Payment[] }>('/api/payments').then(r => r.payments),
  create: (data: Partial<Payment>) => fetchJson<{ payment: Payment }>('/api/payments', { method: 'POST', body: JSON.stringify(data) }).then(r => r.payment),
  update: (id: string, changes: Partial<Payment>) => fetchJson<{ payment: Payment }>(`/api/payments/${id}`, { method: 'PUT', body: JSON.stringify(changes) }).then(r => r.payment),
  remove: (id: string) => fetchJson(`/api/payments/${id}`, { method: 'DELETE' }),
};

// ── Tasks ─────────────────────────────────────────────────────
export const tasksApi = {
  list: () => fetchJson<{ tasks: Task[] }>('/api/tasks').then(r => r.tasks),
  create: (data: Partial<Task>) => fetchJson<{ task: Task }>('/api/tasks', { method: 'POST', body: JSON.stringify(data) }).then(r => r.task),
  update: (id: string, changes: Partial<Task>) => fetchJson<{ task: Task }>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(changes) }).then(r => r.task),
  remove: (id: string) => fetchJson(`/api/tasks/${id}`, { method: 'DELETE' }),
};

// ── Wages ─────────────────────────────────────────────────────
export const wagesApi = {
  list: () => fetchJson<{ wageDistributions: WageDistribution[] }>('/api/wages').then(r => r.wageDistributions),
  calculate: (jobId: string | null) =>
    fetchJson<{ result: WageCalculationResult }>(`/api/wages/calculate${jobId ? `?jobId=${encodeURIComponent(jobId)}` : ''}`).then(r => r.result),
  save: (data: Partial<WageDistribution>) => fetchJson<{ wageDistribution: WageDistribution }>('/api/wages', { method: 'POST', body: JSON.stringify(data) }).then(r => r.wageDistribution),
  remove: (id: string) => fetchJson(`/api/wages/${id}`, { method: 'DELETE' }),
};

// ── Settings ──────────────────────────────────────────────────
export interface SettingsBundle {
  lists: Lists;
  wageRules: WageRule[];
  staff: Staff[];
  wageConfig: WageConfig;
}
export const settingsApi = {
  get: () => fetchJson<SettingsBundle>('/api/settings'),
  update: (data: Partial<SettingsBundle>) => fetchJson('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Metrics ───────────────────────────────────────────────────
export const metricsApi = {
  get: () => fetchJson<{ metrics: Metrics }>('/api/metrics').then(r => r.metrics),
};

// ── Dashboard Preview (lightweight, take:5 recent jobs + metrics + charts) ──
export interface DashboardPreview {
  recentJobs: Job[];
  metrics: Metrics;
  statusDistribution: { name: string; value: number }[];
}
export const dashboardApi = {
  preview: () => fetchJson<DashboardPreview>('/api/dashboard-preview'),
};

// ── Backup ────────────────────────────────────────────────────
export const backupApi = {
  export: () => fetch('/api/backup/export').then(r => r.blob()),
  import: (data: any) => fetchJson('/api/backup/import', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Users (Admin) ─────────────────────────────────────────────
export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  password?: string | null;
  role?: UserRole;
}

export const usersApi = {
  list: () => fetchJson<{ users: User[] }>('/api/users').then(r => r.users),
  create: (data: UserCreateInput) =>
    fetchJson<{ user: User }>('/api/users', { method: 'POST', body: JSON.stringify(data) }).then(r => r.user),
  update: (id: string, changes: UserUpdateInput) =>
    fetchJson<{ user: User }>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(changes) }).then(r => r.user),
  remove: (id: string) => fetchJson(`/api/users/${id}`, { method: 'DELETE' }),
};
