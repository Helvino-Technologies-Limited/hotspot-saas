import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Edit2, Trash2, Package, Toggle } from 'lucide-react';
import { formatCurrency, formatDuration, statusColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY = { name: '', description: '', price: '', durationMinutes: '', speedLimitMbps: '', deviceLimit: 1, status: 'active', sortOrder: 0 };

export default function Packages() {
  const { get, post, put, delete: del, loading } = useApi();
  const [packages, setPackages] = useState([]);
  const [modal, setModal] = useState({ open: false, edit: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => get('/packages').then(d => { if (d.success) setPackages(d.data); });
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setModal({ open: true, edit: null }); };
  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', price: p.price, durationMinutes: p.duration_minutes, speedLimitMbps: p.speed_limit_mbps || '', deviceLimit: p.device_limit, status: p.status, sortOrder: p.sort_order });
    setModal({ open: true, edit: p.id });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.edit) {
        await put(`/packages/${modal.edit}`, form);
        toast.success('Package updated');
      } else {
        await post('/packages', form);
        toast.success('Package created');
      }
      setModal({ open: false, edit: null });
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await del(`/packages/${confirm.id}`);
      toast.success('Package deleted');
      setConfirm({ open: false, id: null });
      load();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Packages</h1>
          <p className="text-slate-500 text-sm mt-1">Configure your WiFi subscription packages</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={18} />New Package</button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && !packages.length ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="card animate-pulse h-44 bg-slate-800/50" />)
        ) : packages.map(p => (
          <div key={p.id} className="card-hover flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-lg">{p.name}</h3>
                {p.description && <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>}
              </div>
              <span className={statusColor(p.status)}>{p.status}</span>
            </div>

            <div className="text-3xl font-extrabold text-brand-400">{formatCurrency(p.price)}</div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div>⏱ {formatDuration(p.duration_minutes)}</div>
              {p.speed_limit_mbps && <div>⚡ {p.speed_limit_mbps} Mbps</div>}
              <div>📱 {p.device_limit} device{p.device_limit > 1 ? 's' : ''}</div>
              <div>🎟 {p.voucher_count || 0} vouchers sold</div>
            </div>

            {p.revenue > 0 && (
              <div className="text-xs text-emerald-400 font-semibold">Revenue: {formatCurrency(p.revenue)}</div>
            )}

            <div className="flex gap-2 mt-auto pt-3 border-t border-slate-800">
              <button onClick={() => openEdit(p)} className="btn-secondary py-1.5 px-3 text-xs flex-1">
                <Edit2 size={13} /> Edit
              </button>
              <button onClick={() => setConfirm({ open: true, id: p.id })} className="btn-danger py-1.5 px-3 text-xs">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {!loading && !packages.length && (
          <div className="col-span-full card text-center py-16 text-slate-500">
            <Package size={40} className="mx-auto mb-3 text-slate-700" />
            <p>No packages yet. Create your first one!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, edit: null })} title={modal.edit ? 'Edit Package' : 'New Package'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 form-group">
              <label className="label">Package Name *</label>
              <input className="input" placeholder="e.g. 1 Hour, Daily" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Price (KES) *</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="50" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Duration (minutes) *</label>
              <input className="input" type="number" min="1" placeholder="60" value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Speed Limit (Mbps)</label>
              <input className="input" type="number" min="0" step="0.1" placeholder="10" value={form.speedLimitMbps} onChange={e => setForm(p => ({ ...p, speedLimitMbps: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Max Devices</label>
              <select className="input" value={form.deviceLimit} onChange={e => setForm(p => ({ ...p, deviceLimit: e.target.value }))}>
                {[1,2,3,5].map(n => <option key={n} value={n}>{n} device{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Sort Order</label>
              <input className="input" type="number" min="0" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))} />
            </div>
            <div className="col-span-2 form-group">
              <label className="label">Description</label>
              <input className="input" placeholder="Optional description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModal({ open: false, edit: null })}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : modal.edit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false, id: null })} onConfirm={handleDelete}
        title="Delete Package" message="Are you sure? This cannot be undone." loading={saving} />
    </div>
  );
}
