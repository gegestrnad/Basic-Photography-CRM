import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseJson } from '@/lib/serialize';
import { validate, settingsUpdateSchema } from '@/lib/validation';
import { toErrorResponse, validationError } from '@/lib/api-error';
import type { Lists, Staff, WageRule, WageConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/settings — returns all dropdown lists, wage rules, staff, and wage config */
export async function GET() {
  try {
    const [listValues, wageRules, staff, configRow] = await Promise.all([
      db.listValue.findMany({ orderBy: [{ listKey: 'asc' }, { sortOrder: 'asc' }] }),
      db.wageRule.findMany({ orderBy: { sortOrder: 'asc' } }),
      db.staff.findMany({ orderBy: { sortOrder: 'asc' } }),
      db.wageConfig.findUnique({ where: { id: 'singleton' } }),
    ]);

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
  } catch (err) {
    return toErrorResponse(err);
  }
}

/** PUT /api/settings — update lists, wage rules, staff, and wage config (full replace) */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const v = validate(settingsUpdateSchema, body);
    if (!v.ok) validationError(v.error, v.details);

    const data = v.data;

    // ── Update lists (full replace per listKey) ──
    if (data.lists) {
      await db.listValue.deleteMany();
      const listKeys: (keyof Lists)[] = ['jobStatuses','paymentStatuses','clientSources','jobTypes','taskStatuses','paymentMethods'];
      for (const listKey of listKeys) {
        const values = data.lists[listKey] || [];
        for (let i = 0; i < values.length; i++) {
          await db.listValue.create({
            data: { listKey, value: values[i], sortOrder: i },
          });
        }
      }
    }

    // ── Update wage rules (full replace) ──
    if (Array.isArray(data.wageRules)) {
      await db.wageRule.deleteMany();
      for (let i = 0; i < data.wageRules.length; i++) {
        const r = data.wageRules[i];
        await db.wageRule.create({
          data: {
            role: r.role,
            percentage: r.percentage,
            sortOrder: i,
          },
        });
      }
    }

    // ── Update staff (full replace) ──
    if (Array.isArray(data.staff)) {
      await db.staff.deleteMany();
      for (let i = 0; i < data.staff.length; i++) {
        const s = data.staff[i];
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
    if (data.wageConfig) {
      await db.wageConfig.upsert({
        where: { id: 'singleton' },
        update: {
          distributableRatio: data.wageConfig.distributableRatio,
          defaultExpenses: JSON.stringify(data.wageConfig.defaultExpenses || []),
        },
        create: {
          id: 'singleton',
          distributableRatio: data.wageConfig.distributableRatio,
          defaultExpenses: JSON.stringify(data.wageConfig.defaultExpenses || []),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
