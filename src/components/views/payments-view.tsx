'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, jobsApi } from '@/lib/api';
import { useSettings } from '@/components/settings-provider';
import { useLang } from '@/components/language-provider';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, CreditCard, Wallet } from 'lucide-react';
import { formatCurrency, formatDate, paymentStatusColor, toDateInput, fromDateInput } from '@/lib/format';
import { toast } from 'sonner';
import type { Payment, Job } from '@/lib/types';

export function PaymentsView() {
  const qc = useQueryClient();
  const { t, lang } = useLang();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: paymentsApi.list });

  const totalCollected = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const pendingCount = payments.filter(p => p.status !== 'PAID' && p.status !== 'Refunded').length;
  const uniqueClients = new Set(payments.map(p => p.client)).size;

  const detail = payments.find(p => p.id === detailId) || null;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.remove(id),
    onSuccess: () => {
      toast.success(t.pay_deleted);
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['metrics'] });
      setDeleteId(null);
      setDetailId(null);
    },
  });

  return (
    <div>
      <PageHeader
        title={t.pay_title}
        subtitle={t.pay_count(payments.length)}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} size="sm">
            <Plus className="size-4 mr-1" /> {t.pay_new}
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-base sm:text-xl md:text-2xl font-bold text-emerald-500 tabular-nums break-all leading-tight">{formatCurrency(totalCollected)}</div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{t.pay_collected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className={`text-base sm:text-xl md:text-2xl font-bold tabular-nums ${pendingCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>{pendingCount}</div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{t.pay_pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-base sm:text-xl md:text-2xl font-bold text-primary tabular-nums">{uniqueClients}</div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{t.pay_clients}</div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="space-y-2">
        {payments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-2 opacity-50">💰</div>
            <p className="text-sm text-muted-foreground">{t.pay_empty}</p>
          </div>
        ) : (
          payments.map(p => (
            <button
              key={p.id}
              onClick={() => setDetailId(p.id)}
              className="w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{p.client}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.id} · {formatDate(p.paymentDate, lang)}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${paymentStatusColor(p.status)}`}>
                  {p.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CreditCard className="size-3" />{p.method}</span>
                <span className="flex items-center gap-1"><Wallet className="size-3" />{formatCurrency(p.amount)}</span>
                {p.jobId && <span className="text-xs opacity-70">{p.jobId}</span>}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>{detail.client}</SheetTitle>
                <SheetDescription>{detail.id}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <Row label={t.pay_date} value={formatDate(detail.paymentDate, lang)} />
                <Row label={t.pay_amount} value={<span className="text-emerald-500 font-semibold">{formatCurrency(detail.amount)}</span>} />
                <Row label={t.pay_method} value={detail.method} />
                <Row label={t.pay_status} value={<Badge className={paymentStatusColor(detail.status)}>{detail.status}</Badge>} />
                {detail.jobId && <Row label={t.pay_job} value={detail.jobId} />}
                <Row label={t.pay_jobTotal} value={formatCurrency(detail.jobTotalFee)} />
                <Row label={t.pay_jobBalance} value={formatCurrency(detail.jobBalance)} />
                {detail.notes && <Row label={t.common_notes} value={detail.notes} />}
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => { setEditing(detail); setDetailId(null); setFormOpen(true); }}>
                  <Pencil className="size-4 mr-1" /> {t.common_edit}
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => setDeleteId(detail.id)}>
                  <Trash2 className="size-4 mr-1" /> {t.common_delete}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Form Dialog */}
      <PaymentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        payment={editing}
        onSaved={() => {
          setFormOpen(false);
          qc.invalidateQueries({ queryKey: ['payments'] });
          qc.invalidateQueries({ queryKey: ['jobs'] });
          qc.invalidateQueries({ queryKey: ['metrics'] });
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.pay_deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.pay_deleteConfirmDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common_cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common_delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

// ── Payment Form Dialog ─────────────────────────────────────────
function PaymentFormDialog({
  open, onOpenChange, payment, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  payment: Payment | null;
  onSaved: () => void;
}) {
  const { t } = useLang();
  const formKey = payment ? `edit-${payment.id}` : 'new';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{payment ? t.pay_edit : t.pay_new}</DialogTitle>
          <DialogDescription>
            {payment ? t.pay_editDesc.replace('{id}', payment.id) : t.pay_newDesc}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <PaymentFormBody key={formKey} payment={payment} onSaved={onSaved} onCancel={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PaymentFormBody({
  payment, onSaved, onCancel,
}: {
  payment: Payment | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { lists } = useSettings();
  const { t } = useLang();
  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: jobsApi.list });
  const [form, setForm] = useState<Partial<Payment>>(payment ? { ...payment } : {
    jobId: '', client: '', paymentDate: new Date().toISOString(),
    amount: 0, method: 'Cash', status: 'UNPAID', notes: '',
  });
  const [clientError, setClientError] = useState(false);
  const [amountError, setAmountError] = useState(false);

  const set = (k: keyof Payment, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const onJobSelected = (jobId: string) => {
    set('jobId', jobId);
    if (jobId) {
      const job = jobs.find(j => j.id === jobId);
      if (job) set('client', job.client);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (payment) return paymentsApi.update(payment.id, form);
      return paymentsApi.create(form);
    },
    onSuccess: () => {
      toast.success(payment ? t.pay_updated : t.pay_added);
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = (form.client || '').trim();
    if (!client) { setClientError(true); return; }
    const amount = Number(form.amount);
    if (!amount || amount <= 0) { setAmountError(true); return; }
    saveMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="pf_jobId">{t.pay_linkedJob}</Label>
        <Select value={form.jobId || ''} onValueChange={onJobSelected}>
          <SelectTrigger><SelectValue placeholder={t.common_standalone} /></SelectTrigger>
          <SelectContent>
            {jobs.map(j => (
              <SelectItem key={j.id} value={j.id}>
                {j.id} — {j.client} ({j.jobType})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="pf_client">{t.pay_client} *</Label>
        <Input
          id="pf_client"
          value={form.client || ''}
          onChange={(e) => { set('client', e.target.value); setClientError(false); }}
          className={clientError ? 'border-destructive' : ''}
          required
        />
        {clientError && <p className="text-xs text-destructive mt-1">{t.pay_clientError}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="pf_date">{t.pay_date} *</Label>
          <Input
            id="pf_date"
            type="date"
            value={toDateInput(form.paymentDate)}
            onChange={(e) => set('paymentDate', fromDateInput(e.target.value) || '')}
            required
          />
        </div>
        <div>
          <Label htmlFor="pf_amount">{t.pay_amount} *</Label>
          <Input
            id="pf_amount"
            type="number"
            min={1}
            value={form.amount ?? ''}
            onChange={(e) => { set('amount', Number(e.target.value)); setAmountError(false); }}
            className={amountError ? 'border-destructive' : ''}
            required
          />
          {amountError && <p className="text-xs text-destructive mt-1">{t.pay_amountError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="pf_method">{t.pay_method}</Label>
          <Select value={form.method || 'Cash'} onValueChange={(v) => set('method', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(lists?.paymentMethods || []).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="pf_status">{t.pay_status}</Label>
          <Select value={form.status || 'UNPAID'} onValueChange={(v) => set('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(lists?.paymentStatuses || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="pf_notes">{t.common_notes}</Label>
        <Textarea id="pf_notes" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>{t.common_cancel}</Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? t.common_saving : (payment ? t.pay_update : t.pay_save)}
        </Button>
      </DialogFooter>
    </form>
  );
}
