import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';

import {
  Button,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Input,
  Select,
  Table, Column,
  Badge,
  Modal,
  Dropdown,
  Skeleton,
  EmptyState,
  ErrorState,
  Pagination,
  Tooltip
} from '@/components/ui';

import { CheckCircle2, AlertTriangle, Layers, Sparkles, Inbox } from 'lucide-react';

interface TestRow {
  id: number;
  component: string;
  testStatus: string;
  importPath: string;
}

export default function FoundationTestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [inputVal, setInputVal] = useState('Aqua Nexus UI Test (React.js)');
  const [selectVal, setSelectVal] = useState('optimal');

  const testTableData: TestRow[] = [
    { id: 1, component: 'Button', testStatus: 'Verified (Primary, Secondary, Outline, Danger, Ghost, Loading)', importPath: '@/components/ui' },
    { id: 2, component: 'Card', testStatus: 'Verified (Standard, Interactive, Header, Footer)', importPath: '@/components/ui' },
    { id: 3, component: 'Input', testStatus: 'Verified (Label, Required, Error, Icons)', importPath: '@/components/ui' },
    { id: 4, component: 'Select', testStatus: 'Verified (Options, Label, Custom Dropdown Arrow)', importPath: '@/components/ui' },
    { id: 5, component: 'Table', testStatus: 'Verified (Prop Driven, Custom Cell Renderers, Subcomponents)', importPath: '@/components/ui' },
    { id: 6, component: 'Badge', testStatus: 'Verified (Success, Warning, Danger, Info, Primary, Neutral)', importPath: '@/components/ui' },
    { id: 7, component: 'Modal', testStatus: 'Verified (Overlay Backdrop, ESC Close, Footer Actions)', importPath: '@/components/ui' },
    { id: 8, component: 'Dropdown', testStatus: 'Verified (Click Outside, Items, Dividers)', importPath: '@/components/ui' },
    { id: 9, component: 'Skeleton', testStatus: 'Verified (Pulse Animation, Text, Circle, Rect)', importPath: '@/components/ui' },
    { id: 10, component: 'EmptyState', testStatus: 'Verified (Icon, Title, Action Button)', importPath: '@/components/ui' },
    { id: 11, component: 'ErrorState', testStatus: 'Verified (Alert Icon, Retry Callback)', importPath: '@/components/ui' },
    { id: 12, component: 'Pagination', testStatus: 'Verified (Pages 1 to 5, Prev/Next Handlers)', importPath: '@/components/ui' },
    { id: 13, component: 'Tooltip', testStatus: 'Verified (Hover Top/Bottom/Left/Right)', importPath: '@/components/ui' },
  ];

  const columns: Column<TestRow>[] = [
    { key: 'id', header: '#', width: '50px' },
    { key: 'component', header: 'Component Name', render: (r) => <span className="font-bold text-[#0F4C81]">{r.component}</span> },
    { key: 'testStatus', header: 'Verification Status', render: (r) => <Badge variant="success" icon={<CheckCircle2 className="w-3 h-3" />}>{r.testStatus}</Badge> },
    { key: 'importPath', header: 'Shared Import Path', render: (r) => <code className="bg-[#F5F8FB] px-2 py-1 rounded text-xs text-[#0F4C81] font-mono border border-[#E2E8F0]">{r.importPath}</code> },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="React.js Migration — Shared Foundation Showcase"
        description="Comprehensive interactive test for all 13 shared UI components, 4 layout components, design tokens, and role-aware navigation in React.js"
        breadcrumbs={[{ label: 'System' }, { label: 'Foundation Showcase' }]}
        primaryAction={{
          label: 'Test Modal Component',
          icon: <Sparkles className="w-4 h-4" />,
          onClick: () => setIsModalOpen(true),
        }}
      />

      <Card variant="interactive" className="mb-6 bg-gradient-to-r from-[#F0F7FF] via-[#E8F5FC] to-white border-[#1597D4]/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-2">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16A34A] text-white text-xs font-bold mb-2">
              <CheckCircle2 className="w-4 h-4" /> NEXT.JS → REACT.JS MIGRATION COMPLETE
            </span>
            <h3 className="text-lg font-extrabold text-[#0F4C81]">
              React.js + Vite Shared Frontend Foundation Active
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-2xl">
              Other frontend developers (RAM, NIRANJAN, YASH) can continue working in React.js by importing components from <code>@/components/ui</code> and wrapping pages in <code>DashboardLayout</code>.
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Open Test Modal
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1 & 2. Button & Badge Reusable Variants</CardTitle>
            <CardDescription>Primary #0F4C81, Secondary #1597D4, Accent #22B8CF design system palette</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="accent">Accent Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="primary" loading>Loading State</Button>
              <Button variant="outline" disabled>Disabled State</Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#E2E8F0]">
              <Badge variant="primary">Primary Badge</Badge>
              <Badge variant="secondary">Secondary Badge</Badge>
              <Badge variant="success" icon={<CheckCircle2 className="w-3 h-3" />}>Success Badge</Badge>
              <Badge variant="warning" icon={<AlertTriangle className="w-3 h-3" />}>Warning Badge</Badge>
              <Badge variant="danger">Danger Badge</Badge>
              <Badge variant="info">Info Badge</Badge>
              <Badge variant="neutral">Neutral Badge</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3 & 4. Input & Select Controls</CardTitle>
            <CardDescription>Form controls with error handling, helper text, and icon adornments</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Standard Input"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              helperText="Helper text message"
            />
            <Input
              label="Required Input with Error"
              required
              error="Validation error: Field is required"
              defaultValue="Invalid input value"
            />
            <Select
              label="Status Select"
              value={selectVal}
              onChange={(e) => setSelectVal(e.target.value)}
              options={[
                { label: 'Optimal Operational Status', value: 'optimal' },
                { label: 'Warning / Low Threshold', value: 'warning' },
                { label: 'Critical Out of Stock', value: 'critical' },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Generic Shared Table Component</CardTitle>
            <CardDescription>Generic TypeScript columns, custom cell renderers, and responsive wrapper</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={testTableData}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>6. Dropdowns & Tooltips</CardTitle>
              <CardDescription>Floating UI controls with mouse triggers</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-6">
              <Dropdown
                trigger={<Button variant="outline">Open Action Dropdown</Button>}
                items={[
                  { label: 'Action Option 1', icon: <Sparkles className="w-4 h-4" />, onClick: () => alert('Option 1 clicked') },
                  { label: 'Action Option 2', icon: <Layers className="w-4 h-4" />, onClick: () => alert('Option 2 clicked') },
                  { divider: true, label: '' },
                  { label: 'Danger Delete Action', danger: true, onClick: () => alert('Danger clicked') },
                ]}
              />

              <Tooltip content="Hover tooltip example top!" position="top">
                <Button variant="secondary" size="sm">Hover Tooltip (Top)</Button>
              </Tooltip>

              <Tooltip content="Tooltip on the right!" position="right">
                <Button variant="ghost" size="sm">Hover Tooltip (Right)</Button>
              </Tooltip>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Pagination Component</CardTitle>
              <CardDescription>Page navigation control for table results</CardDescription>
            </CardHeader>
            <CardContent>
              <Pagination
                currentPage={currentPage}
                totalPages={5}
                totalItems={50}
                itemsPerPage={10}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Skeleton Loaders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton variant="text" />
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" />
                <Skeleton variant="rectangle" className="h-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">EmptyState Component</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <EmptyState
                icon={<Inbox className="w-6 h-6 text-[#0F4C81]" />}
                title="No items found"
                description="Empty state component working"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ErrorState Component</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ErrorState
                title="Connection Error"
                message="Error feedback component ready"
                onRetry={() => alert('Retrying...')}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Priority 1 Shared Modal Test (React.js)"
        description="Verifying accessibility, key bindings (ESC), and backdrop overlays in React.js"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close Modal</Button>
            <Button variant="primary" onClick={() => { setIsModalOpen(false); alert('Modal Action Confirmed!'); }}>Confirm Action</Button>
          </>
        }
      >
        <div className="p-4 rounded-xl bg-[#F0F7FF] border border-[#E0F0FE] text-xs text-[#0F4C81] space-y-2">
          <p className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            React.js Modal Component is fully operational!
          </p>
          <p>
            Press <strong>Escape</strong> or click outside to dismiss.
          </p>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
