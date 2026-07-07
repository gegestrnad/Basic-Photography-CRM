// Seed script — populate database with realistic sample data + default config
// Run: bun run /home/z/my-project/scripts/seed.ts

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with realistic sample data...');

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
    { name: 'Gege', primaryRole: 'Photographer', phone: '0812-3456-7890', notes: 'Lead photographer', roles: JSON.stringify(['Photographer A', 'Photo Editor']), sortOrder: 0 },
    { name: 'Sude', primaryRole: 'Editor', phone: '0813-4567-8901', notes: '', roles: JSON.stringify(['Photographer B', 'General Staff / Operational & Misc']), sortOrder: 1 },
    { name: 'Roni', primaryRole: 'Assistant Photographer', phone: '0814-5678-9012', notes: 'Client relations lead', roles: JSON.stringify(['Manager / Client Relations']), sortOrder: 2 },
  ];
  for (const s of staff) {
    await db.staff.create({ data: s });
  }

  // ── Wipe existing data ──────────────────────────────────────
  await db.payment.deleteMany();
  await db.task.deleteMany();
  await db.wageDistribution.deleteMany();
  await db.job.deleteMany();

  // ── Sample Jobs (realistic mix across all statuses) ─────────
  // Dates computed relative to "now" so the dashboard always has fresh demo state
  const now = new Date();
  const daysFromNow = (n: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + n);

  const jobs = [
    {
      id: 'JOB-0001', client: 'Isna & Edrika', phone: '0812-1111-2222',
      jobType: 'Wedding', jobDate: daysFromNow(-23),
      location: 'Kantor Camat Sui. Raya', status: 'Editing', paymentStatus: 'PAID',
      totalFee: 1600000, deposit: 1600000, balance: 0,
      photographers: 'Gege, Sude', editors: 'Gege',
      clientSource: 'Referral', notes: 'Outdoor ceremony, sunset shots',
      createdAt: daysFromNow(-25),
    },
    {
      id: 'JOB-0002', client: 'PT Maju Bersama', phone: '021-555-0101',
      jobType: 'Company Event', jobDate: daysFromNow(-10),
      location: 'Hotel Grand Ballroom', status: 'Ready', paymentStatus: 'PAID',
      totalFee: 5000000, deposit: 2500000, balance: 0,
      photographers: 'Gege, Roni', editors: 'Sude',
      clientSource: 'Returning Client', notes: 'Annual gala dinner, 200 guests',
      createdAt: daysFromNow(-15),
    },
    {
      id: 'JOB-0003', client: 'Anisa Putri', phone: '0813-2222-3333',
      jobType: 'Engagement', jobDate: daysFromNow(5),
      location: 'Taman Kota', status: 'Booked', paymentStatus: 'Deposit-Paid',
      totalFee: 2500000, deposit: 1000000, balance: 1500000,
      photographers: 'Gege', editors: 'Gege',
      clientSource: 'Instagram', notes: 'Morning session, golden hour',
      createdAt: daysFromNow(-7),
    },
    {
      id: 'JOB-0004', client: 'Budi & Wati', phone: '0814-3333-4444',
      jobType: 'Wedding', jobDate: daysFromNow(12),
      location: 'Gedung Serbaguna Harmoni', status: 'Booked', paymentStatus: 'Deposit-Paid',
      totalFee: 8000000, deposit: 3000000, balance: 5000000,
      photographers: 'Gege, Sude, Roni', editors: 'Gege, Sude',
      clientSource: 'WhatsApp', notes: 'Full day coverage, 2 venues',
      createdAt: daysFromNow(-3),
    },
    {
      id: 'JOB-0005', client: 'Citra Lestari', phone: '0815-4444-5555',
      jobType: 'Portrait', jobDate: daysFromNow(2),
      location: 'Studio', status: 'Inquiry', paymentStatus: 'UNPAID',
      totalFee: 800000, deposit: 0, balance: 800000,
      photographers: 'Gege', editors: 'Gege',
      clientSource: 'Facebook', notes: 'Family portrait, 6 people',
      createdAt: daysFromNow(-1),
    },
    {
      id: 'JOB-0006', client: 'Dewi Saraswati', phone: '0816-5555-6666',
      jobType: 'Product', jobDate: daysFromNow(-30),
      location: 'Client office', status: 'Completed', paymentStatus: 'PAID',
      totalFee: 3500000, deposit: 3500000, balance: 0,
      photographers: 'Sude', editors: 'Sude',
      clientSource: 'Website', notes: 'Catalog product shots, 30 items',
      createdAt: daysFromNow(-35),
    },
    {
      id: 'JOB-0007', client: 'Eka Pratama', phone: '0817-6666-7777',
      jobType: 'Family', jobDate: daysFromNow(-5),
      location: 'Pantai Indah', status: 'Delivered', paymentStatus: 'PAID',
      totalFee: 1500000, deposit: 1500000, balance: 0,
      photographers: 'Roni', editors: 'Gege',
      clientSource: 'Referral', notes: 'Extended family, 15 people',
      createdAt: daysFromNow(-12),
    },
    {
      id: 'JOB-0008', client: 'Fajar Nugroho', phone: '0818-7777-8888',
      jobType: 'Wedding', jobDate: daysFromNow(-45),
      location: 'Gereja Santa Maria', status: 'Completed', paymentStatus: 'PAID',
      totalFee: 6000000, deposit: 6000000, balance: 0,
      photographers: 'Gege, Sude', editors: 'Gege',
      clientSource: 'Returning Client', notes: 'Church + reception',
      createdAt: daysFromNow(-50),
    },
  ];

  for (const j of jobs) {
    await db.job.create({ data: j });
  }

  // ── Sample Payments ─────────────────────────────────────────
  const payments = [
    // JOB-0001 — Isna & Edrika (fully paid)
    { id: 'PAY-0001', jobId: 'JOB-0001', client: 'Isna & Edrika', paymentDate: daysFromNow(-22), amount: 1600000, method: 'Cash', status: 'PAID', jobTotalFee: 1600000, jobBalance: 0, notes: 'Full payment on event day' },
    // JOB-0002 — PT Maju Bersama (deposit + balance)
    { id: 'PAY-0002', jobId: 'JOB-0002', client: 'PT Maju Bersama', paymentDate: daysFromNow(-14), amount: 2500000, method: 'Bank Transfer', status: 'PAID', jobTotalFee: 5000000, jobBalance: 2500000, notes: 'Deposit 50%' },
    { id: 'PAY-0003', jobId: 'JOB-0002', client: 'PT Maju Bersama', paymentDate: daysFromNow(-9), amount: 2500000, method: 'Bank Transfer', status: 'PAID', jobTotalFee: 5000000, jobBalance: 0, notes: 'Final payment' },
    // JOB-0003 — Anisa Putri (deposit only)
    { id: 'PAY-0004', jobId: 'JOB-0003', client: 'Anisa Putri', paymentDate: daysFromNow(-6), amount: 1000000, method: 'QRIS', status: 'PAID', jobTotalFee: 2500000, jobBalance: 1500000, notes: 'Deposit' },
    // JOB-0004 — Budi & Wati (deposit only)
    { id: 'PAY-0005', jobId: 'JOB-0004', client: 'Budi & Wati', paymentDate: daysFromNow(-2), amount: 3000000, method: 'Bank Transfer', status: 'PAID', jobTotalFee: 8000000, jobBalance: 5000000, notes: 'Booking deposit' },
    // JOB-0006 — Dewi Saraswati (fully paid)
    { id: 'PAY-0006', jobId: 'JOB-0006', client: 'Dewi Saraswati', paymentDate: daysFromNow(-30), amount: 3500000, method: 'E-wallet', status: 'PAID', jobTotalFee: 3500000, jobBalance: 0, notes: '' },
    // JOB-0007 — Eka Pratama (fully paid)
    { id: 'PAY-0007', jobId: 'JOB-0007', client: 'Eka Pratama', paymentDate: daysFromNow(-11), amount: 1500000, method: 'Cash', status: 'PAID', jobTotalFee: 1500000, jobBalance: 0, notes: '' },
    // JOB-0008 — Fajar Nugroho (fully paid)
    { id: 'PAY-0008', jobId: 'JOB-0008', client: 'Fajar Nugroho', paymentDate: daysFromNow(-48), amount: 6000000, method: 'Bank Transfer', status: 'PAID', jobTotalFee: 6000000, jobBalance: 0, notes: 'Full payment' },
  ];

  for (const p of payments) {
    await db.payment.create({ data: p });
  }

  // ── Sample Tasks ────────────────────────────────────────────
  const tasks = [
    { id: 'TSK-0001', jobId: 'JOB-0001', client: 'Isna & Edrika', task: 'Editing', dueDate: daysFromNow(-2), status: 'IN PROGRESS', notes: '500+ photos to cull and edit' },
    { id: 'TSK-0002', jobId: 'JOB-0001', client: 'Isna & Edrika', task: 'Deliver final gallery', dueDate: daysFromNow(3), status: 'OPEN', notes: '' },
    { id: 'TSK-0003', jobId: 'JOB-0002', client: 'PT Maju Bersama', task: 'Send preview gallery', dueDate: daysFromNow(-1), status: 'DONE', notes: 'Client approved' },
    { id: 'TSK-0004', jobId: 'JOB-0003', client: 'Anisa Putri', task: 'Confirm shot list', dueDate: daysFromNow(1), status: 'OPEN', notes: '' },
    { id: 'TSK-0005', jobId: 'JOB-0004', client: 'Budi & Wati', task: 'Scout venues', dueDate: daysFromNow(5), status: 'OPEN', notes: 'Church + reception hall' },
    { id: 'TSK-0006', jobId: 'JOB-0004', client: 'Budi & Wati', task: 'Book second shooter', dueDate: daysFromNow(3), status: 'WAITING', notes: 'Waiting for Roni confirmation' },
    { id: 'TSK-0007', jobId: 'JOB-0005', client: 'Citra Lestari', task: 'Send quote', dueDate: daysFromNow(0), status: 'OPEN', notes: 'Follow up if no response' },
    { id: 'TSK-0008', jobId: 'JOB-0007', client: 'Eka Pratama', task: 'Backup raw files', dueDate: daysFromNow(-4), status: 'DONE', notes: '' },
    // Overdue task
    { id: 'TSK-0009', jobId: 'JOB-0006', client: 'Dewi Saraswati', task: 'Send invoice', dueDate: daysFromNow(-25), status: 'IN PROGRESS', notes: 'Waiting for tax ID' },
  ];

  for (const t of tasks) {
    await db.task.create({ data: t });
  }

  // ── Sample Wage Distributions ───────────────────────────────
  const wageDistributions = [
    // Matches the Excel Wage Dist sheet exactly
    {
      id: 'WD-0001', jobId: 'JOB-0001', grossAmount: 1600000, distributableBase: 1000000, totalPaid: 1600000,
      breakdown: JSON.stringify([
        { staffName: 'Gege', role: 'Photographer', roles: ['Photographer A', 'Photo Editor'], percentage: 0.42, amount: 420000 },
        { staffName: 'Sude', role: 'Editor', roles: ['Photographer B', 'General Staff / Operational & Misc'], percentage: 0.29, amount: 290000 },
        { staffName: 'Roni', role: 'Assistant Photographer', roles: ['Manager / Client Relations'], percentage: 0.29, amount: 290000 },
      ]),
      operationalExpenses: JSON.stringify([
        { name: 'Printing', amount: 450000 },
        { name: 'Rental Gears/Lighting/etc', amount: 150000 },
      ]),
      notes: '', createdAt: daysFromNow(-20),
    },
    {
      id: 'WD-0002', jobId: 'JOB-0002', grossAmount: 5000000, distributableBase: 4000000, totalPaid: 5000000,
      breakdown: JSON.stringify([
        { staffName: 'Gege', role: 'Photographer', roles: ['Photographer A', 'Photo Editor'], percentage: 0.42, amount: 1680000 },
        { staffName: 'Sude', role: 'Editor', roles: ['Photographer B', 'General Staff / Operational & Misc'], percentage: 0.29, amount: 1160000 },
        { staffName: 'Roni', role: 'Assistant Photographer', roles: ['Manager / Client Relations'], percentage: 0.29, amount: 1160000 },
      ]),
      operationalExpenses: JSON.stringify([
        { name: 'Printing', amount: 500000 },
        { name: 'Rental Gears/Lighting/etc', amount: 500000 },
      ]),
      notes: 'Large corporate event — higher expenses', createdAt: daysFromNow(-8),
    },
    {
      id: 'WD-0003', jobId: 'JOB-0008', grossAmount: 6000000, distributableBase: 5000000, totalPaid: 6000000,
      breakdown: JSON.stringify([
        { staffName: 'Gege', role: 'Photographer', roles: ['Photographer A', 'Photo Editor'], percentage: 0.42, amount: 2100000 },
        { staffName: 'Sude', role: 'Editor', roles: ['Photographer B', 'General Staff / Operational & Misc'], percentage: 0.29, amount: 1450000 },
        { staffName: 'Roni', role: 'Assistant Photographer', roles: ['Manager / Client Relations'], percentage: 0.29, amount: 1450000 },
      ]),
      operationalExpenses: JSON.stringify([
        { name: 'Printing', amount: 600000 },
        { name: 'Rental Gears/Lighting/etc', amount: 400000 },
      ]),
      notes: '', createdAt: daysFromNow(-43),
    },
  ];

  for (const w of wageDistributions) {
    await db.wageDistribution.create({ data: w });
  }

  console.log('✅ Seed complete');
  console.log(`  - ${jobs.length} jobs across all statuses`);
  console.log(`  - ${payments.length} payments (mix of PAID / Deposit-Paid)`);
  console.log(`  - ${tasks.length} tasks (including 1 overdue)`);
  console.log(`  - ${wageDistributions.length} wage distributions`);
  console.log(`  - ${staff.length} staff with mapped roles`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
