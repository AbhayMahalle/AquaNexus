import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { UserRole } from '@/types/auth';
import { Droplets, Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('admin@aquanexus.com');
  const [password, setPassword] = useState('password123');
  const [roleOverride, setRoleOverride] = useState<UserRole>('admin');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter a valid email or username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email,
        password,
        roleOverride,
      });
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#0F4C81] via-[#0C3C68] to-[#1597D4] p-4 sm:p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl mb-3">
          <Droplets className="w-9 h-9 text-[#22B8CF]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Aqua<span className="text-[#22B8CF]">Nexus</span> ERP
        </h1>
        <p className="text-sm text-white/80 mt-1 font-medium">
          Water Plant Operations & Enterprise Management (React.js)
        </p>
      </div>

      <Card className="w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl border-white/40">
        <CardHeader className="border-b border-[#E2E8F0] pb-4">
          <CardTitle className="text-xl font-bold text-[#172033] flex items-center gap-2">
            <span>Sign In to Account</span>
          </CardTitle>
          <CardDescription className="text-xs text-[#64748B]">
            Enter your credentials or select a persona for Phase 1 testing
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-5">
            {error && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/20 text-[#DC2626] text-xs font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Email Address or Username"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@aquanexus.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Select
              label="Phase 1 Quick Role Selector (Dev Demo)"
              value={roleOverride}
              onChange={(e) => {
                const r = e.target.value as UserRole;
                setRoleOverride(r);
                setEmail(`${r}@aquanexus.com`);
              }}
              options={[
                { label: '👑 Admin (Mrudula - System Lead)', value: 'admin' },
                { label: '👔 Operations Manager', value: 'manager' },
                { label: '📦 Store Manager (Ram)', value: 'store_manager' },
                { label: '💼 Chief Accountant (Yash)', value: 'accountant' },
                { label: '🚚 Distributor (Niranjan)', value: 'distributor' },
                { label: '⚙️ Line Operator', value: 'operator' },
              ]}
              helperText="Determines user permissions & navigation in demo mode"
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmitting || isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to ERP
            </Button>

            <div className="w-full text-center pt-2">
              <span className="text-[11px] text-[#64748B] flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                Contract Ready Endpoint: <code className="bg-[#F5F8FB] px-1 py-0.5 rounded text-[#0F4C81]">POST /api/auth/login</code>
              </span>
            </div>
          </CardFooter>
        </form>
      </Card>

      <p className="text-xs text-white/60 mt-6 text-center">
        Water Plant ERP Foundation Phase 1 • Lead: Mrudula
      </p>
    </div>
  );
}
