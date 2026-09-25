
'use client';
import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { apiClient } from '@/lib/api-client';

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get('/api/dispatch');
        if (res.success) {
          setData(res.data.data || res.data.logs || res.data); // handles paginated or array
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Dispatch" description="Manage dispatch" />
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : !data || data.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No data available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-4 text-sm font-medium text-gray-500 uppercase">Dispatch No</th><th className="p-4 text-sm font-medium text-gray-500 uppercase">Status</th><th className="p-4 text-sm font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-4 text-sm">{item.dispatchNumber || '-'}</td><td className="p-4 text-sm">{item.status || '-'}</td><td className="p-4 text-sm">{item.dispatchDate || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
