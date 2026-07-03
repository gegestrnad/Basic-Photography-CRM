// Seed script — populate database with sample data + default config
// Run: bun run /home/z/my-project/scripts/seed.ts

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── List Values ─────────────────────────────────────────────
  const lists: Record<string, string[]> = {
    jobStatuses: ['Inquiry','Booked','Shot','Editing','Ready','Delivered','Completed','Cancelled'],
    paymentStatuses: ['UNPAID','Deposit-Paid','PAID','Refunded'],
    clientSources: ['WhatsApp','Facebook','Instagram','Referral','Returning Client','Website','Other'],
    jobTypes: ['Wedding','Engagement','Company Event','Portrait','Family','Product','Other'],
    taskStatuses: ['OPEN','IN PROGRESS','WAITING','DONE','CANCELLED'],
    paymentMethods: ['Cash','Bank Transfer','QRIS','E-wallet','Card','Other'],
  };

  await db.listValue.deleteMany();

  for (const [listKey, values] of Object.entries(lists)) {
    for (let i = 0; i < values.length; i++) {
      await db.listValue.create({
        data: { listKey, value: values[i], sortOrder: i },
      });
    }
  }

  // ── Wage Rules ──────────────────────────────────────────────
  await db.wageRule.deleteMany();
  const wageRules = [
    { role: 'Photographer A', percentage: 0.30, sortOrder: 0 },
    { role: 'Photographer B', percentage: 0.24, sortOrder: 1 },
    { role: 'Manager / Client Relations', percentage: 0.29, sortOrder: 2 },
    { role: 'Photo Editor', percentage: 0.12, sortOrder: 3 },
    { role: 'General Staff / Operational & Misc', percentage: 0.05, sortOrder: 4 },
  ];
  for (const r of wageRules) {
    await db.wageRule.create({ data: r });
  }

  // ── Wage Config (singleton) ─────────────────────────────────
  await db.wageConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      distributableRatio: 0.625,
      defaultExpenses: JSON.stringify([
        { name: 'Printing', amount: 0 },
        { name: 'Rental Gears/Lighting/etc', amount: 0 },
      ]),
    },
  });

  // ── Staff ───────────────────────────────────────────────────
  await db.staff.deleteMany();
  const staff = [
    { name: 'Gege', primaryRole: 'Photographer', phone: '', notes: '', roles: JSON.stringify(['Photographer A', 'Photo Editor']), sortOrder: 0 },
    { name: 'Sude', primaryRole: 'Editor', phone: '', notes: '', roles: JSON.stringify(['Photographer B', 'General Staff / Operational & Misc']), sortOrder: 1 },
    { name: 'Roni', primaryRole: 'Assistant Photographer', phone: '', notes: '', roles: JSON.stringify(['Manager / Client Relations']), sortOrder: 2 },
  ];
  for (const s of staff) {
    await db.staff.create({ data: s });
  }

  // ── Sample Job ──────────────────────────────────────────────
  await db.job.deleteMany();
  await db.job.create({
    data: {
      id: 'JOB-0001',
      client: 'Isna & Edrika',
      phone: '',
      jobType: 'Wedding',
      jobDate: new Date('2026-06-14'),
      location: 'Kantor Camat Sui. Raya',
      status: 'Editing',
      paymentStatus: 'PAID',
      totalFee: 1600000,
      deposit: 1600000,
      balance: 0,
      photographers: 'Gege, Sude',
      editors: 'Gege',
      clientSource: 'Referral',
      notes: '',
      createdAt: new Date('2026-06-28'),
    },
  });

  // ── Sample Payment ──────────────────────────────────────────
  await db.payment.deleteMany();
  await db.payment.create({
    data: {
      id: 'PAY-0001',
      jobId: 'JOB-0001',
      client: 'Isna & Edrika',
      paymentDate: new Date('2026-06-15'),
      amount: 1600000,
      method: 'Cash',
      status: 'PAID',
      jobTotalFee: 1600000,
      jobBalance: 0,
      notes: '',
    },
  });

  // ── Sample Task ─────────────────────────────────────────────
  await db.task.deleteMany();
  await db.task.create({
    data: {
      id: 'TSK-0001',
      jobId: 'JOB-0001',
      client: 'Isna & Edrika',
      task: 'Editing',
      dueDate: new Date('2026-06-21'),
      status: 'IN PROGRESS',
      notes: '',
    },
  });

  // ── Sample Wage Distribution (matches Excel Wage Dist sheet) ─
  await db.wageDistribution.deleteMany();
  await db.wageDistribution.create({
    data: {
      id: 'WD-0001',
      jobId: 'JOB-0001',
      grossAmount: 1600000,
      distributableBase: 1000000,
      totalPaid: 1600000,
      breakdown: JSON.stringify([
        { staffName: 'Gege', role: 'Photographer', roles: ['Photographer A', 'Photo Editor'], percentage: 0.42, amount: 420000 },
        { staffName: 'Sude', role: 'Editor', roles: ['Photographer B', 'General Staff / Operational & Misc'], percentage: 0.29, amount: 290000 },
        { staffName: 'Roni', role: 'Assistant Photographer', roles: ['Manager / Client Relations'], percentage: 0.29, amount: 290000 },
      ]),
      operationalExpenses: JSON.stringify([
        { name: 'Printing', amount: 450000 },
        { name: 'Rental Gears/Lighting/etc', amount: 150000 },
      ]),
      notes: '',
      createdAt: new Date(),
    },
  });

  console.log('✅ Seed complete');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
