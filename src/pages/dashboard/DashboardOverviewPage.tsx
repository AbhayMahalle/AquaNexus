import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  CalendarCheck, 
  CalendarOff, 
  Clock, 
  Factory, 
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { employeeService } from '../../services/employeeService';
import { attendanceService } from '../../services/attendanceService';
import { leaveService } from '../../services/leaveService';
import { overtimeService } from '../../services/overtimeService';
import { productionService } from '../../services/productionService';
import type { Production } from '../../types';

export const DashboardOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    approvedOTHours: 0,
    todayProduction: 0,
  });
  const [recentBatches, setRecentBatches] = useState<Production[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOverviewData = async () => {
      setIsLoading(true);
      const [empRes, attRes, leaveRes, otRes, prodRes] = await Promise.all([
        employeeService.getEmployees(),
        attendanceService.getDailyAttendance(),
        leaveService.getLeaveRequests({ status: 'PENDING' }),
        overtimeService.getOvertimeLogs({ status: 'APPROVED' }),
        productionService.getProductionBatches(),
      ]);

      const empCount = empRes.success ? empRes.data.length : 0;
      const presentCount = attRes.success ? attRes.data.filter((a) => a.status === 'PRESENT').length : 0;
      const pendingLeaveCount = leaveRes.success ? leaveRes.data.length : 0;
      const otHours = otRes.success ? otRes.data.reduce((sum, o) => sum + o.hours, 0) : 0;
      
      const batches = prodRes.success ? prodRes.data : [];
      const prodTotal = batches.reduce((sum, b) => sum + (b.status === 'COMPLETED' ? b.quantityProduced : 0), 0);

      setStats({
        totalEmployees: empCount,
        presentToday: presentCount,
        pendingLeaves: pendingLeaveCount,
        approvedOTHours: otHours,
        todayProduction: prodTotal,
      });

      setRecentBatches(batches.slice(0, 4));
      setIsLoading(false);
    };

    loadOverviewData();
  }, []);

  const batchColumns = [
    {
      header: 'Batch Number',
      cell: (b: Production) => <span className="font-semibold text-primary">{b.batchNumber}</span>,
    },
    {
      header: 'Product',
      accessorKey: 'productName' as keyof Production,
    },
    {
      header: 'Output',
      cell: (b: Production) => <span className="font-bold">{b.quantityProduced.toLocaleString()} {b.unit}</span>,
    },
    {
      header: 'Status',
      cell: (b: Production) => (
        <Badge variant={b.status === 'COMPLETED' ? 'success' : 'warning'}>
          {b.status.replace('_', ' ')}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Plant Operations & HR Dashboard"
        description="Centralized overview of employees, attendance, leave approvals, overtime and water production."
        action={
          <Button variant="primary" icon={<Factory className="w-4 h-4" />} onClick={() => navigate('/production/create')}>
            New Production Batch
          </Button>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Total Plant Staff</p>
            <h4 className="text-2xl font-bold text-text-primary">{stats.totalEmployees}</h4>
            <p className="text-[11px] text-status-success font-medium mt-0.5">
              {stats.presentToday} Present Today
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-lg text-status-success">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Today's Water Production</p>
            <h4 className="text-2xl font-bold text-text-primary">{stats.todayProduction.toLocaleString()} Units</h4>
            <p className="text-[11px] text-text-secondary mt-0.5">Across 3 Plant Lines</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg text-status-warning">
            <CalendarOff className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Pending Leave Requests</p>
            <h4 className="text-2xl font-bold text-text-primary">{stats.pendingLeaves}</h4>
            <p className="text-[11px] text-secondary font-medium mt-0.5 cursor-pointer" onClick={() => navigate('/leave')}>
              Requires Manager Approval
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-cyan-100 rounded-lg text-cyan-700">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Approved Overtime</p>
            <h4 className="text-2xl font-bold text-text-primary">{stats.approvedOTHours} Hours</h4>
            <p className="text-[11px] text-text-secondary mt-0.5">This Month</p>
          </div>
        </Card>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card title="Module Navigation" subtitle="Niranjan's assigned functional areas" className="md:col-span-1">
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full justify-between text-xs"
              onClick={() => navigate('/employees')}
              icon={<Users className="w-4 h-4 text-primary" />}
            >
              <span>Employee Management</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-between text-xs"
              onClick={() => navigate('/attendance')}
              icon={<CalendarCheck className="w-4 h-4 text-status-success" />}
            >
              <span>Daily Attendance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-between text-xs"
              onClick={() => navigate('/leave')}
              icon={<CalendarOff className="w-4 h-4 text-status-warning" />}
            >
              <span>Leave Applications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-between text-xs"
              onClick={() => navigate('/overtime')}
              icon={<Clock className="w-4 h-4 text-secondary" />}
            >
              <span>Overtime Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-between text-xs"
              onClick={() => navigate('/production')}
              icon={<Factory className="w-4 h-4 text-primary" />}
            >
              <span>Production Batches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* Recent Batches Table */}
        <Card
          title="Recent Production Batches"
          subtitle="Water bottling lines status"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/production')}>
              View All
            </Button>
          }
          className="md:col-span-2"
        >
          <Table
            columns={batchColumns}
            data={recentBatches}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
          />
        </Card>
      </div>
    </div>
  );
};
