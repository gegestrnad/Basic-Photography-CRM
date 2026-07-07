'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type UserCreateInput, type UserUpdateInput, toastApiError, AuthenticationError } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useLang } from '@/components/language-provider';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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
import { Plus, Pencil, Trash2, Mail, ShieldCheck, User as UserIcon, Calendar, Lock } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import type { User, UserRole } from '@/lib/types';

export function AdminView() {
  const qc = useQueryClient();
  const { t, lang } = useLang();
  const authUser = useAppStore(s => s.authUser);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    // Only fetch if the current user is an admin
    enabled: !!authUser && authUser.role === 'admin',
  });

  const detail = users.find(u => u.id === detailId) || null;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      toast.success(t.admin_deleted);
      qc.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
      setDetailId(null);
    },
    onError: toastApiError,
  });

  // Compute quick stats
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const standardCount = totalUsers - adminCount;

  return (
    <div>
      <PageHeader
        title={t.admin_title}
        subtitle={t.admin_count(users.length)}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} size="sm">
            <Plus className="size-4 mr-1" /> {t.admin_new}
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-base sm:text-xl md:text-2xl font-bold tabular-nums">{totalUsers}</div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{t.admin_statsTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-base sm:text-xl md:text-2xl font-bold text-primary tabular-nums">{adminCount}</div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{t.admin_statsAdmins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-base sm:text-xl md:text-2xl font-bold tabular-nums">{standardCount}</div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{t.admin_statsUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card">
                <div className="h-4 w-32 bg-accent animate-pulse rounded mb-2" />
                <div className="h-3 w-48 bg-accent animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState view="generic" message={t.admin_empty} ctaLabel={t.admin_new} onCta={() => { setEditing(null); setFormOpen(true); }} />
        ) : (
          users.map(u => {
            const isCurrentUser = authUser?.email === u.email;
            return (
              <button
                key={u.id}
                onClick={() => setDetailId(u.id)}
                className="w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate flex items-center gap-2">
                      <span className="truncate">{u.name}</span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                          {t.admin_you}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="size-3" />{u.email}
                    </div>
                  </div>
                  <Badge className={
                    u.role === 'admin'
                      ? 'text-xs bg-primary/15 text-primary shrink-0'
                      : 'text-xs bg-muted text-muted-foreground shrink-0'
                  }>
                    {u.role === 'admin' ? <ShieldCheck className="size-3 mr-1" /> : <UserIcon className="size-3 mr-1" />}
                    {u.role === 'admin' ? t.admin_roleAdmin : t.admin_roleUser}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3" />
                  {t.admin_createdAt}: {formatDate(u.createdAt, lang)}
                </div>
              </button>
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
                <SheetTitle className="flex items-center gap-2">
                  {detail.name}
                  {authUser?.email === detail.email && (
                    <Badge variant="outline" className="text-[10px]">{t.admin_you}</Badge>
                  )}
                </SheetTitle>
                <SheetDescription>{detail.email}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <Row label={t.admin_role} value={
                  <Badge className={detail.role === 'admin' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}>
                    {detail.role === 'admin' ? <ShieldCheck className="size-3 mr-1" /> : <UserIcon className="size-3 mr-1" />}
                    {detail.role === 'admin' ? t.admin_roleAdmin : t.admin_roleUser}
                  </Badge>
                } />
                <Row label={t.admin_email} value={detail.email} />
                <Row label={t.admin_createdAt} value={formatDate(detail.createdAt, lang)} />

                {detail.role === 'admin' ? (
                  <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
                    <ShieldCheck className="size-3 inline mr-1 text-primary" />
                    {t.admin_roleAdminDesc}
                  </div>
                ) : (
                  <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    <UserIcon className="size-3 inline mr-1" />
                    {t.admin_roleUserDesc}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setEditing(detail); setDetailId(null); setFormOpen(true); }}
                >
                  <Pencil className="size-4 mr-1" /> {t.common_edit}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={authUser?.email === detail.email}
                  onClick={() => setDeleteId(detail.id)}
                >
                  <Trash2 className="size-4 mr-1" /> {t.common_delete}
                </Button>
              </div>
              {authUser?.email === detail.email && (
                <p className="text-xs text-muted-foreground text-center mt-2">{t.admin_cannotDeleteSelf}</p>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Form Dialog */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        onSaved={() => {
          setFormOpen(false);
          qc.invalidateQueries({ queryKey: ['users'] });
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin_deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.admin_deleteConfirmDesc}</AlertDialogDescription>
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
    <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0 gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

// ── User Form Dialog ────────────────────────────────────────────
function UserFormDialog({
  open, onOpenChange, user, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: User | null;
  onSaved: () => void;
}) {
  const { t } = useLang();
  const formKey = user ? `edit-${user.id}` : 'new';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? t.admin_edit : t.admin_new}</DialogTitle>
          <DialogDescription>
            {user ? t.admin_editDesc.replace('{id}', user.email) : t.admin_newDesc}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <UserFormBody key={formKey} user={user} onSaved={onSaved} onCancel={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserFormBody({
  user, onSaved, onCancel,
}: {
  user: User | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useLang();
  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }>(user ? { name: user.name, email: user.email, password: '', role: user.role } : {
    name: '', email: '', password: '', role: 'user' as UserRole,
  });
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const set = (k: 'name' | 'email' | 'password' | 'role', v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (user) {
        const changes: UserUpdateInput = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
        };
        if (form.password) changes.password = form.password;
        return usersApi.update(user.id, changes);
      }
      const payload: UserCreateInput = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      };
      return usersApi.create(payload);
    },
    onSuccess: () => {
      toast.success(user ? t.admin_updated : t.admin_added);
      onSaved();
    },
    onError: (e: Error) => {
      // Silent on auth errors — fetchJson already triggered sign-out.
      if (e instanceof AuthenticationError) return;
      const msg = e.message.toLowerCase();
      if (msg.includes('email') && (msg.includes('already') || msg.includes('registered') || msg.includes('duplicate'))) {
        toast.error(t.admin_emailTaken);
      } else if (msg.includes('password')) {
        setPasswordError(true);
        toast.error(t.admin_passwordError);
      } else {
        toast.error(e.message);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    const name = form.name.trim();
    if (!name) { setNameError(true); hasError = true; }
    const email = form.email.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError(true); hasError = true; }
    // Password: required for new users, optional for edits
    if (!user && form.password.length < 6) { setPasswordError(true); hasError = true; }
    if (user && form.password && form.password.length < 6) { setPasswordError(true); hasError = true; }
    if (hasError) return;

    saveMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="uf_name">{t.admin_name} *</Label>
        <Input
          id="uf_name"
          value={form.name}
          onChange={(e) => { set('name', e.target.value); setNameError(false); }}
          className={nameError ? 'border-destructive' : ''}
          required
          autoFocus
        />
        {nameError && <p className="text-xs text-destructive mt-1">{t.admin_nameError}</p>}
      </div>

      <div>
        <Label htmlFor="uf_email">{t.admin_email} *</Label>
        <Input
          id="uf_email"
          type="email"
          value={form.email}
          onChange={(e) => { set('email', e.target.value); setEmailError(false); }}
          className={emailError ? 'border-destructive' : ''}
          required
          autoComplete="email"
        />
        {emailError && <p className="text-xs text-destructive mt-1">{t.admin_emailError}</p>}
      </div>

      <div>
        <Label htmlFor="uf_password" className="flex items-center gap-1">
          <Lock className="size-3" />
          {user ? t.admin_changePassword : `${t.admin_password} *`}
        </Label>
        <Input
          id="uf_password"
          type="password"
          value={form.password}
          onChange={(e) => { set('password', e.target.value); setPasswordError(false); }}
          className={passwordError ? 'border-destructive' : ''}
          placeholder={user ? t.admin_passwordPlaceholder : ''}
          autoComplete={user ? 'new-password' : 'new-password'}
          required={!user}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {user ? t.admin_passwordOptional : t.admin_passwordHint}
        </p>
        {passwordError && <p className="text-xs text-destructive mt-1">{t.admin_passwordError}</p>}
      </div>

      <div>
        <Label htmlFor="uf_role">{t.admin_role}</Label>
        <Select value={form.role} onValueChange={(v) => set('role', v)}>
          <SelectTrigger id="uf_role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <span>{t.admin_roleAdmin}</span>
              </div>
            </SelectItem>
            <SelectItem value="user">
              <div className="flex items-center gap-2">
                <UserIcon className="size-4" />
                <span>{t.admin_roleUser}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          {form.role === 'admin' ? t.admin_roleAdminDesc : t.admin_roleUserDesc}
        </p>
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t.common_cancel}</Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? t.common_saving : (user ? t.admin_update : t.admin_save)}
        </Button>
      </DialogFooter>
    </form>
  );
}
