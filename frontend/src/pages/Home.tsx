import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets, ShoppingCart, DollarSign, ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F8FB] flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white border border-[#E2E8F0] rounded-[14px] p-8 shadow-subtle text-center">
        <div className="w-14 h-14 bg-[#0F4C81] text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Droplets className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Aqua Nexus ERP</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Water Plant Management System — Developer Portal for Yash (React + Vite)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <Link
            to="/distributor/dashboard"
            className="flex flex-col items-start p-5 rounded-[12px] border border-[#E2E8F0] bg-white hover:border-[#1597D4] hover:shadow-hover transition-all text-left group"
          >
            <div className="p-2.5 rounded-lg bg-[#1597D4]/10 text-[#1597D4] mb-3 group-hover:bg-[#1597D4] group-hover:text-white transition-colors">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-[#172033] flex items-center gap-1.5 w-full justify-between">
              Distributor Portal
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F4C81] group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Orders, Stock, Sales, Invoices, Payments & Outstanding
            </p>
          </Link>

          <Link
            to="/accountant/dashboard"
            className="flex flex-col items-start p-5 rounded-[12px] border border-[#E2E8F0] bg-white hover:border-[#1597D4] hover:shadow-hover transition-all text-left group"
          >
            <div className="p-2.5 rounded-lg bg-[#0F4C81]/10 text-[#0F4C81] mb-3 group-hover:bg-[#0F4C81] group-hover:text-white transition-colors">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-[#172033] flex items-center gap-1.5 w-full justify-between">
              Accountant Portal
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F4C81] group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Payroll, Expense Records, Financial Payments & Reports
            </p>
          </Link>
        </div>

        <div className="mt-8 pt-4 border-t border-[#E2E8F0] text-xs text-[#94A3B8]">
          Aqua Nexus Phase 1 • Frontend Developed by Yash • React + Vite Migration
        </div>
      </div>
    </div>
  );
};
