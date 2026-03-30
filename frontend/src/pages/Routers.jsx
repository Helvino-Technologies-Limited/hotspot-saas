import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Edit2, Trash2, Router as RouterIcon, Zap, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDate, statusColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const TYPES = ['MikroTik', 'Ubiquiti', 'TP-Link', 'Cisco', 'Huawei', 'Cambium', 'Other'];
const EMPTY = { name: '', ipAddress: '', type: 'MikroTik', nasIdentifier: '', secret: '', port: 1812, status: 'active', apiUsername: 'admin', apiPassword: '', useApi: false };

export default function Routers() {
  const { get, post, put, delete: del, loading } = useApi();
  const [routers, setRouters] = useState([]);
  const [modal, setModal] = useState({ open: false, edit: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState({});

  const load = () => get('/routers').then(d => { if (d.success) setRouters(d.data); });
  useEffect(() => { load(); }, []);

  const openEdit = (r) => {
    setForm({
      name: r.name, ipAddress: r.ip_address, type: r.type,
      nasIdentifier: r.nas_identifier || '', secret: '',
      port: r.port, status: r.status,
      apiUsername: r.api_username || 'admin',
      apiPassword: '', // never pre-fill password
      useApi: r.use_api || false,
    });
    setModal({ open: true, edit: r.id });
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal.edit) { await put(`/routers/${modal.edit}`, form); toast.success('Router updated'); }
      else { await post('/routers', form); toast.success('Router added'); }
      setModal({ open: false, edit: null }); setForm(EMPTY); load();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await del(`/routers/${confirm.id}`); toast.success('Router removed'); setConfirm({ open: false, id: null }); load(); }
    finally { setSaving(false); }
  };

  const handleTest = async (id) => {
    setTesting(p => ({ ...p, [id]: 'loading' }));
    try {
      const d = await post(`/routers/${id}/test`, {});
      if (d.success) {
        setTesting(p => ({ ...p, [id]: 'ok' }));
        toast.success(d.message);
      } else {
        setTesting(p => ({ ...p, [id]: 'fail' }));
        toast.error(d.message || 'Connection failed');
      }
    } catch {
      setTesting(p => ({ ...p, [id]: 'fail' }));
    }
    setTimeout(() => setTesting(p => ({ ...p, [id]: null })), 8000);
  };

  const TestIcon = ({ id }) => {
    const s = testing[id];
    if (s === 'loading') return <span className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />;
    if (s === 'ok') return <CheckCircle2 size={14} className="text-emerald-400" />;
    if (s === 'fail') return <XCircle size={14} className="text-red-400" />;
    return <Zap size={13} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Routers</h1>
          <p className="text-slate-500 text-sm mt-1">Manage WiFi routers and access points</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setModal({ open: true, edit: null }); }} className="btn-primary"><Plus size={18} />Add Router</button>
      </div>

      {/* RADIUS info banner */}
      <div className="card bg-brand-500/5 border-brand-500/20 text-xs text-slate-400 space-y-1">
        <div className="font-semibold text-brand-400 mb-1">Router Integration Modes</div>
        <div><span className="text-slate-300 font-medium">RADIUS Mode:</span> Voucher codes are used as username/password for WiFi login. Works with any RADIUS-capable router. Set your router to authenticate against your FreeRADIUS server.</div>
        <div><span className="text-slate-300 font-medium">MikroTik API Mode:</span> The system directly manages hotspot sessions via MikroTik REST API (RouterOS 7+). Enables automatic user disconnect when vouchers expire. Enable in router settings and test the connection.</div>
        <div className="mt-2">
          📖 See the <a href="/manual" className="text-brand-400 underline">User Manual → Router Integration</a> for step-by-step setup.
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routers.map(r => (
          <div key={r.id} className="card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center">
                <RouterIcon size={18} className="text-brand-400" />
              </div>
              <div className="flex items-center gap-2">
                {r.use_api && <span className="badge-info text-xs">API</span>}
                <span className={statusColor(r.status)}>{r.status}</span>
              </div>
            </div>
            <h3 className="font-bold text-slate-100 mb-1">{r.name}</h3>
            <div className="space-y-1 text-xs text-slate-500 mb-4">
              <div>IP: <span className="font-mono text-slate-300">{r.ip_address}</span></div>
              <div>Type: <span className="text-slate-300">{r.type}</span></div>
              <div>Mode: <span className="text-slate-300">{r.use_api ? 'MikroTik REST API' : 'RADIUS'}</span></div>
              <div>Port: {r.port}</div>
              {r.nas_identifier && <div>NAS ID: <span className="font-mono text-slate-300">{r.nas_identifier}</span></div>}
              {r.last_seen && <div className="flex items-center gap-1"><Clock size={10} />Last seen: {formatDate(r.last_seen)}</div>}
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => handleTest(r.id)}
                disabled={testing[r.id] === 'loading'}
                className="btn-secondary py-1.5 px-2 text-xs flex-1 justify-center">
                <TestIcon id={r.id} />Test
              </button>
              <button onClick={() => openEdit(r)} className="btn-secondary py-1.5 px-2 text-xs"><Edit2 size={13} /></button>
              <button onClick={() => setConfirm({ open: true, id: r.id })} className="btn-danger py-1.5 px-2 text-xs"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {!loading && !routers.length && (
          <div className="col-span-full card text-center py-16 text-slate-500">
            <RouterIcon size={40} className="mx-auto mb-3 text-slate-700" />
            <p className="mb-2">No routers configured</p>
            <p className="text-xs">Add your router to enable automatic user management</p>
          </div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, edit: null })} title={modal.edit ? 'Edit Router' : 'Add Router'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 form-group"><label className="label">Router Name *</label><input className="input" placeholder="Main AP / Office Router" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
            <div className="form-group"><label className="label">IP Address *</label><input className="input" placeholder="192.168.1.1" value={form.ipAddress} onChange={e => setForm(p => ({ ...p, ipAddress: e.target.value }))} required /></div>
            <div className="form-group"><label className="label">Router Type *</label>
              <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* RADIUS Section */}
          <div className="border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">RADIUS Settings</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group"><label className="label">RADIUS Port</label><input className="input" type="number" value={form.port} onChange={e => setForm(p => ({ ...p, port: e.target.value }))} /></div>
              <div className="form-group"><label className="label">NAS Identifier</label><input className="input" placeholder="optional" value={form.nasIdentifier} onChange={e => setForm(p => ({ ...p, nasIdentifier: e.target.value }))} /></div>
              <div className="col-span-2 form-group"><label className="label">RADIUS Shared Secret</label><input className="input" type="password" placeholder="Shared secret key" value={form.secret} onChange={e => setForm(p => ({ ...p, secret: e.target.value }))} /></div>
            </div>
          </div>

          {/* MikroTik API Section */}
          <div className="border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">MikroTik REST API (RouterOS 7+)</div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-slate-400">Enable</span>
                <div onClick={() => setForm(p => ({ ...p, useApi: !p.useApi }))}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ${form.useApi ? 'bg-brand-500' : 'bg-slate-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${form.useApi ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </label>
            </div>
            {form.useApi && (
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group"><label className="label">API Username</label><input className="input" placeholder="admin" value={form.apiUsername} onChange={e => setForm(p => ({ ...p, apiUsername: e.target.value }))} /></div>
                <div className="form-group"><label className="label">API Password</label><input className="input" type="password" placeholder="Router password" value={form.apiPassword} onChange={e => setForm(p => ({ ...p, apiPassword: e.target.value }))} /></div>
                <div className="col-span-2 text-xs text-slate-500">Enable HTTP API on MikroTik: IP → Services → Enable <strong>www</strong> (port 80)</div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModal({ open: false, edit: null })}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : modal.edit ? 'Update Router' : 'Add Router'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false, id: null })} onConfirm={handleDelete}
        title="Remove Router" message="Remove this router from the system?" loading={saving} />
    </div>
  );
}
