import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import StatsCard from '../../components/StatsCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, Users, CreditCard, Ticket, Activity, TrendingUp } from 'lucide-react';
import { formatCurrency, formatShortDate } from '../../utils/helpers';

export default function SuperDashboard() {
  const { get } = useApi();
  const [data, setData] = useState(null);

  useEffect(() => { get('/tenants/stats').then(d => { if (d.success) setData(d.data); }); }, []);

  const s = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">System Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Super admin dashboard — all tenants combined</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Tenants" value={s?.total_tenants || '—'} icon={Building2} color="brand" />
        <StatsCard title="Active Tenants" value={s?.active_tenants || '—'} icon={Building2} color="emerald" />
        <StatsCard title="Total Revenue" value={formatCurrency(s?.total_revenue)} icon={CreditCard} color="violet" />
        <StatsCard title="Active Sessions" value={s?.active_sessions || '—'} icon={Activity} color="amber" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={s?.total_users || '—'} icon={Users} color="brand" />
        <StatsCard title="Payments Today" value={s?.payments_today || '—'} icon={CreditCard} color="emerald" />
        <StatsCard title="Vouchers Today" value={s?.vouchers_today || '—'} icon={Ticket} color="violet" />
        <StatsCard title="Revenue (30d)" value={formatCurrency(s?.revenue_30days)} icon={TrendingUp} color="amber" />
      </div>

      {s?.revenueByMonth?.length > 0 && (
        <div className="card">
          <h3 className="section-title mb-6">System Revenue (6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={s.revenueByMonth}>
              <defs>
                <linearGradient id="sysGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => v?.slice(0, 7)} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="url(#sysGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
