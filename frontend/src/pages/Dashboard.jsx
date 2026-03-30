import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import StatsCard from '../components/StatsCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { CreditCard, Ticket, Activity, Package, TrendingUp, Clock, Users, Wifi } from 'lucide-react';
import { formatCurrency, formatDate, formatDuration, statusColor } from '../utils/helpers';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }} className="font-semibold">{e.name}: {e.name === 'Revenue' ? formatCurrency(e.value) : e.value}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const { get, loading } = useApi();
  const [data, setData] = useState(null);

  useEffect(() => {
    get('/dashboard').then(d => { if (d.success) setData(d.data); }).catch(() => {});
  }, []);

  const s = data?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, {user?.username}. Here's what's happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Revenue Today" value={formatCurrency(s?.revenue_today)} icon={CreditCard} color="emerald" />
        <StatsCard title="Revenue This Month" value={formatCurrency(s?.revenue_month)} icon={TrendingUp} color="brand" />
        <StatsCard title="Active Sessions" value={s?.active_sessions ?? '—'} icon={Activity} color="violet" />
        <StatsCard title="Sales Today" value={s?.sales_today ?? '—'} icon={Ticket} color="amber" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Unused Vouchers" value={s?.unused_vouchers ?? '—'} icon={Ticket} color="brand" />
        <StatsCard title="Active Vouchers" value={s?.active_vouchers ?? '—'} icon={Wifi} color="emerald" />
        <StatsCard title="Revenue (7 Days)" value={formatCurrency(s?.revenue_week)} icon={TrendingUp} color="violet" />
        <StatsCard title="Active Packages" value={s?.active_packages ?? '—'} icon={Package} color="amber" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="section-title mb-6">Revenue (Last 14 Days)</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data?.revenueChart || []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => v?.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0ea5e9" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="section-title mb-6">Top Packages</h3>
          {loading ? <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Loading...</div> : (
            <div className="space-y-3">
              {(data?.topPackages || []).map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-200">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.sales} sales</div>
                  </div>
                  <div className="text-sm font-semibold text-brand-400">{formatCurrency(p.revenue)}</div>
                </div>
              ))}
              {!data?.topPackages?.length && <p className="text-slate-500 text-sm text-center py-8">No sales yet</p>}
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="card">
        <h3 className="section-title mb-4">Recent Payments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="table-header text-left px-3 py-2">Package</th>
                <th className="table-header text-left px-3 py-2">Voucher</th>
                <th className="table-header text-left px-3 py-2">Method</th>
                <th className="table-header text-right px-3 py-2">Amount</th>
                <th className="table-header text-left px-3 py-2">Status</th>
                <th className="table-header text-left px-3 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentPayments || []).map(p => (
                <tr key={p.id} className="table-row">
                  <td className="table-cell font-medium">{p.package_name || '—'}</td>
                  <td className="table-cell font-mono text-brand-400">{p.voucher_code || '—'}</td>
                  <td className="table-cell uppercase">{p.method}</td>
                  <td className="table-cell text-right font-semibold text-emerald-400">{formatCurrency(p.amount)}</td>
                  <td className="table-cell"><span className={statusColor(p.status)}>{p.status}</span></td>
                  <td className="table-cell text-slate-500 text-xs">{formatDate(p.created_at)}</td>
                </tr>
              ))}
              {!data?.recentPayments?.length && (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No payments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
