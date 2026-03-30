import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Plus, Eye, Power, LogIn, Search, Building2 } from 'lucide-react';
import { formatCurrency, formatDate, statusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const EMPTY = { name: '', email: '', phone: '', adminEmail: '', adminPassword: '', adminName: '', primaryColor: '#0ea5e9' };

export default function Tenants() {
  const { get, post, patch, loading } = useApi();
  const { impersonate } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null, name: '' });

  const load = useCallback(async (page = 1) => {
    const d = await get('/tenants', { page, limit: 20, search });
    if (d.success) { setTenants(d.data); setPagination(d.pagination); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await post('/tenants', form);
      toast.success('Tenant created successfully');
      setModal(false); setForm(EMPTY); load();
    } finally { setSaving(false); }
  };

  const handleToggle = async (id, name) => {
    setConfirm({ open: true, id, name });
  };

  const confirmToggle = async () => {
    setSaving(true);
    try {
      const d = await patch(`/tenants/${confirm.id}/toggle-status`);
      toast.success(d.message); setConfirm({ open: false, id: null, name: '' }); load();
    } finally { setSaving(false); }
  };

  const handleImpersonate = async (id, name) => {
    try {
      const d = await post(`/tenants/${id}/impersonate`);
      if (d.success) {
        impersonate(d.token, d.user);
        toast.success(`Impersonating ${name}`);
        navigate('/dashboard');
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tenants</h1>
          <p className="text-slate-500 text-sm mt-1">Manage ISP providers and hotspot operators</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary"><Plus size={18} />New Tenant</button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-9 text-sm" placeholder="Search tenants..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tenants.map(t => (
          <div key={t.id} className="card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: t.primary_color || '#0ea5e9' }}>
                  {t.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-100">{t.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{t.slug}</div>
                </div>
              </div>
              <span className={statusColor(t.status)}>{t.status}</span>
            </div>

            <div className="space-y-1 text-xs text-slate-500 mb-4">
              <div>✉ {t.email}</div>
              {t.phone && <div>📱 {t.phone}</div>}
              <div>💰 Total Revenue: <span className="text-emerald-400 font-semibold">{formatCurrency(t.total_revenue || 0)}</span></div>
              <div>🎟 Vouchers: {t.voucher_count || 0} · Users: {t.user_count || 0}</div>
              <div>📅 Joined: {formatDate(t.created_at)}</div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => handleImpersonate(t.id, t.name)} className="btn-secondary py-1.5 px-2 text-xs flex-1">
                <LogIn size={13} />Access
              </button>
              <button onClick={() => handleToggle(t.id, t.name)} className={`py-1.5 px-2 text-xs flex-1 inline-flex items-center justify-center gap-1 rounded-xl font-semibold transition-all border ${t.status === 'active' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' : 'btn-success'}`}>
                <Power size={13} />{t.status === 'active' ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
        {!loading && !tenants.length && (
          <div className="col-span-full card text-center py-16 text-slate-500">
            <Building2 size={40} className="mx-auto mb-3 text-slate-700" />
            <p>No tenants found</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create New Tenant">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="divider my-0 mb-2"><span className="text-xs text-slate-500 bg-slate-900 px-2">Organization</span></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 form-group"><label className="label">Company Name *</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
            <div className="form-group"><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required /></div>
            <div className="form-group"><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div className="form-group"><label className="label">Brand Color</label><input type="color" className="input h-10" value={form.primaryColor} onChange={e => setForm(p => ({ ...p, primaryColor: e.target.value }))} /></div>
          </div>
          <div className="divider my-0"><span className="text-xs text-slate-500 bg-slate-900 px-2">Admin Account</span></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Admin Name</label><input className="input" value={form.adminName} onChange={e => setForm(p => ({ ...p, adminName: e.target.value }))} /></div>
            <div className="form-group"><label className="label">Admin Email *</label><input className="input" type="email" value={form.adminEmail} onChange={e => setForm(p => ({ ...p, adminEmail: e.target.value }))} required /></div>
            <div className="col-span-2 form-group"><label className="label">Admin Password *</label><input className="input" type="password" value={form.adminPassword} onChange={e => setForm(p => ({ ...p, adminPassword: e.target.value }))} required minLength={8} /></div>
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Tenant'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false, id: null, name: '' })} onConfirm={confirmToggle}
        title="Toggle Tenant Status" message={`Are you sure you want to change the status of "${confirm.name}"?`} danger={false} loading={saving} confirmLabel="Confirm" />
    </div>
  );
}
