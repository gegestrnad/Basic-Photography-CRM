import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseJson } from '@/lib/serialize';
import { toErrorResponse } from '@/lib/api-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/backup/export — full JSON backup of all data + settings */
export async function GET() {
  try {
    const [jobs, payments, tasks, wageDistributions, staff, wageRules, configRow, listValues] = await Promise.all([
      db.job.findMany(),
      db.payment.findMany(),
      db.task.findMany(),
      db.wageDistribution.findMany(),
      db.staff.findMany(),
      db.wageRule.findMany(),
      db.wageConfig.findUnique({ where: { id: 'singleton' } }),
      db.listValue.findMany(),
    ]);

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
  } catch (err) {
    return toErrorResponse(err);
  }
}
