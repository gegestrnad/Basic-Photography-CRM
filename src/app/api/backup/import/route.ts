import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validate, backupImportSchema } from '@/lib/validation';
import { toErrorResponse, validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** POST /api/backup/import — full JSON restore. Wipes existing data first. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const v = validate(backupImportSchema, body);
    if (!v.ok) validationError(v.error, v.details);

    const data = v.data;

    // Wipe all existing data
    await db.payment.deleteMany();
    await db.task.deleteMany();
    await db.wageDistribution.deleteMany();
    await db.job.deleteMany();
    await db.staff.deleteMany();
    await db.wageRule.deleteMany();
    await db.listValue.deleteMany();
    await db.wageConfig.deleteMany();

    // Restore jobs
    for (const j of data.jobs) {
      await db.job.create({
        data: {
          id: String(j.id),
          client: String(j.client || ''),
          phone: String(j.phone || ''),
          jobType: String(j.jobType || 'Other'),
          jobDate: new Date(j.jobDate),
          location: String(j.location || ''),
          status: String(j.status || 'Inquiry'),
          paymentStatus: String(j.paymentStatus || 'UNPAID'),
          totalFee: Number(j.totalFee) || 0,
          deposit: Number(j.deposit) || 0,
          balance: Number(j.balance) || 0,
          photographers: String(j.photographers || ''),
          editors: String(j.editors || ''),
          clientSource: String(j.clientSource || ''),
          notes: String(j.notes || ''),
          createdAt: j.createdAt ? new Date(j.createdAt) : new Date(),
        },
      });
    }

    // Restore payments
    for (const p of data.payments) {
      await db.payment.create({
        data: {
          id: String(p.id),
          jobId: p.jobId || null,
          client: String(p.client || ''),
          paymentDate: new Date(p.paymentDate),
          amount: Number(p.amount) || 0,
          method: String(p.method || 'Cash'),
          status: String(p.status || 'UNPAID'),
          jobTotalFee: Number(p.jobTotalFee) || 0,
          jobBalance: Number(p.jobBalance) || 0,
          notes: String(p.notes || ''),
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        },
      });
    }

    // Restore tasks
    for (const t of data.tasks) {
      await db.task.create({
        data: {
          id: String(t.id),
          jobId: t.jobId || null,
          client: String(t.client || ''),
          task: String(t.task || ''),
          dueDate: new Date(t.dueDate),
          status: String(t.status || 'OPEN'),
          notes: String(t.notes || ''),
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        },
      });
    }

    // Restore wage distributions
    for (const w of data.wageDistributions) {
      await db.wageDistribution.create({
        data: {
          id: String(w.id),
          jobId: w.jobId || null,
          grossAmount: Number(w.grossAmount) || 0,
          distributableBase: Number(w.distributableBase) || 0,
          totalPaid: Number(w.totalPaid) || 0,
          breakdown: JSON.stringify(w.breakdown || []),
          operationalExpenses: JSON.stringify(w.operationalExpenses || []),
          notes: String(w.notes || ''),
          createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
        },
      });
    }

    // Restore staff
    for (let i = 0; i < data.staff.length; i++) {
      const s = data.staff[i];
      await db.staff.create({
        data: {
          name: String(s.name || ''),
          primaryRole: String(s.primaryRole || ''),
          phone: String(s.phone || ''),
          notes: String(s.notes || ''),
          roles: JSON.stringify(Array.isArray(s.roles) ? s.roles : []),
          sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : i,
        },
      });
    }

    // Restore wage rules
    for (let i = 0; i < data.wageRules.length; i++) {
      const r = data.wageRules[i];
      await db.wageRule.create({
        data: {
          role: String(r.role || ''),
          percentage: Number(r.percentage) || 0,
          sortOrder: i,
        },
      });
    }

    // Restore wage config
    if (data.wageConfig) {
      await db.wageConfig.create({
        data: {
          id: 'singleton',
          distributableRatio: Number(data.wageConfig.distributableRatio) ?? 0.625,
          defaultExpenses: JSON.stringify(Array.isArray(data.wageConfig.defaultExpenses) ? data.wageConfig.defaultExpenses : []),
        },
      });
    }

    // Restore lists
    if (data.lists) {
      for (const [listKey, values] of Object.entries(data.lists)) {
        if (!Array.isArray(values)) continue;
        for (let i = 0; i < values.length; i++) {
          await db.listValue.create({
            data: { listKey, value: String(values[i]), sortOrder: i },
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
