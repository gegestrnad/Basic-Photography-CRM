import { describe, it, expect } from 'vitest';
import { NAV_ITEMS } from '@/lib/nav-config';

describe('NAV_ITEMS config', () => {
  it('contains exactly 6 items', () => {
    expect(NAV_ITEMS).toHaveLength(6);
  });

  it('includes all 6 views', () => {
    const keys = NAV_ITEMS.map(i => i.key);
    expect(keys).toEqual(
      expect.arrayContaining(['dashboard', 'jobs', 'payments', 'tasks', 'wages', 'settings'])
    );
  });

  it('has exactly 5 mobile-eligible items (excluding settings)', () => {
    const mobileItems = NAV_ITEMS.filter(i => i.mobile);
    expect(mobileItems).toHaveLength(5);
    expect(mobileItems.map(i => i.key)).not.toContain('settings');
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
      'nav_tasks', 'nav_wages', 'nav_settings',
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
