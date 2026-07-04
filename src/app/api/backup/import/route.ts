import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** POST /api/backup/import — full JSON restore. Wipes existing data first. */
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.jobs || !body.payments || !body.tasks) {
    return NextResponse.json(
      { error: 'Invalid backup: missing jobs/payments/tasks sections' },
      { status: 400 }
    );
  }

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
  for (const j of body.jobs) {
    await db.job.create({
      data: {
        id: j.id,
        client: j.client,
        phone: j.phone || '',
        jobType: j.jobType || 'Other',
        jobDate: new Date(j.jobDate),
        location: j.location || '',
        status: j.status || 'Inquiry',
        paymentStatus: j.paymentStatus || 'UNPAID',
        totalFee: Number(j.totalFee) || 0,
        deposit: Number(j.deposit) || 0,
        balance: Number(j.balance) || 0,
        photographers: j.photographers || '',
        editors: j.editors || '',
        clientSource: j.clientSource || '',
        notes: j.notes || '',
        createdAt: j.createdAt ? new Date(j.createdAt) : new Date(),
      },
    });
  }

  // Restore payments
  for (const p of body.payments) {
    await db.payment.create({
      data: {
        id: p.id,
        jobId: p.jobId || null,
        client: p.client,
        paymentDate: new Date(p.paymentDate),
        amount: Number(p.amount) || 0,
        method: p.method || 'Cash',
        status: p.status || 'UNPAID',
        jobTotalFee: Number(p.jobTotalFee) || 0,
        jobBalance: Number(p.jobBalance) || 0,
        notes: p.notes || '',
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      },
    });
  }

  // Restore tasks
  for (const t of body.tasks) {
    await db.task.create({
      data: {
        id: t.id,
        jobId: t.jobId || null,
        client: t.client,
        task: t.task,
        dueDate: new Date(t.dueDate),
        status: t.status || 'OPEN',
        notes: t.notes || '',
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      },
    });
  }

  // Restore wage distributions (optional in backup)
  if (Array.isArray(body.wageDistributions)) {
    for (const w of body.wageDistributions) {
      await db.wageDistribution.create({
        data: {
          id: w.id,
          jobId: w.jobId || null,
          grossAmount: Number(w.grossAmount) || 0,
          distributableBase: Number(w.distributableBase) || 0,
          totalPaid: Number(w.totalPaid) || 0,
          breakdown: JSON.stringify(w.breakdown || []),
          operationalExpenses: JSON.stringify(w.operationalExpenses || []),
          notes: w.notes || '',
          createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
        },
      });
    }
  }

  // Restore staff
  if (Array.isArray(body.staff)) {
    for (let i = 0; i < body.staff.length; i++) {
      const s = body.staff[i];
      await db.staff.create({
        data: {
          name: s.name,
          primaryRole: s.primaryRole || '',
          phone: s.phone || '',
          notes: s.notes || '',
          roles: JSON.stringify(s.roles || []),
          sortOrder: s.sortOrder ?? i,
        },
      });
    }
  }

  // Restore wage rules
  if (Array.isArray(body.wageRules)) {
    for (let i = 0; i < body.wageRules.length; i++) {
      const r = body.wageRules[i];
      await db.wageRule.create({
        data: {
          role: r.role,
          percentage: Number(r.percentage) || 0,
          sortOrder: i,
        },
      });
    }
  }

  // Restore wage config
  if (body.wageConfig) {
    await db.wageConfig.create({
      data: {
        id: 'singleton',
        distributableRatio: Number(body.wageConfig.distributableRatio) ?? 0.625,
        defaultExpenses: JSON.stringify(body.wageConfig.defaultExpenses || []),
      },
    });
  }

  // Restore lists
  if (body.lists) {
    for (const [listKey, values] of Object.entries(body.lists)) {
      if (!Array.isArray(values)) continue;
      for (let i = 0; i < values.length; i++) {
        await db.listValue.create({
          data: { listKey, value: values[i], sortOrder: i },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
