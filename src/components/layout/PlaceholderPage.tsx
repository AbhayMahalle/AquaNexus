'use client';
import React from 'react';
import { DashboardLayout } from './DashboardLayout';
import { PageHeader } from './PageHeader';
import { Card, CardContent } from '../ui/Card';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <DashboardLayout>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <p>This module is currently under active development and will be available in the next release.</p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};
