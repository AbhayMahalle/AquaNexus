import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Shield, ArrowRight } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { Button } from '@/components/ui/Button';

export const Login: React.FC<{ onLogin: (role: UserRole) => void }> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>('distributor');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(selectedRole);
    if (selectedRole === 'distributor') navigate('/distributor/dashboard');
    else if (selectedRole === 'accountant') navigate('/accountant/dashboard');
    else navigate('/distributor/dashboard');
  };

  return (
    <div className="min-h-screen bg-bgMain flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-dropdown p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white mx-auto shadow-sm">
            <Droplets size={28} className="text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">AquaNexus ERP</h2>
          <p className="text-xs text-textSecondary">Centralized Water Plant Management System</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider block mb-2">
              Select Role Portal
            </label>
            <div className="space-y-2">
              {[
                { role: 'distributor', title: 'Distributor Portal (Yash)', desc: 'Orders, sales, stock & invoice settlement' },
                { role: 'accountant', title: 'Accountant Portal (Yash)', desc: 'Payroll, expenses, payments & financial reports' },
                { role: 'admin', title: 'Admin Overview (Mrudula)', desc: 'Full plant system overview' },
                { role: 'store_manager', title: 'Store Manager (Ram)', desc: 'Central store & inventory' },
              ].map((item) => (
                <label
                  key={item.role}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === item.role
                      ? 'bg-secondary/10 border-secondary text-primary font-semibold'
                      : 'bg-bgMain border-border text-textSecondary hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={item.role}
                    checked={selectedRole === item.role}
                    onChange={() => setSelectedRole(item.role as UserRole)}
                    className="mt-0.5 text-primary focus:ring-secondary"
                  />
                  <div>
                    <p className="text-xs font-bold text-textPrimary">{item.title}</p>
                    <p className="text-[11px] text-textMuted">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" icon={ArrowRight}>
            Enter AquaNexus System
          </Button>
        </form>
      </div>
    </div>
  );
};
