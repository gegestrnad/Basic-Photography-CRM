'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi, toastApiError } from '@/lib/api';
import { useSettings } from '@/components/settings-provider';
import { useLang } from '@/components/language-provider';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { JobListSkeleton } from '@/components/skeletons';
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
import { Search, Plus, Pencil, Trash2, MapPin, Wallet, Phone, Users, Scissors, Calendar, FileText } from 'lucide-react';
import { formatCurrency, formatDate, jobStatusColor, paymentStatusColor, toDateInput, fromDateInput } from '@/lib/format';
import { toast } from 'sonner';
import type { Job } from '@/lib/types';

type FilterId = 'all' | 'active' | 'editing' | 'done';
const FILTERS: { id: FilterId; labelKey: 'all' | 'active' | 'editing' | 'done' }[] = [
  { id: 'all',     labelKey: 'all' },
  { id: 'active',  labelKey: 'active' },
  { id: 'editing', labelKey: 'editing' },
  { id: 'done',    labelKey: 'done' },
];

function matchesFilter(job: Job, f: FilterId): boolean {
  switch (f) {
    case 'all':     return true;
    case 'active':  return job.status !== 'Completed' && job.status !== 'Cancelled';
    case 'editing': return job.status === 'Editing';
    case 'done':    return job.status === 'Completed' || job.status === 'Cancelled';
  }
}

export function JobsView() {
  const qc = useQueryClient();
  const { lists } = useSettings();
  const { t, lang } = useLang();
  const [filter, setFilter] = useState<FilterId>('all');
  const [search, setSearch] = useState('');
  const [detailJobId, setDetailJobId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({ queryKey: ['jobs'], queryFn: jobsApi.list });
  const { data: detail } = useQuery({
    queryKey: ['job', detailJobId],
    queryFn: () => jobsApi.get(detailJobId!),
    enabled: !!detailJobId,
  });

  const filtered = useMemo(() => {
    let f = jobs.filter(j => matchesFilter(j, filter));
    const q = search.toLowerCase().trim();
    if (q) {
      f = f.filter(j =>
        j.client?.toLowerCase().includes(q) ||
        j.jobType?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q) ||
        j.photographers?.toLowerCase().includes(q) ||
        j.editors?.toLowerCase().includes(q) ||
        j.id?.toLowerCase().includes(q)
      );
    }
    return f;
  }, [jobs, filter, search]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobsApi.remove(id),
    onSuccess: () => {
      toast.success(t.jobs_deleted);
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['metrics'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setDeleteId(null);
      setDetailJobId(null);
    },
  });

  return (
    <div>
      <PageHeader
        title={t.jobs_title}
        subtitle={t.jobs_count(filtered.length)}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} size="sm">
            <Plus className="size-4 mr-1" /> {t.jobs_new}
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-3">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {f.labelKey === 'all'
              ? t.jobs_filterAll
              : f.labelKey === 'active'
                ? t.jobs_filterActive
                : f.labelKey === 'editing'
                  ? t.jobs_filterEditing
                  : t.jobs_filterDone}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t.jobs_search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {jobsLoading ? <JobListSkeleton /> : filtered.length === 0 ? (
          <EmptyState view="jobs" onCta={() => { setEditing(null); setFormOpen(true); }} />
        ) : (
          filtered.map(job => (
            <button
              key={job.id}
              onClick={() => setDetailJobId(job.id)}
              className="w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{job.client}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {job.jobType} · {formatDate(job.jobDate, lang)}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${jobStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {job.location && (
                  <span className="flex items-center gap-1"><MapPin className="size-3" />{job.location}</span>
                )}
                <span className="flex items-center gap-1"><Wallet className="size-3" />{formatCurrency(job.totalFee)}</span>
                <span className={`flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded ${paymentStatusColor(job.paymentStatus)}`}>
                  {job.paymentStatus}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!detailJobId} onOpenChange={(o) => !o && setDetailJobId(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>{detail.job.client}</SheetTitle>
                <SheetDescription>
                  {detail.job.id} · {detail.job.jobType}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <DetailSection title={t.jobs_jobInfo}>
                  <DetailRow label="Job ID" value={detail.job.id} />
                  <DetailRow label={t.jobs_jobType} value={detail.job.jobType} />
                  <DetailRow label={t.jobs_jobDate} value={formatDate(detail.job.jobDate, lang)} />
                  <DetailRow label={t.jobs_location} value={detail.job.location || '—'} />
                  <DetailRow label={t.jobs_status} value={<Badge className={jobStatusColor(detail.job.status)}>{detail.job.status}</Badge>} />
                  <DetailRow label={t.jobs_clientSource} value={detail.job.clientSource || '—'} />
                  {detail.job.phone && <DetailRow label={t.jobs_phone} value={<span className="flex items-center gap-1"><Phone className="size-3" />{detail.job.phone}</span>} />}
                </DetailSection>

                <DetailSection title={t.jobs_financial}>
                  <DetailRow label={t.jobs_totalFee} value={formatCurrency(detail.job.totalFee)} />
                  <DetailRow label={t.jobs_deposit} value={formatCurrency(detail.job.deposit)} />
                  <DetailRow label={t.jobs_balance} value={<span className="text-red-500 font-semibold">{formatCurrency(detail.job.balance)}</span>} />
                  <DetailRow label={t.jobs_paymentStatus} value={<Badge className={paymentStatusColor(detail.job.paymentStatus)}>{detail.job.paymentStatus}</Badge>} />
                </DetailSection>

                <DetailSection title={t.jobs_team}>
                  <DetailRow label={t.jobs_photographers} value={detail.job.photographers || '—'} />
                  <DetailRow label={t.jobs_editors} value={detail.job.editors || '—'} />
                </DetailSection>

                {detail.job.notes && (
                  <DetailSection title={t.common_notes}>
                    <p className="text-sm text-muted-foreground">{detail.job.notes}</p>
                  </DetailSection>
                )}

                {detail.payments.length > 0 && (
                  <DetailSection title={t.jobs_payments(detail.payments.length)}>
                    {detail.payments.map(p => (
                      <div key={p.id} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                        <span>{formatDate(p.paymentDate, lang)} · {p.method}</span>
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </DetailSection>
                )}

                {detail.tasks.length > 0 && (
                  <DetailSection title={t.jobs_tasks(detail.tasks.length)}>
                    {detail.tasks.map(tsk => (
                      <div key={tsk.id} className="flex justify-between items-center text-sm py-1 border-b border-border last:border-0">
                        <div>
                          <div>{tsk.task}</div>
                          <div className="text-xs text-muted-foreground">{t.task_dueDate} {formatDate(tsk.dueDate, lang)}</div>
                        </div>
                        <Badge className={`text-xs ${paymentStatusColor(tsk.status)}`}>{tsk.status}</Badge>
                      </div>
                    ))}
                  </DetailSection>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditing(detail.job);
                      setDetailJobId(null);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-4 mr-1" /> {t.common_edit}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setDeleteId(detail.job.id)}
                  >
                    <Trash2 className="size-4 mr-1" /> {t.common_delete}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Form Dialog */}
      <JobFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        job={editing}
        lists={lists}
        onSaved={() => {
          setFormOpen(false);
          qc.invalidateQueries({ queryKey: ['jobs'] });
          qc.invalidateQueries({ queryKey: ['metrics'] });
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.jobs_deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.jobs_deleteConfirmDesc}
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

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-1.5 text-sm border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

// ── Job Form Dialog ─────────────────────────────────────────────
function JobFormDialog({
  open, onOpenChange, job, lists, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  job: Job | null;
  lists: ReturnType<typeof useSettings>['lists'];
  onSaved: () => void;
}) {
  const { t } = useLang();
  // Key forces remount when opening for a different job (or new) so useState initializes fresh
  const formKey = job ? `edit-${job.id}` : 'new';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job ? t.jobs_edit : t.jobs_new}</DialogTitle>
          <DialogDescription>
            {job ? t.jobs_editDesc.replace('{id}', job.id) : t.jobs_newDesc}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <JobFormBody key={formKey} job={job} lists={lists} onSaved={onSaved} onCancel={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function JobFormBody({
  job, lists, onSaved, onCancel,
}: {
  job: Job | null;
  lists: ReturnType<typeof useSettings>['lists'];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useLang();
  const [form, setForm] = useState<Partial<Job>>(job ? { ...job } : {
    client: '', phone: '', jobType: lists?.jobTypes[0] || 'Wedding',
    jobDate: '', location: '', status: 'Inquiry', paymentStatus: 'UNPAID',
    totalFee: 0, deposit: 0, balance: 0,
    photographers: '', editors: '', clientSource: '', notes: '',
  });
  const [clientError, setClientError] = useState(false);

  const totalFee = Number(form.totalFee) || 0;
  const deposit = Number(form.deposit) || 0;
  const balance = Math.max(0, totalFee - deposit);

  const set = (k: keyof Job, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, balance };
      if (job) return jobsApi.update(job.id, payload);
      return jobsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(job ? t.jobs_updated : t.jobs_added);
      onSaved();
    },
    onError: toastApiError,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = (form.client || '').trim();
    if (!client || client.length < 2) {
      setClientError(true);
      return;
    }
    saveMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="f_client">{t.jobs_client} *</Label>
        <Input
          id="f_client"
          value={form.client || ''}
          onChange={(e) => { set('client', e.target.value); setClientError(false); }}
          className={clientError ? 'border-destructive' : ''}
          placeholder={t.jobs_client}
          required
        />
        {clientError && <p className="text-xs text-destructive mt-1">{t.jobs_clientError}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="f_phone">{t.jobs_phone}</Label>
          <Input id="f_phone" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder={t.jobs_phone} />
        </div>
        <div>
          <Label htmlFor="f_jobType">{t.jobs_jobType} *</Label>
          <Select value={form.jobType || ''} onValueChange={(v) => set('jobType', v)}>
            <SelectTrigger><SelectValue placeholder={t.common_select} /></SelectTrigger>
            <SelectContent>
              {(lists?.jobTypes || []).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="f_jobDate">{t.jobs_jobDate} *</Label>
          <Input
            id="f_jobDate"
            type="date"
            value={toDateInput(form.jobDate)}
            onChange={(e) => set('jobDate', fromDateInput(e.target.value) || '')}
            required
          />
        </div>
        <div>
          <Label htmlFor="f_status">{t.jobs_status} *</Label>
          <Select value={form.status || ''} onValueChange={(v) => set('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(lists?.jobStatuses || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="f_location">{t.jobs_location}</Label>
        <Input id="f_location" value={form.location || ''} onChange={(e) => set('location', e.target.value)} placeholder={t.jobs_location} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="f_totalFee">{t.jobs_totalFee} *</Label>
          <Input id="f_totalFee" type="number" min={0} value={form.totalFee ?? ''} onChange={(e) => set('totalFee', Number(e.target.value))} required />
        </div>
        <div>
          <Label htmlFor="f_deposit">{t.jobs_deposit}</Label>
          <Input id="f_deposit" type="number" min={0} value={form.deposit ?? 0} onChange={(e) => set('deposit', Number(e.target.value))} />
        </div>
      </div>

      <div>
        <Label>{t.jobs_balance}</Label>
        <div className="px-3 py-2 rounded-md bg-muted text-muted-foreground text-sm">{formatCurrency(balance)}</div>
      </div>

      <div>
        <Label htmlFor="f_paymentStatus">{t.jobs_paymentStatus}</Label>
        <Select value={form.paymentStatus || ''} onValueChange={(v) => set('paymentStatus', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(lists?.paymentStatuses || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="f_photographers">{t.jobs_photographers}</Label>
          <Input id="f_photographers" value={form.photographers || ''} onChange={(e) => set('photographers', e.target.value)} placeholder="e.g. Gege, Sude" />
        </div>
        <div>
          <Label htmlFor="f_editors">{t.jobs_editors}</Label>
          <Input id="f_editors" value={form.editors || ''} onChange={(e) => set('editors', e.target.value)} placeholder="e.g. Gege" />
        </div>
      </div>

      <div>
        <Label htmlFor="f_clientSource">{t.jobs_clientSource}</Label>
        <Select value={form.clientSource || ''} onValueChange={(v) => set('clientSource', v)}>
          <SelectTrigger><SelectValue placeholder={`— ${t.common_select} —`} /></SelectTrigger>
          <SelectContent>
            {(lists?.clientSources || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="f_notes">{t.common_notes}</Label>
        <Textarea id="f_notes" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} placeholder={t.common_notes} rows={3} />
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t.common_cancel}</Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? t.common_saving : (job ? t.jobs_update : t.jobs_save)}
        </Button>
      </DialogFooter>
    </form>
  );
}
