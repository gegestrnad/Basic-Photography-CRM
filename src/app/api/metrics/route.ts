import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toErrorResponse } from '@/lib/api-error';
import type { Metrics } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const [jobs, tasks, wds] = await Promise.all([
      db.job.findMany(),
      db.task.findMany(),
      db.wageDistribution.findMany(),
    ]);

    const now = new Date(); now.setHours(0,0,0,0);

    const activeJobs = jobs.filter(j => j.status !== 'Completed' && j.status !== 'Cancelled').length;
    const upcomingActiveJobs = jobs.filter(j => {
      const d = new Date(j.jobDate); d.setHours(0,0,0,0);
      return d >= now && j.status !== 'Completed' && j.status !== 'Cancelled';
    }).length;
    const jobsInEditing = jobs.filter(j => j.status === 'Editing').length;
    const outstandingBalance = jobs.reduce((sum, j) => sum + (j.balance || 0), 0);
    const openTasks = tasks.filter(t => {
      const s = (t.status || '').toUpperCase();
      return s !== 'DONE' && s !== 'CANCELLED';
    }).length;
    const overdueOpenTasks = tasks.filter(t => {
      const s = (t.status || '').toUpperCase();
      if (s === 'DONE' || s === 'CANCELLED') return false;
      const d = new Date(t.dueDate); d.setHours(0,0,0,0);
      return d < now;
    }).length;

    const metrics: Metrics = {
      activeJobs,
      upcomingActiveJobs,
      jobsInEditing,
      outstandingBalance,
      openTasks,
      overdueOpenTasks,
      totalWageRecords: wds.length,
      totalWagesCalculated: wds.reduce((s, w) => s + w.distributableBase, 0),
    };

    return NextResponse.json({ metrics });
  } catch (err) {
    return toErrorResponse(err);
  }
}
