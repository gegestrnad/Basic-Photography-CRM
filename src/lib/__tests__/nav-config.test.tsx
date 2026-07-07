import { describe, it, expect } from 'vitest';
import { NAV_ITEMS } from '@/lib/nav-config';

describe('NAV_ITEMS config', () => {
  it('contains exactly 7 items', () => {
    expect(NAV_ITEMS).toHaveLength(7);
  });

  it('includes all 7 views', () => {
    const keys = NAV_ITEMS.map(i => i.key);
    expect(keys).toEqual(
      expect.arrayContaining(['dashboard', 'jobs', 'payments', 'tasks', 'wages', 'clients', 'settings'])
    );
  });

  it('has exactly 4 mobile-eligible items (dashboard, jobs, payments, tasks)', () => {
    const mobileItems = NAV_ITEMS.filter(i => i.mobile);
    expect(mobileItems).toHaveLength(4);
    expect(mobileItems.map(i => i.key)).not.toContain('settings');
    expect(mobileItems.map(i => i.key)).not.toContain('wages');
    expect(mobileItems.map(i => i.key)).not.toContain('clients');
  });

  it('each item has an icon component', () => {
    for (const item of NAV_ITEMS) {
      expect(item.icon).toBeDefined();
      // Lucide icons are forwardRef components (typeof === 'object' or 'function')
      // Just verify it's a valid React component type
      expect(['function', 'object']).toContain(typeof item.icon);
    }
  });

  it('each item has a labelKey matching a nav translation key', () => {
    const validKeys = [
      'nav_dashboard', 'nav_jobs', 'nav_payments',
      'nav_tasks', 'nav_wages', 'nav_clients', 'nav_settings',
    ];
    for (const item of NAV_ITEMS) {
      expect(validKeys).toContain(item.labelKey);
    }
  });

  it('keys are unique', () => {
    const keys = NAV_ITEMS.map(i => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
