import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Calendar,
  Edit2,
  Save,
  X,
  Lock,
  ShieldCheck,
  Briefcase,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Truck,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, showToast } from '@/lib/api';
import { setCurrentUserSync, getCurrentUserSync } from '@/lib/auth';

export function ProfilePage() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Profile fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await apiRequest<{ user: any }>('/auth/me');
      if (res.ok && res.data?.user) {
        const u = res.data.user;
        setProfile(u);
        setFormData({
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
        });
      } else if (authUser) {
        // Fallback to local auth context
        setProfile(authUser);
        const nameParts = (authUser.name || '').split(' ');
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          phone: (authUser as any).phone || '',
        });
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      if (authUser) {
        setProfile(authUser);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.firstName.trim()) {
      showToast('First name is required', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await apiRequest<{ user: any }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      if (res.ok && res.data?.user) {
        const updated = res.data.user;
        setProfile(updated);
        setIsEditing(false);
        showToast('Profile updated successfully', 'success');

        // Update local session storage so Topbar reflects changes immediately
        const cached = getCurrentUserSync();
        if (cached) {
          const updatedName = `${updated.firstName} ${updated.lastName}`.trim() || updated.username;
          setCurrentUserSync({
            ...cached,
            name: updatedName,
            avatar: (updated.firstName?.[0] || 'U').toUpperCase(),
          });
          // Dispatch a storage event so reactive components update
          window.dispatchEvent(new Event('storage'));
        }
      } else {
        showToast(res.error || 'Failed to update profile', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Current password is required', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
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
      setSavingPassword(false);
    }
  };

  const displayName = profile
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username || profile.email
    : authUser?.name || 'User Profile';

  const userInitial = (displayName[0] || 'U').toUpperCase();
  const roleName = authUser?.roleTitle || profile?.role?.name || authUser?.role || 'User';
  const orgName = profile?.organization?.name || authUser?.organizationName || 'AquaNexus Plant';
  const employeeData = profile?.employee;
  const userDistributor = profile?.userDistributors?.[0]?.distributor;
  const managerAssignments = profile?.managerAssignments || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <PageHeader
          title="My Profile"
          breadcrumbs={[{ label: 'Dashboard' }, { label: 'Profile' }]}
          action={
            !isEditing ? (
              <Button
                variant="outline"
                icon={<Edit2 className="w-4 h-4" />}
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  icon={<X className="w-4 h-4" />}
                  onClick={() => {
                    setIsEditing(false);
                    if (profile) {
                      setFormData({
                        firstName: profile.firstName || '',
                        lastName: profile.lastName || '',
                        phone: profile.phone || '',
                      });
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                  onClick={() => handleSaveProfile()}
                  loading={savingProfile}
                >
                  Save Changes
                </Button>
              </div>
            )
          }
        />

        {/* Profile Identity Banner */}
        <Card className="border shadow-xs bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold text-3xl shadow-sm ring-4 ring-orange-100 flex-shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Badge variant="primary" className="font-semibold uppercase tracking-wider text-xs">
                      {roleName}
                    </Badge>
                    <Badge variant="success" className="text-xs">
                      {profile?.status || 'ACTIVE'}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 flex items-center justify-center sm:justify-start gap-1.5">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span>{orgName}</span>
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  @{profile?.username || authUser?.username || 'user'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="border shadow-xs bg-white">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-orange-500" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                    {isEditing ? (
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    ) : (
                      <div className="py-2 px-3 bg-gray-50 border rounded-md text-sm font-medium text-gray-900">
                        {profile?.firstName || '-'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                    {isEditing ? (
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    ) : (
                      <div className="py-2 px-3 bg-gray-50 border rounded-md text-sm font-medium text-gray-900">
                        {profile?.lastName || '-'}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" /> Email Address
                  </label>
                  <div className="py-2 px-3 bg-gray-50 border rounded-md text-sm font-mono text-gray-700 flex items-center justify-between">
                    <span>{profile?.email || authUser?.email || '-'}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> Contact Phone
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                    />
                  ) : (
                    <div className="py-2 px-3 bg-gray-50 border rounded-md text-sm font-medium text-gray-900">
                      {profile?.phone || 'Not provided'}
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      icon={<Save className="w-4 h-4" />}
                      loading={savingProfile}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Security & Password */}
          <Card className="border shadow-xs bg-white">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-500" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                  <Input
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <Input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="secondary"
                    icon={<Lock className="w-4 h-4" />}
                    loading={savingPassword}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Contextual Role / Employment Details */}
          {employeeData ? (
            <Card className="border shadow-xs bg-white lg:col-span-2">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-500" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <span className="text-xs text-gray-500 font-medium block mb-1">Employee Code</span>
                    <span className="font-mono text-base font-bold text-gray-900">
                      {employeeData.employeeCode}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <span className="text-xs text-gray-500 font-medium block mb-1">Department</span>
                    <span className="text-base font-semibold text-gray-900">
                      {employeeData.department?.name || 'General Operations'}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <span className="text-xs text-gray-500 font-medium block mb-1">Designation</span>
                    <span className="text-base font-semibold text-gray-900">
                      {employeeData.designation || 'Staff'}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <span className="text-xs text-gray-500 font-medium block mb-1">Date of Joining</span>
                    <span className="text-base font-semibold text-gray-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {employeeData.joiningDate ? new Date(employeeData.joiningDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : userDistributor ? (
            <Card className="border shadow-xs bg-white lg:col-span-2">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-500" />
                  Distributor Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <span className="text-xs text-gray-500 font-medium block mb-1">Distributor Name</span>
                    <span className="text-base font-semibold text-gray-900">{userDistributor.name}</span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <span className="text-xs text-gray-500 font-medium block mb-1">Code</span>
                    <span className="font-mono text-base font-bold text-gray-900">{userDistributor.distributorCode}</span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <span className="text-xs text-gray-500 font-medium block mb-1">Status</span>
                    <Badge variant="success" className="text-xs">
                      {userDistributor.status || 'ACTIVE'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : managerAssignments.length > 0 ? (
            <Card className="border shadow-xs bg-white lg:col-span-2">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" />
                  Manager Operational Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                  {managerAssignments.map((assignment: any) => (
                    <Badge key={assignment.id || assignment.area} variant="info" className="px-3 py-1 text-sm font-semibold">
                      {assignment.area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border shadow-xs bg-white lg:col-span-2">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-500" />
                  Role & System Scope
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <span className="text-xs text-gray-500 font-medium block mb-1">Primary Role</span>
                    <span className="text-base font-semibold text-gray-900">{roleName}</span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <span className="text-xs text-gray-500 font-medium block mb-1">Organization</span>
                    <span className="text-base font-semibold text-gray-900">{orgName}</span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <span className="text-xs text-gray-500 font-medium block mb-1">Account Status</span>
                    <Badge variant="success" className="text-xs">
                      {profile?.status || 'ACTIVE'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
