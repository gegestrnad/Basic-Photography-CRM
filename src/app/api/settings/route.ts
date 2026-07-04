import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseJson } from '@/lib/serialize';
import type { Lists, Staff, WageRule, WageConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/settings — returns all dropdown lists, wage rules, staff, and wage config */
export async function GET() {
  const listValues = await db.listValue.findMany({ orderBy: [{ listKey: 'asc' }, { sortOrder: 'asc' }] });
  const wageRules = await db.wageRule.findMany({ orderBy: { sortOrder: 'asc' } });
  const staff = await db.staff.findMany({ orderBy: { sortOrder: 'asc' } });
  const configRow = await db.wageConfig.findUnique({ where: { id: 'singleton' } });

  // Group list values by key
  const lists: Lists = {
    jobStatuses: [],
    paymentStatuses: [],
    clientSources: [],
    jobTypes: [],
    taskStatuses: [],
    paymentMethods: [],
  };
  for (const lv of listValues) {
    if (lv.listKey in lists) {
      (lists as any)[lv.listKey].push(lv.value);
    }
  }

  const staffParsed: Staff[] = staff.map(s => ({
    id: s.id,
    name: s.name,
    primaryRole: s.primaryRole,
    phone: s.phone,
    notes: s.notes,
    roles: parseJson<string[]>(s.roles, []),
    sortOrder: s.sortOrder,
  }));

  const wageConfig: WageConfig = {
    distributableRatio: configRow?.distributableRatio ?? 0.625,
    defaultExpenses: parseJson(configRow?.defaultExpenses, []),
  };

  return NextResponse.json({
    lists,
    wageRules: wageRules as WageRule[],
    staff: staffParsed,
    wageConfig,
  });
}

/** PUT /api/settings — update lists, wage rules, staff, and wage config (full replace) */
export async function PUT(req: NextRequest) {
  const body = await req.json();

  // ── Update lists (full replace per listKey) ──
  if (body.lists) {
    await db.listValue.deleteMany();
    const lists: Lists = body.lists;
    const listKeys: (keyof Lists)[] = ['jobStatuses','paymentStatuses','clientSources','jobTypes','taskStatuses','paymentMethods'];
    for (const listKey of listKeys) {
      const values = lists[listKey] || [];
      for (let i = 0; i < values.length; i++) {
        await db.listValue.create({
          data: { listKey, value: values[i], sortOrder: i },
        });
      }
    }
  }

  // ── Update wage rules (full replace) ──
  if (Array.isArray(body.wageRules)) {
    await db.wageRule.deleteMany();
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

  // ── Update staff (full replace) ──
  if (Array.isArray(body.staff)) {
    await db.staff.deleteMany();
    for (let i = 0; i < body.staff.length; i++) {
      const s = body.staff[i];
      await db.staff.create({
        data: {
          name: s.name,
          primaryRole: s.primaryRole || '',
          phone: s.phone || '',
          notes: s.notes || '',
          roles: JSON.stringify(s.roles || []),
          sortOrder: i,
        },
      });
    }
  }

  // ── Update wage config ──
  if (body.wageConfig) {
    await db.wageConfig.upsert({
      where: { id: 'singleton' },
      update: {
        distributableRatio: Number(body.wageConfig.distributableRatio) ?? 0.625,
        defaultExpenses: JSON.stringify(body.wageConfig.defaultExpenses || []),
      },
      create: {
        id: 'singleton',
        distributableRatio: Number(body.wageConfig.distributableRatio) ?? 0.625,
        defaultExpenses: JSON.stringify(body.wageConfig.defaultExpenses || []),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
