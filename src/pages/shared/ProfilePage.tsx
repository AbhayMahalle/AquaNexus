import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Mail, Phone, Building2, BadgeCheck, Calendar, Edit2, Save, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { employeeService } from '@/services/employeeService';

export function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await apiClient.getMyProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        setFormData({
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          phone: res.data.phone || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      // In AquaNexus backend, the update payload uses contactNumber and name
      // depending on the exact service signature. Let's map it safely:
      const updates = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        contactNumber: formData.phone,
      };
      
      const res = await employeeService.updateEmployee(profile.id, updates);
      if (res.success) {
        // reload data
        await loadData();
        setIsEditing(false);
      } else {
        alert(res.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-gray-500">Profile data not available.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="My Profile"
          description="View and manage your personal and employment details"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'My Profile' }
          ]}
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
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  onClick={handleSave}
                  loading={saving}
                >
                  Save Changes
                </Button>
              </div>
            )
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Info */}
          <Card>
            <CardHeader className="border-b pb-4 mb-4">
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-blue-500" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b gap-2">
                <span className="text-sm text-gray-500 font-medium">First Name</span>
                {isEditing ? (
                  <Input 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="max-w-xs"
                  />
                ) : (
                  <span className="font-semibold">{profile.firstName}</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b gap-2">
                <span className="text-sm text-gray-500 font-medium">Last Name</span>
                {isEditing ? (
                  <Input 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="max-w-xs"
                  />
                ) : (
                  <span className="font-semibold">{profile.lastName}</span>
                )}
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-500 font-medium flex items-center gap-1">
                  <Mail className="w-4 h-4" /> Email Address
                </span>
                <span className="font-semibold text-gray-500" title="Email cannot be changed">{profile.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b gap-2">
                <span className="text-sm text-gray-500 font-medium flex items-center gap-1">
                  <Phone className="w-4 h-4" /> Phone Number
                </span>
                {isEditing ? (
                  <Input 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="max-w-xs"
                  />
                ) : (
                  <span className="font-semibold">{profile.phone || '-'}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employment Info */}
          <Card>
            <CardHeader className="border-b pb-4 mb-4">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-500 font-medium">Employee Code</span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm font-bold border border-gray-200">{profile.employeeCode}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-500 font-medium">Department</span>
                <span className="font-semibold">{profile.department?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-500 font-medium">Designation</span>
                <span className="font-semibold">{profile.designation}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-500 font-medium flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Date of Joining
                </span>
                <span className="font-semibold">{profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500 font-medium">Employment Status</span>
                <span className="font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200 text-sm">
                  {profile.status}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
