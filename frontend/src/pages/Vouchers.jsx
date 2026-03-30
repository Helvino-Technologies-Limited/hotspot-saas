import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Table, Pagination } from '../components/Table';
import { Plus, Copy, RefreshCw, XCircle, Check, Search } from 'lucide-react';
import { formatCurrency, formatDate, formatDuration, statusColor, copyToClipboard } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Vouchers() {
  const { get, post, patch, loading } = useApi();
  const [vouchers, setVouchers] = useState([]);
  const [stats, setStats] = useState(null);
  const [packages, setPackages] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [genForm, setGenForm] = useState({ packageId: '', count: 1 });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);

  const load = useCallback(async (page = 1) => {
    const params = { page, limit: 20, ...filters };
    const [d, s] = await Promise.all([get('/vouchers', params), get('/vouchers/stats', {}, { silent: true })]);
    if (d.success) { setVouchers(d.data); setPagination(d.pagination); }
    if (s?.success) setStats(s.data);
  }, [filters]);

  useEffect(() => { load(); get('/packages').then(d => { if (d.success) setPackages(d.data); }); }, [load]);

  const handleCopy = async (code) => {
    await copyToClipboard(code);
    setCopied(code);
    toast.success('Copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const d = await post('/vouchers/generate', genForm);
      toast.success(`${d.data.length} voucher(s) generated`);
      setModal(false);
      load();
    } finally { setSaving(false); }
  };

  const handleRevoke = async () => {
    setSaving(true);
    try {
      await patch(`/vouchers/${confirm.id}/revoke`);
      toast.success('Voucher revoked');
      setConfirm({ open: false, id: null });
      load();
    } finally { setSaving(false); }
  };

  const statusBadge = (s) => {
    const colors = { unused: 'badge-info', active: 'badge-success', expired: 'badge-warning', revoked: 'badge-danger' };
    return <span className={colors[s] || 'badge-gray'}>{s}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Vouchers</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and generate WiFi voucher codes</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary"><Plus size={18} />Generate</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { l: 'Total', v: stats.total, c: 'text-slate-300' },
            { l: 'Unused', v: stats.unused, c: 'text-brand-400' },
            { l: 'Active', v: stats.active, c: 'text-emerald-400' },
            { l: 'Expired', v: stats.expired, c: 'text-amber-400' },
            { l: 'Today', v: stats.today, c: 'text-violet-400' },
          ].map(s => (
            <div key={s.l} className="card text-center py-3">
              <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-slate-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-9 text-sm" placeholder="Search voucher code..." value={filters.search}
            onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
        </div>
        <select className="input w-36 text-sm" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Status</option>
          {['unused','active','expired','revoked'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => load()} className="btn-secondary py-2.5 px-4"><RefreshCw size={16} /></button>
      </div>

      {/* Table */}
      <div>
        <Table headers={['Code', 'Package', 'Status', 'Expires', 'Created', 'Actions']} loading={loading}>
          {vouchers.map(v => (
            <tr key={v.id} className="table-row">
              <td className="table-cell">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-brand-400 tracking-widest text-sm">{v.code}</span>
                  <button onClick={() => handleCopy(v.code)} className="text-slate-600 hover:text-brand-400 transition-colors">
                    {copied === v.code ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </td>
              <td className="table-cell">
                <div className="text-sm font-medium">{v.package_name}</div>
                <div className="text-xs text-slate-500">{formatDuration(v.duration_minutes)} · {formatCurrency(v.price)}</div>
              </td>
              <td className="table-cell">{statusBadge(v.status)}</td>
              <td className="table-cell text-xs text-slate-500">{v.expires_at ? formatDate(v.expires_at) : '—'}</td>
              <td className="table-cell text-xs text-slate-500">{formatDate(v.created_at)}</td>
              <td className="table-cell">
                {v.status === 'unused' && (
                  <button onClick={() => setConfirm({ open: true, id: v.id })} className="btn-danger py-1 px-2 text-xs">
                    <XCircle size={13} /> Revoke
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Table>
        <Pagination {...pagination} pages={Math.ceil(pagination.total / pagination.limit)} onPage={load} />
      </div>

      {/* Generate Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Generate Vouchers">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="form-group">
            <label className="label">Package *</label>
            <select className="input" value={genForm.packageId} onChange={e => setGenForm(p => ({ ...p, packageId: e.target.value }))} required>
              <option value="">Select package...</option>
              {packages.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.id}>{p.name} – {formatCurrency(p.price)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Quantity (max 100)</label>
            <input className="input" type="number" min="1" max="100" value={genForm.count}
              onChange={e => setGenForm(p => ({ ...p, count: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Generate'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false, id: null })} onConfirm={handleRevoke}
        title="Revoke Voucher" message="This voucher will be permanently revoked." loading={saving} />
    </div>
  );
}
