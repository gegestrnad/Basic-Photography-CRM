'use client';

import { useQuery } from '@tanstack/react-query';
import { metricsApi, jobsApi, paymentsApi, tasksApi, wagesApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useLang } from '@/components/language-provider';
import { PageHeader, SectionTitle } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, jobStatusColor, paymentStatusColor } from '@/lib/format';
import {
  Briefcase, CalendarClock, Scissors, AlertCircle, CheckSquare, AlertTriangle,
  Wallet, CheckSquare2, Calculator, ArrowRight, TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { ViewKey } from '@/lib/types';

export function DashboardView() {
  const setView = useAppStore(s => s.setView);
  const { t, lang } = useLang();
  const { data: metrics } = useQuery({ queryKey: ['metrics'], queryFn: metricsApi.get });
  const { data: jobs } = useQuery({ queryKey: ['jobs'], queryFn: jobsApi.list });
  const { data: payments } = useQuery({ queryKey: ['payments'], queryFn: paymentsApi.list });
  const { data: tasks } = useQuery({ queryKey: ['tasks'], queryFn: tasksApi.list });
  const { data: wages } = useQuery({ queryKey: ['wages'], queryFn: wagesApi.list });

  const today = new Date();
  const todayLabel = today.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const m = metrics || {
    activeJobs: 0, upcomingActiveJobs: 0, jobsInEditing: 0, outstandingBalance: 0,
    openTasks: 0, overdueOpenTasks: 0, totalWageRecords: 0, totalWagesCalculated: 0,
  };

  // ── Revenue trend (last 6 months) ──
  const revenueByMonth = (() => {
    const months: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short' });
      const value = (payments || [])
        .filter(p => p.status === 'PAID')
        .filter(p => {
          const pd = new Date(p.paymentDate);
          return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
        })
        .reduce((s, p) => s + p.amount, 0);
      months.push({ label, value });
    }
    return months;
  })();

  // ── Job status distribution ──
  const statusDistribution = (() => {
    const counts: Record<string, number> = {};
    (jobs || []).forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const STATUS_COLORS: Record<string, string> = {
    'Inquiry':   '#3b82f6',
    'Booked':    '#a855f7',
    'Shot':      '#f59e0b',
    'Editing':   '#d946ef',
    'Ready':     '#10b981',
    'Delivered': '#0ea5e9',
    'Completed': '#22c55e',
    'Cancelled': '#ef4444',
  };

  const workflow = ['Inquiry','Booked','Shot','Editing','Ready','Delivered','Completed'];

  const metricCards = [
    { label: t.dash_activeJobs,      value: m.activeJobs,                  icon: Briefcase,     color: 'text-emerald-500', zero: 'text-muted-foreground' },
    { label: t.dash_upcomingActive,  value: m.upcomingActiveJobs,           icon: CalendarClock, color: 'text-blue-500',     zero: 'text-muted-foreground' },
    { label: t.dash_inEditing,       value: m.jobsInEditing,                icon: Scissors,      color: 'text-fuchsia-500',  zero: 'text-muted-foreground' },
    { label: t.dash_outstandingBal,  value: formatCurrency(m.outstandingBalance), icon: AlertCircle, color: 'text-red-500', zero: 'text-muted-foreground' },
    { label: t.dash_openTasks,       value: m.openTasks,                    icon: CheckSquare,   color: 'text-blue-500',     zero: 'text-muted-foreground' },
    { label: t.dash_overdueTasks,    value: m.overdueOpenTasks,             icon: AlertTriangle, color: 'text-red-500',      zero: 'text-muted-foreground' },
  ];

  const quickLinks: { view: ViewKey; label: string; count: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { view: 'jobs',     label: t.nav_jobs,         count: t.jobs_count(jobs?.length ?? 0),           icon: Briefcase },
    { view: 'jobs',     label: t.dash_editingQueue, count: t.jobs_count(m.jobsInEditing),            icon: Scissors },
    { view: 'payments', label: t.nav_payments,     count: t.pay_count(payments?.length ?? 0),         icon: Wallet },
    { view: 'tasks',    label: t.dash_openTasksCount, count: `${m.openTasks} ${lang === 'id' ? 'terbuka' : 'open'}`, icon: CheckSquare2 },
    { view: 'wages',    label: t.nav_wages,        count: `${m.totalWageRecords} ${lang === 'id' ? 'distribusi' : 'distribution'}${m.totalWageRecords !== 1 ? 's' : ''}`, icon: Calculator },
  ];

  return (
    <div>
      <PageHeader title={t.dash_title} subtitle={todayLabel} />

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {metricCards.map(mc => {
          const Icon = mc.icon;
          const isZero = typeof mc.value === 'number' && mc.value === 0;
          const isZeroCurrency = typeof mc.value === 'string' && mc.value === 'Rp0';
          return (
            <Card key={mc.label}>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Icon className={`size-5 mb-2 ${isZero || isZeroCurrency ? mc.zero : mc.color}`} />
                <div className={`text-xl md:text-2xl font-bold leading-none tabular-nums break-all ${isZero || isZeroCurrency ? mc.zero : mc.color}`}>
                  {mc.value}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">
                  {mc.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Quick Links ── */}
      <SectionTitle>{t.dash_quickViews}</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {quickLinks.map((q, idx) => {
          const Icon = q.icon;
          return (
            <button
              key={idx}
              onClick={() => setView(q.view)}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-center"
            >
              <Icon className="size-5 text-primary" />
              <div className="text-sm font-medium">{q.label}</div>
              <div className="text-xs text-muted-foreground">{q.count}</div>
            </button>
          );
        })}
      </div>

      {/* ── Charts ── */}
      <SectionTitle>{t.dash_analytics}</SectionTitle>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" />
              {t.dash_revenueChart}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueByMonth} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c6ff0" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#7c6ff0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="label" stroke="rgba(128,128,128,0.6)" fontSize={11} />
                <YAxis stroke="rgba(128,128,128,0.6)" fontSize={11} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`} />
                <Tooltip
                  contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Area type="monotone" dataKey="value" stroke="#7c6ff0" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.dash_statusChart}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">{t.dash_noJobs}</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45}>
                    {statusDistribution.map((s, i) => (
                      <Cell key={i} fill={STATUS_COLORS[s.name] || '#888'} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Workflow ── */}
      <SectionTitle>{t.dash_workflow}</SectionTitle>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {workflow.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${jobStatusColor(s)}`}>
                  {s}
                </span>
                {i < workflow.length - 1 && <ArrowRight className="size-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Recent Jobs ── */}
      <SectionTitle>{t.dash_recentJobs}</SectionTitle>
      <div className="space-y-2">
        {(jobs || []).slice(0, 5).map(job => (
          <button
            key={job.id}
            onClick={() => setView('jobs')}
            className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate">{job.client}</div>
              <div className="text-xs text-muted-foreground truncate">
                {job.jobType} · {formatDate(job.jobDate, lang)}{job.location ? ` · ${job.location}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${paymentStatusColor(job.paymentStatus)}`}>
                {job.paymentStatus}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${jobStatusColor(job.status)}`}>
                {job.status}
              </span>
            </div>
          </button>
        ))}
        {(jobs || []).length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground">{t.dash_noJobs}</div>
        )}
      </div>
    </div>
  );
}
