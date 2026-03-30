import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { Table, Pagination } from '../components/Table';
import ConfirmDialog from '../components/ConfirmDialog';
import { RefreshCw, XCircle, Activity } from 'lucide-react';
import { formatDate, statusColor } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Sessions() {
  const { get, patch, loading } = useApi();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [filters, setFilters] = useState({ status: 'active' });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (page = 1) => {
    const [d, s] = await Promise.all([
      get('/sessions', { page, limit: 20, ...filters }),
      get('/sessions/stats', {}, { silent: true })
    ]);
    if (d.success) { setSessions(d.data); setPagination(d.pagination); }
    if (s?.success) setStats(s.data);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleTerminate = async () => {
    setSaving(true);
    try {
      await patch(`/sessions/${confirm.id}/terminate`);
      toast.success('Session terminated');
      setConfirm({ open: false, id: null });
      load();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Sessions</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor active and historical connections</p>
        </div>
        <button onClick={() => load()} className="btn-secondary"><RefreshCw size={16} />Refresh</button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { l: 'Active Now', v: stats.active_now, c: 'text-emerald-400' },
            { l: 'Today', v: stats.today, c: 'text-brand-400' },
            { l: 'This Week', v: stats.this_week, c: 'text-violet-400' },
            { l: 'Total', v: stats.total, c: 'text-slate-300' },
          ].map(s => (
            <div key={s.l} className="card">
              <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-slate-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <select className="input w-36 text-sm" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All</option>
          {['active','expired','terminated'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => load()} className="btn-secondary py-2.5 px-4"><RefreshCw size={16} /></button>
      </div>

      <div>
        <Table headers={['Voucher', 'Package', 'MAC Address', 'IP Address', 'Started', 'Expires', 'Status', 'Actions']} loading={loading}>
          {sessions.map(s => (
            <tr key={s.id} className="table-row">
              <td className="table-cell font-mono text-brand-400 font-bold">{s.voucher_code}</td>
              <td className="table-cell">{s.package_name || '—'}</td>
              <td className="table-cell font-mono text-xs text-slate-400">{s.mac_address || '—'}</td>
              <td className="table-cell font-mono text-xs text-slate-400">{s.ip_address || '—'}</td>
              <td className="table-cell text-xs text-slate-500">{formatDate(s.start_time)}</td>
              <td className="table-cell text-xs text-slate-500">{s.expires_at ? formatDate(s.expires_at) : '—'}</td>
              <td className="table-cell"><span className={statusColor(s.status)}>{s.status}</span></td>
              <td className="table-cell">
                {s.status === 'active' && (
                  <button onClick={() => setConfirm({ open: true, id: s.id })} className="btn-danger py-1 px-2 text-xs">
                    <XCircle size={13} /> Kick
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Table>
        <Pagination {...pagination} pages={Math.ceil(pagination.total / pagination.limit)} onPage={load} />
      </div>

      <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false, id: null })} onConfirm={handleTerminate}
        title="Terminate Session" message="This will disconnect the user immediately." loading={saving} />
    </div>
  );
}
