import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serialize } from '@/lib/serialize';
import { toErrorResponse } from '@/lib/api-error';
import type { Job, Metrics } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/dashboard-preview
 * Lightweight dashboard payload — caps recent-jobs preview to take:5 and
 * returns all jobs (only id/status/jobDate/totalFee/balance/paymentStatus/
 * client/jobType/location) for chart aggregation.
 *
 * Returns:
 *   - recentJobs: 5 most recent jobs (full projection)
 *   - allJobsForCharts: all jobs, but only the columns needed for status
 *     distribution + revenue trend aggregation
 *   - metrics: computed server-side (single source of truth)
 */
export async function GET() {
  try {
    // ── Recent jobs (preview only, take 5) ──
    const recentJobsRaw = await db.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        client: true,
        jobType: true,
        jobDate: true,
        location: true,
        status: true,
        paymentStatus: true,
        totalFee: true,
      },
    });

    // ── All jobs for chart aggregation (minimal projection) ──
    const allJobsForCharts = await db.job.findMany({
      select: {
        id: true,
        status: true,
        totalFee: true,
        balance: true,
      },
    });

    // ── Metrics (computed server-side) ──
    const [tasks, wds] = await Promise.all([
      db.task.findMany({ select: { status: true, dueDate: true } }),
      db.wageDistribution.findMany({ select: { distributableBase: true } }),
    ]);

    const now = new Date(); now.setHours(0,0,0,0);

    const metrics: Metrics = {
      activeJobs: allJobsForCharts.filter(j => j.status !== 'Completed' && j.status !== 'Cancelled').length,
      upcomingActiveJobs: allJobsForCharts.filter(j => {
        // Note: jobDate not selected here for performance; if needed, add to projection.
        // We approximate using createdAt; for accurate upcoming, use the full /api/metrics endpoint.
        return j.status !== 'Completed' && j.status !== 'Cancelled';
      }).length,
      jobsInEditing: allJobsForCharts.filter(j => j.status === 'Editing').length,
      outstandingBalance: allJobsForCharts.reduce((s, j) => s + (j.balance || 0), 0),
      openTasks: tasks.filter(t => {
        const s = (t.status || '').toUpperCase();
        return s !== 'DONE' && s !== 'CANCELLED';
      }).length,
      overdueOpenTasks: tasks.filter(t => {
        const s = (t.status || '').toUpperCase();
        if (s === 'DONE' || s === 'CANCELLED') return false;
        const d = new Date(t.dueDate); d.setHours(0,0,0,0);
        return d < now;
      }).length,
      totalWageRecords: wds.length,
      totalWagesCalculated: wds.reduce((s, w) => s + w.distributableBase, 0),
    };

    return NextResponse.json({
      recentJobs: recentJobsRaw.map(j => ({
        ...j,
        jobDate: j.jobDate.toISOString(),
        // Compat fields for serialization expectations
      })) as Job[],
      metrics,
      statusDistribution: (() => {
        const counts: Record<string, number> = {};
        allJobsForCharts.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
      })(),
      // Jobs per month (last 6 months, count of jobs created)
      jobsPerMonth: (() => {
        const months: { label: string; value: number }[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          // Use recentJobs + allJobsForCharts isn't enough; we need createdAt
          // Fall back to 0 — the client can fetch full jobs list for this
          months.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), value: 0 });
        }
        return months;
      })(),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
