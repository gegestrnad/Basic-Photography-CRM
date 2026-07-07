import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  toDateInput,
  fromDateInput,
  formatDateRelative,
  daysFromToday,
  generateId,
  computeWageBreakdown,
} from '@/lib/format';

describe('format helpers', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers as Indonesian Rupiah', () => {
      expect(formatCurrency(1600000)).toBe('Rp1.600.000');
      expect(formatCurrency(500000)).toBe('Rp500.000');
      expect(formatCurrency(0)).toBe('Rp0');
    });

    it('handles null/undefined/NaN', () => {
      expect(formatCurrency(null)).toBe('Rp0');
      expect(formatCurrency(undefined)).toBe('Rp0');
      expect(formatCurrency(NaN)).toBe('Rp0');
    });

    it('rounds decimals', () => {
      expect(formatCurrency(1599999.9)).toBe('Rp1.600.000');
    });
  });

  describe('formatDate', () => {
    it('formats ISO date string as "DD MMM YYYY" (English)', () => {
      expect(formatDate('2026-06-14T00:00:00.000Z', 'en')).toMatch(/14 \w{3} 2026/);
    });

    it('formats in Indonesian when lang=id', () => {
      const result = formatDate('2026-05-14T00:00:00.000Z', 'id');
      expect(result).toContain('Mei'); // May in Indonesian
    });

    it('returns — for null/empty', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate('')).toBe('—');
      expect(formatDate(undefined)).toBe('—');
    });
  });

  describe('toDateInput / fromDateInput', () => {
    it('round-trips a date through input format and back', () => {
      const iso = '2026-07-15T00:00:00.000Z';
      const inputVal = toDateInput(iso);
      expect(inputVal).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const back = fromDateInput(inputVal)!;
      expect(new Date(back).getFullYear()).toBe(2026);
    });

    it('toDateInput returns empty for null', () => {
      expect(toDateInput(null)).toBe('');
      expect(toDateInput(undefined)).toBe('');
    });

    it('fromDateInput returns null for empty', () => {
      expect(fromDateInput('')).toBeNull();
      expect(fromDateInput(null as any)).toBeNull();
    });
  });

  describe('formatDateRelative', () => {
    it('returns "Today" for current date', () => {
      const now = new Date().toISOString();
      expect(formatDateRelative(now, 'en')).toBe('Today');
    });

    it('returns "Tomorrow" for next day', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(formatDateRelative(tomorrow.toISOString(), 'en')).toBe('Tomorrow');
    });

    it('returns "Yesterday" for previous day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatDateRelative(yesterday.toISOString(), 'en')).toBe('Yesterday');
    });

    it('supports custom labels', () => {
      const now = new Date().toISOString();
      expect(formatDateRelative(now, 'id', { today: 'Hari ini' })).toBe('Hari ini');
    });
  });

  describe('daysFromToday', () => {
    it('returns 0 for today', () => {
      expect(daysFromToday(new Date().toISOString())).toBe(0);
    });

    it('returns positive for future dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      expect(daysFromToday(future.toISOString())).toBe(7);
    });

    it('returns negative for past dates', () => {
      const past = new Date();
      past.setDate(past.getDate() - 3);
      expect(daysFromToday(past.toISOString())).toBe(-3);
    });

    it('returns null for invalid input', () => {
      expect(daysFromToday(null)).toBeNull();
      expect(daysFromToday('')).toBeNull();
    });
  });

  describe('generateId', () => {
    it('generates sequential IDs', () => {
      expect(generateId('JOB', ['JOB-0001'])).toBe('JOB-0002');
      expect(generateId('JOB', ['JOB-0001', 'JOB-0002'])).toBe('JOB-0003');
    });

    it('starts at 0001 for empty list', () => {
      expect(generateId('PAY', [])).toBe('PAY-0001');
    });

    it('handles non-sequential existing IDs', () => {
      expect(generateId('TSK', ['TSK-0001', 'TSK-0005', 'TSK-0010'])).toBe('TSK-0011');
    });
  });

  describe('computeWageBreakdown', () => {
    const rules = [
      { role: 'Photographer A', percentage: 0.30 },
      { role: 'Photo Editor', percentage: 0.12 },
      { role: 'Photographer B', percentage: 0.24 },
      { role: 'General Staff', percentage: 0.05 },
      { role: 'Manager', percentage: 0.29 },
    ];

    it('computes breakdown matching the Excel sample (1.6M base, 3 staff)', () => {
      const staff = [
        { name: 'Gege', roles: ['Photographer A', 'Photo Editor'] },
        { name: 'Sude', roles: ['Photographer B', 'General Staff'] },
        { name: 'Roni', roles: ['Manager'] },
      ];
      const { breakdown, totalCheck, isVerified } = computeWageBreakdown(1000000, rules, staff);
      expect(breakdown).toHaveLength(3);
      expect(totalCheck).toBe(1000000);
      expect(isVerified).toBe(true);

      const gege = breakdown.find(b => b.staffName === 'Gege')!;
      expect(gege.percentage).toBeCloseTo(0.42);
      expect(gege.amount).toBe(420000);

      const sude = breakdown.find(b => b.staffName === 'Sude')!;
      expect(sude.percentage).toBeCloseTo(0.29);
      expect(sude.amount).toBe(290000);

      const roni = breakdown.find(b => b.staffName === 'Roni')!;
      expect(roni.percentage).toBeCloseTo(0.29);
      expect(roni.amount).toBe(290000);
    });

    it('skips staff with no matching roles', () => {
      const staff = [
        { name: 'Gege', roles: ['Photographer A'] },
        { name: 'Unknown', roles: ['Nonexistent Role'] },
      ];
      const { breakdown } = computeWageBreakdown(100000, rules, staff);
      expect(breakdown).toHaveLength(1);
      expect(breakdown[0].staffName).toBe('Gege');
    });

    it('skips staff with empty roles', () => {
      const staff = [
        { name: 'Gege', roles: ['Photographer A'] },
        { name: 'Newbie', roles: [] },
      ];
      const { breakdown } = computeWageBreakdown(100000, rules, staff);
      expect(breakdown).toHaveLength(1);
    });

    it('handles empty staff array', () => {
      const { breakdown, totalCheck, isVerified } = computeWageBreakdown(100000, rules, []);
      expect(breakdown).toHaveLength(0);
      expect(totalCheck).toBe(0);
      expect(isVerified).toBe(false);
    });

    it('adjusts largest amount to fix rounding', () => {
      const staff = [
        { name: 'A', roles: ['Photographer A'] }, // 30%
        { name: 'B', roles: ['Photo Editor'] },   // 12%
      ];
      // 33.33% of 1000 = 333.33 → rounds to 333, diff of 1 applied to largest
      const { breakdown, totalCheck, isVerified } = computeWageBreakdown(1000, rules, staff);
      expect(totalCheck).toBe(1000);
      expect(isVerified).toBe(true);
    });
  });
});
