'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function LoginView() {
  const setAuth = useAppStore(s => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        // Verify session
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated) {
          setAuth(true, sessionData.user);
          toast.success('Welcome back!');
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        setError('Invalid email or password');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-sm w-full">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="size-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Calculator className="size-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Photography Client</h1>
          <p className="text-sm text-muted-foreground mt-1">Management System</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-2xl p-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="pl-9"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-2.5">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="size-4 mr-1 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Demo credentials hint */}
        <p className="text-xs text-center text-muted-foreground mt-4">
          Demo: <code className="font-mono text-foreground/80">admin@example.com</code> / <code className="font-mono text-foreground/80">admin123</code>
        </p>
      </div>
    </div>
  );
}
