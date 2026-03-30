import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Edit2, Trash2, Router as RouterIcon, Wifi } from 'lucide-react';
import { formatDate, statusColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const TYPES = ['MikroTik', 'Ubiquiti', 'TP-Link', 'Cisco', 'Huawei', 'Cambium', 'Other'];
const EMPTY = { name: '', ipAddress: '', type: 'MikroTik', nasIdentifier: '', secret: '', port: 1812, status: 'active' };

export default function Routers() {
  const { get, post, put, delete: del, loading } = useApi();
  const [routers, setRouters] = useState([]);
  const [modal, setModal] = useState({ open: false, edit: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => get('/routers').then(d => { if (d.success) setRouters(d.data); });
  useEffect(() => { load(); }, []);

  const openEdit = (r) => {
    setForm({ name: r.name, ipAddress: r.ip_address, type: r.type, nasIdentifier: r.nas_identifier || '', secret: r.secret || '', port: r.port, status: r.status });
    setModal({ open: true, edit: r.id });
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal.edit) { await put(`/routers/${modal.edit}`, form); toast.success('Router updated'); }
      else { await post('/routers', form); toast.success('Router added'); }
      setModal({ open: false, edit: null }); load();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await del(`/routers/${confirm.id}`); toast.success('Router removed'); setConfirm({ open: false, id: null }); load(); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Routers</h1>
          <p className="text-slate-500 text-sm mt-1">Manage connected WiFi routers and access points</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setModal({ open: true, edit: null }); }} className="btn-primary"><Plus size={18} />Add Router</button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routers.map(r => (
          <div key={r.id} className="card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center">
                <RouterIcon size={18} className="text-brand-400" />
              </div>
              <span className={statusColor(r.status)}>{r.status}</span>
            </div>
            <h3 className="font-bold text-slate-100 mb-1">{r.name}</h3>
            <div className="space-y-1 text-xs text-slate-500 mb-4">
              <div>IP: <span className="font-mono text-slate-300">{r.ip_address}</span></div>
              <div>Type: <span className="text-slate-300">{r.type}</span></div>
              <div>Port: {r.port}</div>
              {r.nas_identifier && <div>NAS ID: <span className="font-mono text-slate-300">{r.nas_identifier}</span></div>}
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => openEdit(r)} className="btn-secondary py-1.5 px-3 text-xs flex-1"><Edit2 size={13} />Edit</button>
              <button onClick={() => setConfirm({ open: true, id: r.id })} className="btn-danger py-1.5 px-3 text-xs"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {!loading && !routers.length && (
          <div className="col-span-full card text-center py-16 text-slate-500">
            <RouterIcon size={40} className="mx-auto mb-3 text-slate-700" />
            <p>No routers configured</p>
          </div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, edit: null })} title={modal.edit ? 'Edit Router' : 'Add Router'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 form-group"><label className="label">Name *</label><input className="input" placeholder="Main AP" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
            <div className="form-group"><label className="label">IP Address *</label><input className="input" placeholder="192.168.1.1" value={form.ipAddress} onChange={e => setForm(p => ({ ...p, ipAddress: e.target.value }))} required /></div>
            <div className="form-group"><label className="label">Type *</label>
              <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="label">RADIUS Port</label><input className="input" type="number" value={form.port} onChange={e => setForm(p => ({ ...p, port: e.target.value }))} /></div>
            <div className="form-group"><label className="label">NAS Identifier</label><input className="input" placeholder="optional" value={form.nasIdentifier} onChange={e => setForm(p => ({ ...p, nasIdentifier: e.target.value }))} /></div>
            <div className="col-span-2 form-group"><label className="label">RADIUS Secret</label><input className="input" type="password" placeholder="shared secret" value={form.secret} onChange={e => setForm(p => ({ ...p, secret: e.target.value }))} /></div>
            <div className="form-group"><label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModal({ open: false, edit: null })}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : modal.edit ? 'Update' : 'Add Router'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false, id: null })} onConfirm={handleDelete}
        title="Remove Router" message="Remove this router from the system?" loading={saving} />
    </div>
  );
}
