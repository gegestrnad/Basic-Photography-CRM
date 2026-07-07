'use client';

import { useAppStore } from '@/lib/store';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Briefcase, Wallet, CheckSquare, Calculator, Users, FileText, Inbox, Plus } from 'lucide-react';
import type { ViewKey } from '@/lib/types';

interface EmptyStateProps {
  /** Which view the empty state is for — drives the illustration + CTA */
  view: 'jobs' | 'payments' | 'tasks' | 'wages' | 'clients' | 'generic';
  /** Custom message (overrides the default per-view message) */
  message?: string;
  /** Hide the CTA button */
  hideCta?: boolean;
  /** Custom CTA label (overrides the default per-view label) */
  ctaLabel?: string;
  /** CTA click handler — if provided, uses this; otherwise navigates to the relevant view */
  onCta?: () => void;
}

export function EmptyState({ view, message, hideCta, ctaLabel, onCta }: EmptyStateProps) {
  const setView = useAppStore(s => s.setView);
  const { t } = useLang();

  const config = {
    jobs: {
      icon: Briefcase,
      defaultMsg: t.jobs_empty + '. ' + (useLang().lang === 'id' ? 'Tambahkan pekerjaan pertama Anda untuk mulai melacak.' : 'Add your first job to start tracking.'),
      cta: t.jobs_new,
      targetView: 'jobs' as ViewKey,
      gradient: 'from-violet-500/20 to-purple-500/10',
    },
    payments: {
      icon: Wallet,
      defaultMsg: useLang().lang === 'id' ? 'Belum ada catatan pembayaran. Catat pembayaran pertama untuk melacak saldo.' : 'No payment records yet. Record your first payment to track balances.',
      cta: t.pay_new,
      targetView: 'payments' as ViewKey,
      gradient: 'from-emerald-500/20 to-teal-500/10',
    },
    tasks: {
      icon: CheckSquare,
      defaultMsg: useLang().lang === 'id' ? 'Tidak ada tugas. Buat tugas untuk mengingatkan pekerjaan yang perlu diselesaikan.' : 'No tasks yet. Create a task to remind yourself of work that needs doing.',
      cta: t.task_new,
      targetView: 'tasks' as ViewKey,
      gradient: 'from-blue-500/20 to-cyan-500/10',
    },
    wages: {
      icon: Calculator,
      defaultMsg: useLang().lang === 'id' ? 'Belum ada distribusi upah. Pilih pekerjaan di kalkulator untuk menghitung dan menyimpan distribusi.' : 'No wage distributions saved yet. Select a job in the calculator above to compute and save a distribution.',
      cta: null,
      targetView: 'wages' as ViewKey,
      gradient: 'from-amber-500/20 to-orange-500/10',
    },
    clients: {
      icon: Users,
      defaultMsg: useLang().lang === 'id' ? 'Belum ada klien. Tambahkan klien pertama untuk mulai menautkannya ke pekerjaan.' : 'No clients yet. Add your first client to start linking them to jobs.',
      cta: t.client_new,
      targetView: 'clients' as ViewKey,
      gradient: 'from-cyan-500/20 to-blue-500/10',
    },
    generic: {
      icon: Inbox,
      defaultMsg: message || 'Nothing here yet.',
      cta: null,
      targetView: 'dashboard' as ViewKey,
      gradient: 'from-muted to-muted/50',
    },
  }[view];

  const Icon = config.icon;
  const displayMsg = message || config.defaultMsg;
  const displayCta = ctaLabel || config.cta;

  return (
    <div className="text-center py-12 px-4">
      <div className={`inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br ${config.gradient} mb-4`}>
        <Icon className="size-8 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">{displayMsg}</p>
      {!hideCta && displayCta && (
        <Button onClick={() => onCta ? onCta() : setView(config.targetView)} size="sm">
          <Plus className="size-4 mr-1" />
          {displayCta}
        </Button>
      )}
    </div>
  );
}

/** Smaller empty state for inline sections (no big illustration, just icon + text) */
export function InlineEmpty({ icon: Icon = FileText, message }: { icon?: React.ComponentType<{ className?: string }>; message: string }) {
  return (
    <div className="text-center py-10">
      <Icon className="size-8 mx-auto mb-2 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
