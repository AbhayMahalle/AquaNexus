'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiRequest, showToast } from '@/lib/api';
import {
  ShieldCheck,
  User,
  Lock,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function SuperAdminProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Change Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<any>('/platform/profile');
      if (res.ok && res.data) {
        const p = res.data.profile || res.data;
        setProfile(p);
        setFirstName(p.firstName || '');
        setLastName(p.lastName || '');
        setEmail(p.email || '');
        setPhone(p.phone || '');
      } else {
        showToast(res.error || 'Failed to load profile', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) {
      showToast('First name and email are required', 'error');
      return;
    }

    setIsProfileSaving(true);
    try {
      const res = await apiRequest('/platform/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
        }),
      });

      if (res.ok) {
        showToast('Super Admin profile updated successfully', 'success');
        fetchProfile();
      } else {
        showToast(res.error || 'Failed to update profile', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating profile', 'error');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Please enter your current password', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showToast('New password must be at least 8 characters long', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setIsPasswordSaving(true);
    try {
      const res = await apiRequest('/platform/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        showToast('Password changed successfully', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(res.error || 'Failed to change password. Verify your current password.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error changing password', 'error');
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['super_admin']}>
      <DashboardLayout>
        <div className="text-black max-w-4xl">
          <PageHeader
            title="Super Admin Profile & Security"
            description="Manage Aazira Solution platform owner identity, authorized contact details, and account security"
            breadcrumbs={[{ label: 'Platform' }, { label: 'Profile' }]}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="md:col-span-1">
              <CardContent className="pt-6 text-center">
                <div className="w-20 h-20 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-4 border-2 border-purple-200">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-black">
                  {profile ? `${profile.firstName} ${profile.lastName}` : 'Aazira Solution'}
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">@{profile?.username || 'superadmin'}</p>
                <div className="mt-3">
                  <Badge variant="primary" className="font-bold">
                    PLATFORM SUPER ADMIN
                  </Badge>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 text-left text-xs space-y-2 text-gray-600">
                  <p>
                    <strong>Platform Owner:</strong> Aazira Solution
                  </p>
                  <p>
                    <strong>Privilege:</strong> Global Platform Governance
                  </p>
                  <p>
                    <strong>Status:</strong> <span className="text-success font-bold">Active & Verified</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="md:col-span-2 space-y-6">
              {/* Profile Details Form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-600" />
                    <span>Personal & Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="First Name"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Aazira"
                      />
                      <Input
                        label="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Administrator"
                      />
                    </div>

                    <Input
                      label="Platform Owner Email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="superadmin@aquanexus.com"
                      leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
                    />

                    <Input
                      label="Contact Phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
                    />

                    <div className="pt-2">
                      <Button type="submit" variant="primary" loading={isProfileSaving}>
                        Save Profile Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Password Change Form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-600" />
                    <span>Security & Password Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter existing password to verify identity"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="New Secure Password"
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        helperText="Use uppercase, lowercase, and special characters"
                      />

                      <Input
                        label="Confirm New Password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                      />
                    </div>

                    <div className="pt-2">
                      <Button type="submit" variant="primary" loading={isPasswordSaving}>
                        Update Super Admin Password
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
