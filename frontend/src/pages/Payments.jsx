import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { Table, Pagination } from '../components/Table';
import { RefreshCw, Search, Download } from 'lucide-react';
import { formatCurrency, formatDate, statusColor } from '../utils/helpers';

export default function Payments() {
  const { get, loading } = useApi();
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });

  const load = useCallback(async (page = 1) => {
    const d = await get('/payments', { page, limit: 20, ...filters });
    if (d.success) { setPayments(d.data); setPagination(d.pagination); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + parseFloat(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Payments</h1>
          <p className="text-slate-500 text-sm mt-1">Transaction history and revenue tracking</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: 'Total Records', v: pagination.total, c: 'text-slate-300' },
          { l: 'Completed', v: payments.filter(p => p.status === 'completed').length, c: 'text-emerald-400' },
          { l: 'Pending', v: payments.filter(p => p.status === 'pending').length, c: 'text-amber-400' },
          { l: 'Revenue (Visible)', v: formatCurrency(totalRevenue), c: 'text-brand-400' },
        ].map(s => (
          <div key={s.l} className="card">
            <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-slate-500 mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="input w-36 text-sm" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Status</option>
          {['pending','completed','failed','refunded'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" className="input w-40 text-sm" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} />
        <input type="date" className="input w-40 text-sm" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} />
        <button onClick={() => load()} className="btn-secondary py-2.5 px-4"><RefreshCw size={16} /></button>
      </div>

      <div>
        <Table headers={['Reference', 'Package', 'Voucher', 'Method', 'Amount', 'Status', 'Date']} loading={loading}>
          {payments.map(p => (
            <tr key={p.id} className="table-row">
              <td className="table-cell font-mono text-xs text-slate-400">{p.reference?.slice(0, 12)}...</td>
              <td className="table-cell font-medium">{p.package_name || '—'}</td>
              <td className="table-cell font-mono text-brand-400 text-sm">{p.voucher_code || '—'}</td>
              <td className="table-cell uppercase text-xs">{p.method}</td>
              <td className="table-cell font-bold text-emerald-400">{formatCurrency(p.amount)}</td>
              <td className="table-cell"><span className={statusColor(p.status)}>{p.status}</span></td>
              <td className="table-cell text-xs text-slate-500">{formatDate(p.created_at)}</td>
            </tr>
          ))}
        </Table>
        <Pagination {...pagination} pages={Math.ceil(pagination.total / pagination.limit)} onPage={load} />
      </div>
    </div>
  );
}
