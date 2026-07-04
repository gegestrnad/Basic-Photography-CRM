'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wagesApi, jobsApi } from '@/lib/api';
import { useSettings } from '@/components/settings-provider';
import { PageHeader, SectionTitle } from '@/components/page-header';
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
  const { data: wds = [] } = useQuery({ queryKey: ['wages'], queryFn: wagesApi.list });

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
      toast.success('Wage distribution saved');
      qc.invalidateQueries({ queryKey: ['wages'] });
      qc.invalidateQueries({ queryKey: ['metrics'] });
      setSelectedJobId('');
      setExpensesSyncedFor(null); // force re-sync on next calc
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => wagesApi.remove(id),
    onSuccess: () => {
      toast.success('Wage distribution deleted');
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
      <PageHeader title="Wages" subtitle={`${wds.length} distribution${wds.length !== 1 ? 's' : ''}`} />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-primary">{formatCurrency(totalCalculated)}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Total Calculated</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl md:text-2xl font-bold">{wds.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Saved Records</div>
          </CardContent>
        </Card>
      </div>

      {/* Calculator */}
      <SectionTitle>Wage Calculator</SectionTitle>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalcIcon className="size-4 text-primary" />
            Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Job selector */}
          <div>
            <Label htmlFor="wc_job">Select Job</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger><SelectValue placeholder="— Choose a job —" /></SelectTrigger>
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
              <div>Select a job to calculate wages</div>
              <div className="text-xs mt-2">Or compute manually — payments will be 0</div>
            </div>
          )}

          {calcLoading && selectedJobId && (
            <div className="text-center py-8 text-sm text-muted-foreground">Calculating...</div>
          )}

          {calc && (
            <>
              {/* Income + Operational Expenses */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gross Amount (PAID payments)</span>
                    <span className="font-semibold">{formatCurrency(calc.grossAmount)}</span>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs uppercase tracking-wider flex items-center gap-1">
                        <Receipt className="size-3" /> Operational Expenses
                      </Label>
                      <Button type="button" size="sm" variant="ghost" onClick={addExpense} className="h-7 px-2">
                        <Plus className="size-3" /> Add
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {expenses.length === 0 && (
                        <div className="text-xs text-muted-foreground italic py-2">No expenses — using 62.5% ratio fallback</div>
                      )}
                      {expenses.map((e, i) => (
                        <div key={i} className="flex gap-1.5">
                          <Input
                            placeholder="Expense name"
                            value={e.name}
                            onChange={(ev) => updateExpense(i, { name: ev.target.value })}
                            className="h-8 text-sm"
                          />
                          <Input
                            type="number"
                            min={0}
                            placeholder="Amount"
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
                    <span className="text-muted-foreground">Total Expenses</span>
                    <span className="font-semibold text-amber-500">{formatCurrency(calc.totalExpenses)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <Label htmlFor="wc_base" className="text-xs uppercase tracking-wider">Distributable Base (editable)</Label>
                    <Input
                      id="wc_base"
                      type="number"
                      min={0}
                      step={1000}
                      value={customBase ?? calc.distributableBase}
                      onChange={(e) => setCustomBase(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto: Gross − Expenses. Override above if needed.
                    </p>
                  </div>

                  <div className="rounded-md bg-muted p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross</span>
                      <span>{formatCurrency(calc.grossAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">− Expenses</span>
                      <span className="text-amber-500">{formatCurrency(calc.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1.5 border-t border-border">
                      <span>= Distributable</span>
                      <span className="text-primary">{formatCurrency(calc.distributableBase)}</span>
                    </div>
                  </div>

                  {calc.breakdown.length > 0 && (
                    <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || calc.distributableBase <= 0}>
                      <Save className="size-4 mr-1" />
                      {saveMutation.isPending ? 'Saving...' : 'Save Distribution'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Breakdown Table */}
              {calc.breakdown.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 px-3 py-2 bg-muted text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    <span>Staff</span>
                    <span className="text-center">%</span>
                    <span className="text-right">Amount</span>
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
                    <span>Total</span>
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
                  <span>No staff roles mapped for wage distribution. Add roles in Settings.</span>
                </div>
              )}

              {/* Verification check */}
              {calc.breakdown.length > 0 && (
                <div className={`flex items-center gap-2 text-sm ${calc.isVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {calc.isVerified ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                  <span>
                    {calc.isVerified
                      ? 'Verification check passed — breakdown total equals distributable base.'
                      : `Verification mismatch: ${formatCurrency(calc.totalCheck)} vs ${formatCurrency(calc.distributableBase)}.`}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Saved Distributions */}
      <SectionTitle>Saved Distributions</SectionTitle>
      <div className="space-y-2">
        {wds.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            <div className="text-2xl mb-2 opacity-50">📄</div>
            <div>No wage distributions saved yet</div>
          </div>
        ) : (
          wds.map(w => {
            const job = jobs.find(j => j.id === w.jobId);
            const jobLabel = job ? `${job.client} (${w.jobId})` : (w.jobId || 'Standalone');
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
                    Base: {formatCurrency(w.distributableBase)} · {staffCount} staff · {formatDate(w.createdAt)}
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
                  {jobs.find(j => j.id === detail.jobId)?.client || detail.jobId || 'Standalone'}
                </SheetTitle>
                <SheetDescription>{detail.id}</SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Overview</h3>
                  <div className="space-y-1 text-sm">
                    <Row label="Total Paid" value={formatCurrency(detail.totalPaid)} />
                    <Row label="Gross Amount" value={formatCurrency(detail.grossAmount)} />
                    <Row label="Distributable Base" value={<span className="text-primary font-semibold">{formatCurrency(detail.distributableBase)}</span>} />
                    <Row label="Date" value={formatDate(detail.createdAt)} />
                  </div>
                </div>

                {detail.operationalExpenses?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Operational Expenses</h3>
                    <div className="space-y-1 text-sm">
                      {detail.operationalExpenses.map((e, i) => (
                        <Row key={i} label={e.name} value={formatCurrency(e.amount)} />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Staff Breakdown</h3>
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
                    <Row label={<span className="font-semibold">Total</span>} value={<span className="text-primary font-bold">{formatCurrency(detail.distributableBase)}</span>} />
                  </div>
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleteId(detail.id)}
                >
                  <Trash2 className="size-4 mr-1" /> Delete
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
            <AlertDialogTitle>Delete this wage distribution?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
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
