'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, jobsApi } from '@/lib/api';
import { useSettings } from '@/components/settings-provider';
import { useLang } from '@/components/language-provider';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { TaskListSkeleton } from '@/components/skeletons';
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
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { formatDate, formatDateRelative, daysFromToday, taskStatusColor, toDateInput, fromDateInput } from '@/lib/format';
import { toast } from 'sonner';
import type { Task } from '@/lib/types';

type FilterId = 'all' | 'open' | 'done';
const FILTERS: { id: FilterId; labelKey: 'all' | 'open' | 'done' }[] = [
  { id: 'all',  labelKey: 'all' },
  { id: 'open', labelKey: 'open' },
  { id: 'done', labelKey: 'done' },
];

function matchesFilter(t: Task, f: FilterId): boolean {
  const s = (t.status || '').toUpperCase();
  switch (f) {
    case 'open': return s !== 'DONE' && s !== 'CANCELLED';
    case 'done': return s === 'DONE' || s === 'CANCELLED';
    case 'all':  return true;
  }
}

const STATUS_CYCLE = ['OPEN', 'IN PROGRESS', 'WAITING', 'DONE'] as const;
function nextStatus(current: string): string {
  const idx = STATUS_CYCLE.indexOf((current || '').toUpperCase() as any);
  if (idx === -1 || idx >= STATUS_CYCLE.length - 1) return STATUS_CYCLE[0];
  return STATUS_CYCLE[idx + 1];
}

export function TasksView() {
  const qc = useQueryClient();
  const { t, lang } = useLang();
  const [filter, setFilter] = useState<FilterId>('all');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({ queryKey: ['tasks'], queryFn: tasksApi.list });

  const filtered = useMemo(() => {
    return tasks
      .filter(t => matchesFilter(t, filter))
      .slice()
      .sort((a, b) => (new Date(a.dueDate).getTime()) - (new Date(b.dueDate).getTime()));
  }, [tasks, filter]);

  const detail = useMemo(() => tasks.find(t => t.id === detailId) || null, [tasks, detailId]);

  const cycleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => tasksApi.update(id, { status }),
    onSuccess: (_data, vars) => {
      toast.success(t.task_statusCycled(vars.status));
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['metrics'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => {
      toast.success(t.task_deleted);
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['metrics'] });
      setDeleteId(null);
      setDetailId(null);
    },
  });

  return (
    <div>
      <PageHeader
        title={t.task_title}
        subtitle={t.task_count(filtered.length)}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} size="sm">
            <Plus className="size-4 mr-1" /> {t.task_new}
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
            {f.labelKey === 'all' ? t.task_filterAll : f.labelKey === 'open' ? t.task_filterOpen : t.task_filterDone}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {tasksLoading ? <TaskListSkeleton /> : filtered.length === 0 ? (
          <EmptyState view="tasks" onCta={() => { setEditing(null); setFormOpen(true); }} />
        ) : (
          filtered.map(t => {
            const days = daysFromToday(t.dueDate);
            const isDone = (t.status || '').toUpperCase() === 'DONE';
            const isCancelled = (t.status || '').toUpperCase() === 'CANCELLED';
            let dueColor = 'text-muted-foreground';
            if (!isDone && !isCancelled && days != null) {
              if (days < 0) dueColor = 'text-red-500';
              else if (days === 0) dueColor = 'text-amber-500';
            }
            return (
              <div
                key={t.id}
                className="p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors cursor-pointer"
                onClick={() => setDetailId(t.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{t.task}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t.client}{t.jobId ? ` · ${t.jobId}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cycleMutation.mutate({ id: t.id, status: nextStatus(t.status) });
                    }}
                    className="cursor-pointer"
                  >
                    <Badge className={`text-xs ${taskStatusColor(t.status)}`}>{t.status}</Badge>
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`flex items-center gap-1 ${dueColor}`}>
                    <Calendar className="size-3" />{formatDateRelative(t.dueDate, lang, { today: t.task_today, tomorrow: t.task_tomorrow, yesterday: t.task_yesterday })}
                  </span>
                  {t.notes && <span className="text-muted-foreground truncate">{t.notes}</span>}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }}
                    className="ml-auto text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>{detail.task}</SheetTitle>
                <SheetDescription>{detail.id}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <Row label={t.task_client} value={detail.client} />
                <Row label={t.pay_job} value={detail.jobId || '—'} />
                <Row label={t.task_dueDate} value={formatDate(detail.dueDate, lang)} />
                <Row label={t.task_status} value={<Badge className={taskStatusColor(detail.status)}>{detail.status}</Badge>} />
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
      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editing}
        onSaved={() => {
          setFormOpen(false);
          qc.invalidateQueries({ queryKey: ['tasks'] });
          qc.invalidateQueries({ queryKey: ['metrics'] });
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.task_deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.task_deleteConfirmDesc}</AlertDialogDescription>
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

// ── Task Form Dialog ───────────────────────────────────────────
function TaskFormDialog({
  open, onOpenChange, task, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task: Task | null;
  onSaved: () => void;
}) {
  const { t } = useLang();
  const formKey = task ? `edit-${task.id}` : 'new';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? t.task_edit : t.task_new}</DialogTitle>
          <DialogDescription>
            {task ? t.task_editDesc.replace('{id}', task.id) : t.task_newDesc}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <TaskFormBody key={formKey} task={task} onSaved={onSaved} onCancel={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TaskFormBody({
  task, onSaved, onCancel,
}: {
  task: Task | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { lists } = useSettings();
  const { t } = useLang();
  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: jobsApi.list });
  const [form, setForm] = useState<Partial<Task>>(task ? { ...task } : {
    jobId: '', client: '', task: '', dueDate: '', status: 'OPEN', notes: '',
  });
  const [clientError, setClientError] = useState(false);
  const [taskError, setTaskError] = useState(false);

  const set = (k: keyof Task, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const onJobSelected = (jobId: string) => {
    set('jobId', jobId);
    if (jobId) {
      const job = jobs.find(j => j.id === jobId);
      if (job) set('client', job.client);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (task) return tasksApi.update(task.id, form);
      return tasksApi.create(form);
    },
    onSuccess: () => {
      toast.success(task ? t.task_updated : t.task_added);
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = (form.client || '').trim();
    if (!client) { setClientError(true); return; }
    const taskName = (form.task || '').trim();
    if (!taskName) { setTaskError(true); return; }
    saveMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="tf_jobId">{t.task_linkedJob}</Label>
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
        <Label htmlFor="tf_client">{t.task_client} *</Label>
        <Input
          id="tf_client"
          value={form.client || ''}
          onChange={(e) => { set('client', e.target.value); setClientError(false); }}
          className={clientError ? 'border-destructive' : ''}
          required
        />
        {clientError && <p className="text-xs text-destructive mt-1">{t.task_clientError}</p>}
      </div>

      <div>
        <Label htmlFor="tf_task">{t.task_task} *</Label>
        <Input
          id="tf_task"
          value={form.task || ''}
          onChange={(e) => { set('task', e.target.value); setTaskError(false); }}
          className={taskError ? 'border-destructive' : ''}
          placeholder={t.task_task}
          required
        />
        {taskError && <p className="text-xs text-destructive mt-1">{t.task_taskError}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="tf_dueDate">{t.task_dueDate} *</Label>
          <Input
            id="tf_dueDate"
            type="date"
            value={toDateInput(form.dueDate)}
            onChange={(e) => set('dueDate', fromDateInput(e.target.value) || '')}
            required
          />
        </div>
        <div>
          <Label htmlFor="tf_status">{t.task_status}</Label>
          <Select value={form.status || 'OPEN'} onValueChange={(v) => set('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(lists?.taskStatuses || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="tf_notes">{t.common_notes}</Label>
        <Textarea id="tf_notes" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>{t.common_cancel}</Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? t.common_saving : (task ? t.task_update : t.task_save)}
        </Button>
      </DialogFooter>
    </form>
  );
}
