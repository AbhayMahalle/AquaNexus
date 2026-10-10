'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { apiRequest, showToast } from '@/lib/api';
import { Settings, Edit, Save, Shield } from 'lucide-react';

export default function PlatformSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<any>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<any>('/platform/settings');
      if (res.ok && res.data) {
        setSettings(res.data.settings || []);
      } else {
        showToast(res.error || 'Failed to load settings', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const openEditModal = (item: any) => {
    setSelectedSetting(item);
    setEditValue(item.value);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSetting) return;

    setIsSaving(true);
    try {
      const res = await apiRequest('/platform/settings', {
        method: 'PUT',
        body: JSON.stringify({
          key: selectedSetting.key,
          value: editValue,
        }),
      });

      if (res.ok) {
        showToast(`Setting '${selectedSetting.key}' updated`, 'success');
        setIsModalOpen(false);
        fetchSettings();
      } else {
        showToast(res.error || 'Failed to update setting', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating setting', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'key',
      header: 'Setting Key',
      render: (s) => (
        <div>
          <span className="font-mono font-bold text-black">{s.key}</span>
          <span className="block text-xs text-gray-500">{s.description || '—'}</span>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Configured Value',
      render: (s) => (
        <span className="font-semibold text-gray-800 bg-gray-50 px-2.5 py-1 rounded border border-gray-200">
          {s.value}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (s) => (
        <Badge variant="neutral" size="sm">
          {s.category || 'GENERAL'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <Button variant="ghost" size="sm" onClick={() => openEditModal(s)}>
          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
        </Button>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={['super_admin']}>
      <DashboardLayout>
        <div className="text-black">
          <PageHeader
            title="Platform Settings & Configuration"
            description="Global parameters for AquaNexus Multi-Tenant SaaS platform owned by Aazira Solution"
            breadcrumbs={[{ label: 'Platform' }, { label: 'Settings' }]}
          />

          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-700" />
                <span>Platform Parameters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                columns={columns}
                data={settings}
                emptyText="No platform settings configured"
              />
            </CardContent>
          </Card>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={`Configure: ${selectedSetting?.key || ''}`}
            description={selectedSetting?.description || 'Update platform setting value'}
            footer={
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} loading={isSaving}>
                  Save Setting
                </Button>
              </>
            }
          >
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Setting Value"
                required
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter value"
              />
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
