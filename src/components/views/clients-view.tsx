'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi, toastApiError } from '@/lib/api';
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
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Phone, Mail, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import type { Client } from '@/lib/types';

export function ClientsView() {
  const qc = useQueryClient();
  const { t } = useLang();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<(Client & { jobCount?: number }) | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: clients = [], isLoading } = useQuery({ queryKey: ['clients'], queryFn: clientsApi.list });

  const detail = clients.find(c => c.id === detailId) || null;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.remove(id),
    onSuccess: () => {
      toast.success(t.client_deleted);
      qc.invalidateQueries({ queryKey: ['clients'] });
      setDeleteId(null);
      setDetailId(null);
    },
  });

  return (
    <div>
      <PageHeader
        title={t.client_title}
        subtitle={t.client_count(clients.length)}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} size="sm">
            <Plus className="size-4 mr-1" /> {t.client_new}
          </Button>
        }
      />

      {/* List */}
      <div className="space-y-2">
        {isLoading ? <JobListSkeleton /> : clients.length === 0 ? (
          <EmptyState view="generic" message={t.client_empty} ctaLabel={t.client_new} onCta={() => { setEditing(null); setFormOpen(true); }} />
        ) : (
          clients.map(c => (
            <button
              key={c.id}
              onClick={() => setDetailId(c.id)}
              className="w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-3">
                    {c.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{c.phone}</span>}
                    {c.email && <span className="flex items-center gap-1"><Mail className="size-3" />{c.email}</span>}
                  </div>
                </div>
                <Badge className="text-xs bg-primary/15 text-primary shrink-0">
                  <Briefcase className="size-3 mr-1" />
                  {t.client_jobs(c.jobCount || 0)}
                </Badge>
              </div>
              {c.notes && <p className="text-xs text-muted-foreground truncate mt-1">{c.notes}</p>}
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
                <SheetTitle>{detail.name}</SheetTitle>
                <SheetDescription>{t.client_jobs(detail.jobCount || 0)}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                {detail.phone && <Row label={t.client_phone} value={detail.phone} />}
                {detail.email && <Row label={t.client_email} value={detail.email} />}
                {detail.notes && <Row label={t.client_notes} value={detail.notes} />}
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
      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editing}
        onSaved={() => {
          setFormOpen(false);
          qc.invalidateQueries({ queryKey: ['clients'] });
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.client_deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.client_deleteConfirmDesc}</AlertDialogDescription>
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

// ── Client Form Dialog ────────────────────────────────────────
function ClientFormDialog({
  open, onOpenChange, client, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  client: (Client & { jobCount?: number }) | null;
  onSaved: () => void;
}) {
  const { t } = useLang();
  const formKey = client ? `edit-${client.id}` : 'new';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? t.client_edit : t.client_new}</DialogTitle>
          <DialogDescription>
            {client ? t.client_editDesc.replace('{id}', client.name) : t.client_newDesc}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ClientFormBody key={formKey} client={client} onSaved={onSaved} onCancel={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ClientFormBody({
  client, onSaved, onCancel,
}: {
  client: Client | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useLang();
  const [form, setForm] = useState<Partial<Client>>(client ? { ...client } : {
    name: '', phone: '', email: '', notes: '',
  });
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const set = (k: keyof Client, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (client) return clientsApi.update(client.id, form);
      return clientsApi.create(form);
    },
    onSuccess: () => {
      toast.success(client ? t.client_updated : t.client_added);
      onSaved();
    },
    onError: toastApiError,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (form.name || '').trim();
    if (!name) { setNameError(true); return; }
    // Basic email validation
    const email = (form.email || '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError(true); return; }
    saveMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="cf_name">{t.client_name} *</Label>
        <Input
          id="cf_name"
          value={form.name || ''}
          onChange={(e) => { set('name', e.target.value); setNameError(false); }}
          className={nameError ? 'border-destructive' : ''}
          required
        />
        {nameError && <p className="text-xs text-destructive mt-1">{t.client_nameError}</p>}
      </div>

      <div>
        <Label htmlFor="cf_phone">{t.client_phone}</Label>
        <Input id="cf_phone" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder={t.client_phone} />
      </div>

      <div>
        <Label htmlFor="cf_email">{t.client_email}</Label>
        <Input
          id="cf_email"
          type="email"
          value={form.email || ''}
          onChange={(e) => { set('email', e.target.value); setEmailError(false); }}
          className={emailError ? 'border-destructive' : ''}
          placeholder={t.client_email}
        />
        {emailError && <p className="text-xs text-destructive mt-1">{t.client_emailError}</p>}
      </div>

      <div>
        <Label htmlFor="cf_notes">{t.client_notes}</Label>
        <Textarea id="cf_notes" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={3} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>{t.common_cancel}</Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? t.common_saving : (client ? t.client_update : t.client_save)}
        </Button>
      </DialogFooter>
    </form>
  );
}
