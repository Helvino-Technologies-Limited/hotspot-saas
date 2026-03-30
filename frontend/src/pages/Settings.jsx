import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { Lock, User, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const { put, loading } = useApi();
  const [tab, setTab] = useState('account');
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    try {
      await put('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed successfully');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-0">
        {[{ id: 'account', label: 'Account', icon: User }, { id: 'security', label: 'Security', icon: Lock }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${tab === t.id ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'account' && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-slate-200">Account Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="label">Name</div><div className="text-slate-200 font-medium">{user?.username}</div></div>
            <div><div className="label">Email</div><div className="text-slate-200 font-medium">{user?.email}</div></div>
            <div><div className="label">Role</div><div className="text-slate-200 font-medium capitalize">{user?.role}</div></div>
            <div><div className="label">Organization</div><div className="text-slate-200 font-medium">{user?.tenantName || 'Helvino Technologies'}</div></div>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="card">
          <h2 className="font-semibold text-slate-200 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {['currentPassword', 'newPassword', 'confirmPassword'].map((f, i) => (
              <div key={f} className="form-group">
                <label className="label">{['Current Password', 'New Password', 'Confirm New Password'][i]}</label>
                <input className="input" type="password" value={passForm[f]} onChange={e => setPassForm(p => ({ ...p, [f]: e.target.value }))} required minLength={i > 0 ? 8 : 1} />
              </div>
            ))}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      <div className="card text-sm text-slate-500 space-y-1">
        <div className="font-semibold text-slate-400 mb-2">Support & Licensing</div>
        <div>🌐 <a href="https://helvino.org" className="text-brand-400 hover:underline">helvino.org</a></div>
        <div>✉️ <a href="mailto:info@helvino.org" className="text-brand-400 hover:underline">info@helvino.org</a></div>
        <div>📞 0110421320</div>
      </div>
    </div>
  );
}
