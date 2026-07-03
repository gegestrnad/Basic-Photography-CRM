import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseJson } from '@/lib/serialize';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/backup/export — full JSON backup of all data + settings */
export async function GET() {
  const jobs = await db.job.findMany();
  const payments = await db.payment.findMany();
  const tasks = await db.task.findMany();
  const wageDistributions = await db.wageDistribution.findMany();
  const staff = await db.staff.findMany();
  const wageRules = await db.wageRule.findMany();
  const configRow = await db.wageConfig.findUnique({ where: { id: 'singleton' } });
  const listValues = await db.listValue.findMany();

  const lists: Record<string, string[]> = {};
  for (const lv of listValues) {
    if (!lists[lv.listKey]) lists[lv.listKey] = [];
    lists[lv.listKey].push(lv.value);
  }

  const backup = {
    _type: 'photography-tracker-backup',
    _version: 2,
    _exportedAt: new Date().toISOString(),
    jobs: jobs.map(j => ({ ...j, jobDate: j.jobDate.toISOString(), createdAt: j.createdAt.toISOString() })),
    payments: payments.map(p => ({ ...p, paymentDate: p.paymentDate.toISOString(), createdAt: p.createdAt.toISOString() })),
    tasks: tasks.map(t => ({ ...t, dueDate: t.dueDate.toISOString(), createdAt: t.createdAt.toISOString() })),
    wageDistributions: wageDistributions.map(w => ({
      ...w,
      breakdown: parseJson(w.breakdown, []),
      operationalExpenses: parseJson(w.operationalExpenses, []),
      createdAt: w.createdAt.toISOString(),
    })),
    staff: staff.map(s => ({ ...s, roles: parseJson(s.roles, []) })),
    wageRules,
    wageConfig: {
      distributableRatio: configRow?.distributableRatio ?? 0.625,
      defaultExpenses: parseJson(configRow?.defaultExpenses, []),
    },
    lists,
  };

  return NextResponse.json(backup);
}
