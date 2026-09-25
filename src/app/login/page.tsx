'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { UserRole } from '@/types/auth';
import { getDashboardRoute } from '@/lib/navigation';
import { Droplets, Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

const ROLE_EMAILS: Record<UserRole, string> = {
  admin: 'admin@aquanexus.com',
  manager: 'manager@aquanexus.com',
  store_manager: 'store@aquanexus.com',
  accountant: 'accountant@aquanexus.com',
  distributor: 'distributor@aquanexus.com',
  operator: 'manager@aquanexus.com',
};

export default function LoginPage() {
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('admin@aquanexus.com');
  const [password, setPassword] = useState('Password@123');
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
      // Determine the effective role from the selected roleOverride or entered email
      let effectiveRole = roleOverride;
      const lowerEmail = email.toLowerCase().trim();
      if (lowerEmail.includes('admin')) effectiveRole = 'admin';
      else if (lowerEmail.includes('manager') && !lowerEmail.includes('store')) effectiveRole = 'manager';
      else if (lowerEmail.includes('store')) effectiveRole = 'store_manager';
      else if (lowerEmail.includes('finance') || lowerEmail.includes('accountant')) effectiveRole = 'accountant';
      else if (lowerEmail.includes('distributor')) effectiveRole = 'distributor';
      else if (lowerEmail.includes('operator')) effectiveRole = 'operator';

      // Always open the proper dashboard dedicated to the role
      const targetDashboard = getDashboardRoute(effectiveRole);

      await login({
        email,
        password,
        roleOverride: effectiveRole,
        redirectTo: targetDashboard,
      });
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white p-4 sm:p-6 text-black">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 shadow-xs mb-3">
          <Droplets className="w-8 h-8 text-orange-600 fill-orange-200" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
          Aqua<span className="text-orange-600 font-extrabold">Nexus</span> ERP
        </h1>
        <p className="text-xs sm:text-sm text-gray-700 mt-1 font-medium">
          Water Plant Operations & Enterprise Management
        </p>
      </div>

      <Card className="w-full max-w-md bg-white shadow-xs border-gray-200 rounded-2xl">
        <CardHeader className="border-b border-gray-200 pb-4">
          <CardTitle className="text-lg sm:text-xl font-bold text-black flex items-center gap-2">
            <span>Sign In to Account</span>
          </CardTitle>
          <CardDescription className="text-xs text-gray-700">
            Enter your employee credentials to access plant systems
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-5">
            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs font-medium flex items-center gap-2">
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
              label="Select User Role (Demo Persona)"
              value={roleOverride}
              onChange={(e) => {
                const r = e.target.value as UserRole;
                setRoleOverride(r);
                setEmail(ROLE_EMAILS[r] || `${r}@aquanexus.com`);
              }}
              options={[
                { label: 'Admin (System Lead)', value: 'admin' },
                { label: 'Operations Manager', value: 'manager' },
                { label: 'Store & Inventory Manager', value: 'store_manager' },
                { label: 'Chief Accountant', value: 'accountant' },
                { label: 'Distributor Agency', value: 'distributor' },
                { label: 'Line Operator', value: 'operator' },
              ]}
              helperText="Auto-populates credentials and role-specific permissions"
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
              <span className="text-[11px] text-textSecondary flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                AquaNexus Enterprise Security • Verified SSL
              </span>
            </div>
          </CardFooter>
        </form>
      </Card>

      <p className="text-xs text-textMuted mt-6 text-center">
        AquaNexus Water Plant ERP • Enterprise Platform
      </p>
    </div>
  );
}