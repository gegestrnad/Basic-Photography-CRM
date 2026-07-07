import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from '@/components/app-shell';

// Mock the providers that AppShell's children depend on
vi.mock('@/lib/store', () => ({
  useAppStore: (selector: any) =>
    selector({
      view: 'dashboard',
      setView: vi.fn(),
    }),
}));

vi.mock('@/components/language-provider', () => ({
  useLang: () => ({
    lang: 'en',
    setLang: vi.fn(),
    t: {
      nav_dashboard: 'Dashboard',
      nav_jobs: 'Jobs',
      nav_payments: 'Payments',
      nav_tasks: 'Tasks',
      nav_wages: 'Wages',
      nav_settings: 'Settings',
    },
  }),
}));

describe('<AppShell />', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <AppShell>
        <div>Test content</div>
      </AppShell>
    );
    expect(container).toBeTruthy();
  });

  it('renders children content', () => {
    render(
      <AppShell>
        <div>Hello World</div>
      </AppShell>
    );
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders the app branding in the sidebar', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );
    expect(screen.getByText('Photography Client')).toBeInTheDocument();
    expect(screen.getByText('Management')).toBeInTheDocument();
  });

  it('renders all 6 nav items in the desktop sidebar', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );
    // Sidebar renders all nav labels (Dashboard, Jobs, Payments, Tasks, Wages, Settings)
    // Mobile nav also renders them, so we use getAllByText and check count >= 1
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Jobs').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Payments').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Tasks').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Wages').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1);
  });
});
