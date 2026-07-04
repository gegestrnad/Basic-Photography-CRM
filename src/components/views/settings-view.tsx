'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { settingsApi, backupApi } from '@/lib/api';
import { useSettings } from '@/components/settings-provider';
import { useLang } from '@/components/language-provider';
import { useAppStore } from '@/lib/store';
import { PageHeader, SectionTitle } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, Upload, Plus, Trash2, Save, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import type { Lists, Staff, WageRule, OperationalExpense } from '@/lib/types';

const LIST_KEYS: { key: keyof Lists; label: string }[] = [
  { key: 'jobStatuses',     label: 'Job Statuses' },
  { key: 'paymentStatuses', label: 'Payment Statuses' },
  { key: 'clientSources',   label: 'Client Sources' },
  { key: 'jobTypes',        label: 'Job Types' },
  { key: 'taskStatuses',    label: 'Task Statuses' },
  { key: 'paymentMethods',  label: 'Payment Methods' },
];

export function SettingsView() {
  const qc = useQueryClient();
  const { lists, wageRules, staff, wageConfig, reload } = useSettings();
  const { t, lang, setLang } = useLang();
  const { theme, setTheme } = useTheme();
  const triggerListsReload = useAppStore(s => s.triggerListsReload);

  const [editLists, setEditLists] = useState<Lists | null>(null);
  const [editRules, setEditRules] = useState<WageRule[]>([]);
  const [editStaff, setEditStaff] = useState<Staff[]>([]);
  const [editRatio, setEditRatio] = useState(0.625);
  const [editExpenses, setEditExpenses] = useState<OperationalExpense[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [syncedFor, setSyncedFor] = useState<string | null>(null);

  // Sync external settings → local edit state (ref-guard pattern, no useEffect)
  const settingsKey = lists ? `${JSON.stringify(lists)}|${wageRules.length}|${staff.length}|${wageConfig?.distributableRatio}` : null;
  if (settingsKey && settingsKey !== syncedFor) {
    setEditLists({ ...lists });
    setEditRules(wageRules.map(r => ({ ...r })));
    setEditStaff(staff.map(s => ({ ...s })));
    if (wageConfig) {
      setEditRatio(wageConfig.distributableRatio);
      setEditExpenses(wageConfig.defaultExpenses.map(e => ({ ...e })));
    }
    setSyncedFor(settingsKey);
  }

  const totalRulePct = editRules.reduce((s, r) => s + (Number(r.percentage) || 0), 0);

  const saveAll = async () => {
    try {
      await settingsApi.update({
        lists: editLists || undefined,
        wageRules: editRules,
        staff: editStaff,
        wageConfig: { distributableRatio: editRatio, defaultExpenses: editExpenses },
      });
      toast.success(t.set_saved);
      setSyncedFor(null); // force re-sync from server
      reload();
      triggerListsReload();
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await backupApi.export();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importData);
      await backupApi.import(data);
      toast.success(t.set_importSuccess);
      setImportOpen(false);
      setImportData('');
      setSyncedFor(null);
      reload();
      triggerListsReload();
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(t.set_importFailed(e.message));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportData(String(ev.target?.result || ''));
      setImportOpen(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div>
      <PageHeader
        title={t.set_title}
        subtitle={t.set_subtitle}
        actions={
          <Button onClick={saveAll} size="sm">
            <Save className="size-4 mr-1" /> {t.set_saveAll}
          </Button>
        }
      />

      {/* Theme + Language */}
      <SectionTitle>{t.set_appearance}</SectionTitle>
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{t.set_theme}</div>
            <div className="text-sm text-muted-foreground">{t.set_themeDesc}</div>
          </div>
          <Button variant="outline" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="size-4 mr-1" /> : <Moon className="size-4 mr-1" />}
            {theme === 'dark' ? (lang === 'id' ? 'Terang' : 'Light') : (lang === 'id' ? 'Gelap' : 'Dark')}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium">{t.set_language}</div>
            <div className="text-sm text-muted-foreground">{t.set_languageDesc}</div>
          </div>
          <Select value={lang} onValueChange={(v) => setLang(v as 'en' | 'id')}>
            <SelectTrigger className="w-40 shrink-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="id">Bahasa Indonesia</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Lists Management */}
      <SectionTitle>{t.set_dropdownLists}</SectionTitle>
      {editLists && (
        <div className="grid md:grid-cols-2 gap-4">
          {LIST_KEYS.map(({ key, label }) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {(editLists[key] || []).map((val, i) => (
                  <div key={i} className="flex gap-1.5">
                    <Input
                      value={val}
                      onChange={(e) => {
                        const next = [...editLists[key]];
                        next[i] = e.target.value;
                        setEditLists({ ...editLists, [key]: next });
                      }}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        const next = editLists[key].filter((_, idx) => idx !== i);
                        setEditLists({ ...editLists, [key]: next });
                      }}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-8 text-xs"
                  onClick={() => setEditLists({ ...editLists, [key]: [...editLists[key], ''] })}
                >
                  <Plus className="size-3 mr-1" /> Add
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Wage Rules */}
      <SectionTitle>{t.set_wageRules}</SectionTitle>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t.set_totalPercent}</span>
            <Badge className={Math.abs(totalRulePct - 1) < 0.001 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}>
              {(totalRulePct * 100).toFixed(1)}% {Math.abs(totalRulePct - 1) < 0.001 ? '✓' : `⚠ ${t.set_shouldBe100}`}
            </Badge>
          </div>
          <div className="space-y-1.5">
            {editRules.map((r, i) => (
              <div key={i} className="flex gap-1.5 items-center">
                <Input
                  value={r.role}
                  onChange={(e) => setEditRules(prev => prev.map((x, idx) => idx === i ? { ...x, role: e.target.value } : x))}
                  className="h-8 text-sm flex-1"
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={r.percentage}
                  onChange={(e) => setEditRules(prev => prev.map((x, idx) => idx === i ? { ...x, percentage: Number(e.target.value) } : x))}
                  className="h-8 text-sm w-24"
                />
                <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-destructive"
                  onClick={() => setEditRules(prev => prev.filter((_, idx) => idx !== i))}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="w-full h-8 text-xs"
            onClick={() => setEditRules(prev => [...prev, { id: '', role: '', percentage: 0, sortOrder: prev.length }])}>
            <Plus className="size-3 mr-1" /> {t.set_addRule}
          </Button>

          <div className="pt-3 border-t border-border space-y-2">
            <Label className="text-xs uppercase tracking-wider">{t.set_defaultExpenses}</Label>
            <p className="text-xs text-muted-foreground">{t.set_defaultExpensesHint}</p>
            {editExpenses.map((e, i) => (
              <div key={i} className="flex gap-1.5">
                <Input
                  value={e.name}
                  onChange={(ev) => setEditExpenses(prev => prev.map((x, idx) => idx === i ? { ...x, name: ev.target.value } : x))}
                  placeholder="Expense name"
                  className="h-8 text-sm flex-1"
                />
                <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-destructive"
                  onClick={() => setEditExpenses(prev => prev.filter((_, idx) => idx !== i))}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="ghost" className="w-full h-8 text-xs"
              onClick={() => setEditExpenses(prev => [...prev, { name: '', amount: 0 }])}>
              <Plus className="size-3 mr-1" /> {t.set_addExpenseTpl}
            </Button>

            <div className="flex items-center gap-2 pt-2">
              <Label className="text-sm whitespace-nowrap">{t.set_fallbackRatio}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={editRatio}
                onChange={(e) => setEditRatio(Number(e.target.value))}
                className="h-8 text-sm w-24"
              />
              <span className="text-xs text-muted-foreground">
                {t.set_fallbackRatioHint(Math.round(editRatio * 100))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Management */}
      <SectionTitle>{t.set_staffRoles}</SectionTitle>
      <Card>
        <CardContent className="p-4 space-y-2">
          {editStaff.map((s, i) => (
            <div key={i} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex gap-1.5 items-center">
                <Input
                  value={s.name}
                  onChange={(e) => setEditStaff(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                  placeholder={t.set_name}
                  className="h-8 text-sm flex-1"
                />
                <Input
                  value={s.primaryRole}
                  onChange={(e) => setEditStaff(prev => prev.map((x, idx) => idx === i ? { ...x, primaryRole: e.target.value } : x))}
                  placeholder={t.set_primaryRole}
                  className="h-8 text-sm flex-1"
                />
                <Input
                  value={s.phone}
                  onChange={(e) => setEditStaff(prev => prev.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))}
                  placeholder={t.set_phone}
                  className="h-8 text-sm w-32"
                />
                <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-destructive"
                  onClick={() => setEditStaff(prev => prev.filter((_, idx) => idx !== i))}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">{t.set_wageRoles}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {editRules.map(r => {
                    const selected = s.roles.includes(r.role);
                    return (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => {
                          setEditStaff(prev => prev.map((x, idx) => {
                            if (idx !== i) return x;
                            const roles = selected
                              ? x.roles.filter(rr => rr !== r.role)
                              : [...x.roles, r.role];
                            return { ...x, roles };
                          }));
                        }}
                        className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:bg-accent'
                        }`}
                      >
                        {r.role} ({Math.round(r.percentage * 100)}%)
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          <Button size="sm" variant="ghost" className="w-full h-8 text-xs"
            onClick={() => setEditStaff(prev => [...prev, { id: '', name: '', primaryRole: '', phone: '', notes: '', roles: [], sortOrder: prev.length }])}>
            <Plus className="size-3 mr-1" /> {t.set_addStaff}
          </Button>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <SectionTitle>{t.set_backup}</SectionTitle>
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t.set_backupDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleExport} className="flex-1">
              <Download className="size-4 mr-1" /> {t.set_downloadBackup}
            </Button>
            <Button onClick={() => document.getElementById('importFileInput')?.click()} variant="outline" className="flex-1">
              <Upload className="size-4 mr-1" /> {t.set_importBackup}
            </Button>
            <input type="file" id="importFileInput" accept=".json" className="hidden" onChange={handleFileUpload} />
          </div>
        </CardContent>
      </Card>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={importOpen} onOpenChange={setImportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.set_importConfirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.set_importConfirmDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common_cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport}>{t.set_import}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
