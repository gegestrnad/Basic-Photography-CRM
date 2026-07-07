'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wagesApi, jobsApi, toastApiError } from '@/lib/api';
import { useSettings } from '@/components/settings-provider';
import { useLang } from '@/components/language-provider';
import { PageHeader, SectionTitle } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { SummaryCardsSkeleton } from '@/components/skeletons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Save, AlertCircle, CheckCircle2, Receipt, Calculator as CalcIcon } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import type { OperationalExpense, WageCalculationResult, WageDistribution } from '@/lib/types';

export function WagesView() {
  const qc = useQueryClient();
  const { t, lang } = useLang();
  const { data: wds = [], isLoading: wdsLoading } = useQuery({ queryKey: ['wages'], queryFn: wagesApi.list });

  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: jobsApi.list });

  // Total wages calculated
  const totalCalculated = wds.reduce((s, w) => s + w.distributableBase, 0);

  // ── Fetch calculation when job changes ──
  const { data: baseCalc, isLoading: calcLoading } = useQuery({
    queryKey: ['wage-calc', selectedJobId],
    queryFn: () => wagesApi.calculate(selectedJobId || null),
    enabled: true,
  });

  // Local edit state for expenses (keyed reset when baseCalc changes)
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [customBase, setCustomBase] = useState<number | null>(null);
  const [expensesSyncedFor, setExpensesSyncedFor] = useState<string | null>(null);

  // Sync expenses from baseCalc when a new calc arrives (using ref-guard pattern to avoid effect setState loops)
  const baseCalcKey = baseCalc ? `${baseCalc.jobId || 'none'}-${baseCalc.grossAmount}` : null;
  if (baseCalc && baseCalcKey !== expensesSyncedFor) {
    setExpenses(baseCalc.operationalExpenses.map(e => ({ ...e })));
    setCustomBase(null);
    setExpensesSyncedFor(baseCalcKey);
  }

  // Derived calculation (useMemo, no setState)
  const calc = useMemo<WageCalculationResult | null>(() => {
    if (!baseCalc) return null;
    const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    let newBase: number;
    if (customBase != null) {
      newBase = customBase;
    } else if (totalExpenses > 0) {
      newBase = Math.max(0, baseCalc.grossAmount - totalExpenses);
    } else if (baseCalc.grossAmount > 0) {
      newBase = Math.round(baseCalc.grossAmount * 0.625);
    } else {
      newBase = 0;
    }

    // Recompute breakdown with new base (proportional)
    const ratio = baseCalc.distributableBase > 0 ? newBase / baseCalc.distributableBase : 0;
    const newBreakdown = baseCalc.breakdown.map(b => ({
      ...b,
      amount: Math.round(b.amount * ratio),
    }));
    // Fix rounding: adjust largest
    const sum = newBreakdown.reduce((s, b) => s + b.amount, 0);
    const diff = newBase - sum;
    if (diff !== 0 && newBreakdown.length > 0) {
      newBreakdown.sort((a, b) => b.amount - a.amount);
      newBreakdown[0].amount += diff;
    }
    const totalCheck = newBreakdown.reduce((s, b) => s + b.amount, 0);

    return {
      ...baseCalc,
      operationalExpenses: expenses,
      totalExpenses,
      distributableBase: newBase,
      breakdown: newBreakdown,
      totalCheck,
      isVerified: totalCheck === newBase,
    };
  }, [baseCalc, expenses, customBase]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!calc) throw new Error('No calculation to save');
      return wagesApi.save({
        jobId: selectedJobId || null,
        grossAmount: calc.grossAmount,
        distributableBase: calc.distributableBase,
        totalPaid: calc.totalPaid,
        breakdown: calc.breakdown,
        operationalExpenses: calc.operationalExpenses,
      });
    },
    onSuccess: () => {
      toast.success(t.wage_saved);
      qc.invalidateQueries({ queryKey: ['wages'] });
      qc.invalidateQueries({ queryKey: ['metrics'] });
      setSelectedJobId('');
      setExpensesSyncedFor(null); // force re-sync on next calc
    },
    onError: toastApiError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => wagesApi.remove(id),
    onSuccess: () => {
      toast.success(t.wage_deleted);
      qc.invalidateQueries({ queryKey: ['wages'] });
      qc.invalidateQueries({ queryKey: ['metrics'] });
      setDeleteId(null);
      setDetailId(null);
    },
  });

  const detail = wds.find(w => w.id === detailId) || null;

  const updateExpense = (i: number, patch: Partial<OperationalExpense>) => {
    setExpenses(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e));
    setCustomBase(null); // reset to auto-calc when expenses change
  };
  const addExpense = () => {
    setExpenses(prev => [...prev, { name: '', amount: 0 }]);
    setCustomBase(null);
  };
  const removeExpense = (i: number) => {
    setExpenses(prev => prev.filter((_, idx) => idx !== i));
    setCustomBase(null);
  };

  return (
    <div>
      <PageHeader title={t.wage_title} subtitle={t.wage_count(wds.length)} />

      {/* Summary */}
      {wdsLoading ? <SummaryCardsSkeleton count={2} /> : (
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-base sm:text-xl md:text-2xl font-bold text-primary tabular-nums break-all leading-tight">{formatCurrency(totalCalculated)}</div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{t.wage_totalCalculated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-base sm:text-xl md:text-2xl font-bold tabular-nums">{wds.length}</div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{t.wage_savedRecords}</div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Calculator */}
      <SectionTitle>{t.wage_calculator}</SectionTitle>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalcIcon className="size-4 text-primary" />
            {t.wage_calculator}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Job selector */}
          <div>
            <Label htmlFor="wc_job">{t.wage_selectJob}</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger><SelectValue placeholder={t.wage_chooseJob} /></SelectTrigger>
              <SelectContent>
                {jobs.map(j => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.id} — {j.client} ({j.jobType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedJobId && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <div className="text-2xl mb-2 opacity-50">📋</div>
              <div>{t.wage_selectJobHint}</div>
            </div>
          )}

          {calcLoading && selectedJobId && (
            <div className="text-center py-8 text-sm text-muted-foreground">{t.wage_calculating}</div>
          )}

          {calc && (
            <>
              {/* Income + Operational Expenses */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.wage_grossAmount}</span>
                    <span className="font-semibold">{formatCurrency(calc.grossAmount)}</span>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs uppercase tracking-wider flex items-center gap-1">
                        <Receipt className="size-3" /> {t.wage_operationalExpenses}
                      </Label>
                      <Button type="button" size="sm" variant="ghost" onClick={addExpense} className="h-7 px-2">
                        <Plus className="size-3" /> {t.wage_addExpense}
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {expenses.length === 0 && (
                        <div className="text-xs text-muted-foreground italic py-2">{lang === 'id' ? 'Tidak ada pengeluaran — menggunakan rasio fallback 62,5%' : 'No expenses — using 62.5% ratio fallback'}</div>
                      )}
                      {expenses.map((e, i) => (
                        <div key={i} className="flex gap-1.5">
                          <Input
                            placeholder={t.wage_expenseName}
                            value={e.name}
                            onChange={(ev) => updateExpense(i, { name: ev.target.value })}
                            className="h-8 text-sm"
                          />
                          <Input
                            type="number"
                            min={0}
                            placeholder={t.wage_expenseAmount}
                            value={e.amount || ''}
                            onChange={(ev) => updateExpense(i, { amount: Number(ev.target.value) })}
                            className="h-8 text-sm w-28"
                          />
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeExpense(i)} className="h-8 px-2 text-muted-foreground hover:text-destructive">
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">{t.wage_totalExpenses}</span>
                    <span className="font-semibold text-amber-500">{formatCurrency(calc.totalExpenses)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <Label htmlFor="wc_base" className="text-xs uppercase tracking-wider">{t.wage_distributableBase}</Label>
                    <Input
                      id="wc_base"
                      type="number"
                      min={0}
                      step={1000}
                      value={customBase ?? calc.distributableBase}
                      onChange={(e) => setCustomBase(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.wage_distributableBaseHint}
                    </p>
                  </div>

                  <div className="rounded-md bg-muted p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.wage_gross}</span>
                      <span>{formatCurrency(calc.grossAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.wage_minusExpenses}</span>
                      <span className="text-amber-500">{formatCurrency(calc.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1.5 border-t border-border">
                      <span>{t.wage_equalsDistributable}</span>
                      <span className="text-primary">{formatCurrency(calc.distributableBase)}</span>
                    </div>
                  </div>

                  {calc.breakdown.length > 0 && (
                    <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || calc.distributableBase <= 0}>
                      <Save className="size-4 mr-1" />
                      {saveMutation.isPending ? t.common_saving : t.wage_save}
                    </Button>
                  )}
                </div>
              </div>

              {/* Breakdown Table */}
              {calc.breakdown.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 px-3 py-2 bg-muted text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    <span>{t.wage_staff}</span>
                    <span className="text-center">{t.wage_percent}</span>
                    <span className="text-right">{t.wage_amount}</span>
                  </div>
                  {calc.breakdown.map((b, i) => (
                    <div key={i} className="grid grid-cols-[2fr_1fr_1fr] gap-2 px-3 py-2.5 border-t border-border text-sm">
                      <div>
                        <div className="font-medium">{b.staffName}</div>
                        <div className="text-xs text-muted-foreground">{b.roles.join(', ')}</div>
                      </div>
                      <div className="text-center text-muted-foreground">{Math.round(b.percentage * 100)}%</div>
                      <div className="text-right font-semibold text-emerald-500">{formatCurrency(b.amount)}</div>
                    </div>
                  ))}
                  <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 px-3 py-2.5 bg-muted border-t-2 border-border font-semibold">
                    <span>{t.wage_total}</span>
                    <span></span>
                    <span className={`text-right ${calc.isVerified ? 'text-primary' : 'text-amber-500'}`}>
                      {formatCurrency(calc.totalCheck)}
                    </span>
                  </div>
                </div>
              )}

              {calc.breakdown.length === 0 && (
                <div className="rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 text-sm flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{t.wage_noStaff}</span>
                </div>
              )}

              {/* Verification check */}
              {calc.breakdown.length > 0 && (
                <div className={`flex items-center gap-2 text-sm ${calc.isVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {calc.isVerified ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                  <span>
                    {calc.isVerified
                      ? t.wage_verificationPassed
                      : t.wage_verificationFailed(formatCurrency(calc.totalCheck), formatCurrency(calc.distributableBase))}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Saved Distributions */}
      <SectionTitle>{t.wage_savedDistributions}</SectionTitle>
      <div className="space-y-2">
        {wdsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card">
                <div className="h-4 w-32 bg-accent animate-pulse rounded mb-2" />
                <div className="h-3 w-48 bg-accent animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : wds.length === 0 ? (
          <EmptyState view="wages" />
        ) : (
          wds.map(w => {
            const job = jobs.find(j => j.id === w.jobId);
            const jobLabel = job ? `${job.client} (${w.jobId})` : (w.jobId || t.wage_standalone);
            const staffCount = w.breakdown?.length || 0;
            return (
              <button
                key={w.id}
                onClick={() => setDetailId(w.id)}
                className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{jobLabel}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t.wage_base}: {formatCurrency(w.distributableBase)} · {t.wage_staff_count(staffCount)} · {formatDate(w.createdAt, lang)}
                  </div>
                </div>
                <Trash2
                  className="size-4 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={(e) => { e.stopPropagation(); setDeleteId(w.id); }}
                />
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
                <SheetTitle>
                  {jobs.find(j => j.id === detail.jobId)?.client || detail.jobId || t.wage_standalone}
                </SheetTitle>
                <SheetDescription>{detail.id}</SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.wage_overview}</h3>
                  <div className="space-y-1 text-sm">
                    <Row label={t.wage_totalPaid} value={formatCurrency(detail.totalPaid)} />
                    <Row label={t.wage_grossAmount} value={formatCurrency(detail.grossAmount)} />
                    <Row label={t.wage_distributableBase} value={<span className="text-primary font-semibold">{formatCurrency(detail.distributableBase)}</span>} />
                    <Row label={t.wage_date} value={formatDate(detail.createdAt, lang)} />
                  </div>
                </div>

                {detail.operationalExpenses?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.wage_operationalExpenses}</h3>
                    <div className="space-y-1 text-sm">
                      {detail.operationalExpenses.map((e, i) => (
                        <Row key={i} label={e.name} value={formatCurrency(e.amount)} />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.wage_staffBreakdown}</h3>
                  <div className="space-y-1 text-sm">
                    {detail.breakdown.map((b, i) => (
                      <Row
                        key={i}
                        label={
                          <span>
                            {b.staffName}
                            <span className="block text-xs text-muted-foreground">
                              {b.roles.join(', ')} ({Math.round(b.percentage * 100)}%)
                            </span>
                          </span>
                        }
                        value={<span className="text-emerald-500 font-semibold">{formatCurrency(b.amount)}</span>}
                      />
                    ))}
                    <Row label={<span className="font-semibold">{t.wage_total}</span>} value={<span className="text-primary font-bold">{formatCurrency(detail.distributableBase)}</span>} />
                  </div>
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleteId(detail.id)}
                >
                  <Trash2 className="size-4 mr-1" /> {t.common_delete}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.wage_deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.wage_deleteConfirmDesc}</AlertDialogDescription>
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

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-border last:border-0 gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
