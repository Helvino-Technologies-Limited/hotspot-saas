import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { Lock, User, CreditCard, Building2, Wifi, Smartphone, Phone, Mail, Globe, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'branding', label: 'Branding', icon: Building2 },
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone },
  { id: 'bank', label: 'Other Payments', icon: CreditCard },
  { id: 'portal', label: 'Portal', icon: Wifi },
  { id: 'security', label: 'Security', icon: Lock },
];

export default function Settings() {
  const { user } = useAuth();
  const { get, put, loading } = useApi();
  const [tab, setTab] = useState('account');
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});

  // Forms
  const [branding, setBranding] = useState({ name: '', phone: '', logoUrl: '', primaryColor: '#0ea5e9', secondaryColor: '#0369a1' });
  const [mpesa, setMpesa] = useState({ consumerKey: '', consumerSecret: '', shortcode: '', passkey: '', env: 'sandbox', callbackUrl: '' });
  const [bank, setBank] = useState({ bankName: '', accountNumber: '', accountName: '', paybill: '', tillNumber: '', airtelMoneyCode: '' });
  const [portal, setPortal] = useState({ welcomeMessage: '', ssid: '', supportPhone: '', supportEmail: '', footerText: '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    get('/settings').then(d => {
      if (!d?.success) return;
      const s = d.data;
      setSettings(s);
      setBranding({ name: s.name || '', phone: s.phone || '', logoUrl: s.logoUrl || '', primaryColor: s.primaryColor || '#0ea5e9', secondaryColor: s.secondaryColor || '#0369a1' });
      setMpesa(s.mpesa || {});
      setBank(s.bank || {});
      setPortal(s.portal || {});
    });
  }, []);

  const saveBranding = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await put('/settings/branding', branding); toast.success('Branding saved'); } finally { setSaving(false); }
  };

  const saveMpesa = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await put('/settings', { section: 'mpesa', data: mpesa }); toast.success('M-Pesa settings saved'); } finally { setSaving(false); }
  };

  const saveBank = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await put('/settings', { section: 'bank', data: bank }); toast.success('Payment settings saved'); } finally { setSaving(false); }
  };

  const savePortal = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await put('/settings', { section: 'portal', data: portal }); toast.success('Portal settings saved'); } finally { setSaving(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await put('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally { setSaving(false); }
  };

  const toggle = (key) => setShowSecrets(p => ({ ...p, [key]: !p[key] }));

  const SecretInput = ({ label, field, form, setForm, hint }) => (
    <div className="form-group">
      <label className="label">{label}</label>
      <div className="relative">
        <input
          className="input pr-10"
          type={showSecrets[field] ? 'text' : 'password'}
          value={form[field] || ''}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          placeholder={hint || ''}
        />
        <button type="button" onClick={() => toggle(field)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
          {showSecrets[field] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  const SaveBtn = ({ label = 'Save Changes' }) => (
    <button type="submit" className="btn-primary" disabled={saving || loading}>
      {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : label}
    </button>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account, payments, branding, and portal</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-800">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${tab === t.id ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* Account */}
      {tab === 'account' && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-slate-200">Account Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="label">Name</div><div className="text-slate-200 font-medium">{user?.username}</div></div>
            <div><div className="label">Email</div><div className="text-slate-200 font-medium">{user?.email}</div></div>
            <div><div className="label">Role</div><div className="text-slate-200 font-medium capitalize">{user?.role}</div></div>
            <div><div className="label">Organization</div><div className="text-slate-200 font-medium">{user?.tenantName || '—'}</div></div>
          </div>
          <div className="divider pt-2">
            <div className="text-sm font-semibold text-slate-400 mb-3">Support & Licensing</div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: Globe, label: 'Website', value: 'helvino.org', href: 'https://helvino.org' },
                { icon: Mail, label: 'Email', value: 'info@helvino.org', href: 'mailto:info@helvino.org' },
                { icon: Phone, label: 'Phone / WhatsApp', value: '0110421320', href: 'tel:0110421320' },
              ].map(c => (
                <a key={c.label} href={c.href} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <c.icon size={16} className="text-brand-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500">{c.label}</div>
                    <div className="text-sm text-slate-200">{c.value}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Branding */}
      {tab === 'branding' && (
        <form onSubmit={saveBranding} className="card space-y-5">
          <h2 className="font-semibold text-slate-200">Branding & Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 form-group">
              <label className="label">Company / Hotspot Name</label>
              <input className="input" value={branding.name} onChange={e => setBranding(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Support Phone</label>
              <input className="input" placeholder="0712 345 678" value={branding.phone} onChange={e => setBranding(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="col-span-2 form-group">
              <label className="label">Logo URL</label>
              <input className="input" placeholder="https://example.com/logo.png" value={branding.logoUrl} onChange={e => setBranding(p => ({ ...p, logoUrl: e.target.value }))} />
              <p className="text-xs text-slate-500 mt-1">Upload your logo to an image host (e.g. imgur.com) and paste the URL here</p>
            </div>
            <div className="form-group">
              <label className="label">Primary Color</label>
              <div className="flex gap-2">
                <input type="color" className="w-12 h-10 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer" value={branding.primaryColor} onChange={e => setBranding(p => ({ ...p, primaryColor: e.target.value }))} />
                <input className="input" value={branding.primaryColor} onChange={e => setBranding(p => ({ ...p, primaryColor: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Secondary Color</label>
              <div className="flex gap-2">
                <input type="color" className="w-12 h-10 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer" value={branding.secondaryColor} onChange={e => setBranding(p => ({ ...p, secondaryColor: e.target.value }))} />
                <input className="input" value={branding.secondaryColor} onChange={e => setBranding(p => ({ ...p, secondaryColor: e.target.value }))} />
              </div>
            </div>
          </div>
          {branding.logoUrl && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="text-xs text-slate-500 mb-2">Preview</div>
              <img src={branding.logoUrl} alt="Logo preview" className="h-12 object-contain" onError={e => { e.target.style.display='none'; }} />
            </div>
          )}
          <SaveBtn />
        </form>
      )}

      {/* M-Pesa */}
      {tab === 'mpesa' && (
        <form onSubmit={saveMpesa} className="space-y-4">
          <div className="card space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-slate-200">M-Pesa Integration</h2>
                <p className="text-xs text-slate-500 mt-1">Safaricom Daraja API credentials for STK Push payments</p>
              </div>
              {settings?.mpesa?.configured
                ? <span className="badge-success"><CheckCircle2 size={12} />Configured</span>
                : <span className="badge-warning"><AlertCircle size={12} />Not configured</span>}
            </div>

            <div className="p-3 rounded-xl bg-brand-500/5 border border-brand-500/20 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-brand-400">How to get your credentials:</p>
              <p>1. Go to <strong>developer.safaricom.co.ke</strong> and create an app</p>
              <p>2. Under your app, copy <strong>Consumer Key</strong> and <strong>Consumer Secret</strong></p>
              <p>3. From Safaricom portal, get your <strong>Business Shortcode</strong> and <strong>Passkey</strong></p>
              <p>4. Set callback URL to: <code className="bg-slate-800 px-1 rounded">https://your-backend.onrender.com/api/payments/mpesa/callback</code></p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Environment</label>
                <select className="input" value={mpesa.env || 'sandbox'} onChange={e => setMpesa(p => ({ ...p, env: e.target.value }))}>
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Business Shortcode</label>
                <input className="input" placeholder="174379" value={mpesa.shortcode || ''} onChange={e => setMpesa(p => ({ ...p, shortcode: e.target.value }))} />
              </div>
              <SecretInput label="Consumer Key" field="consumerKey" form={mpesa} setForm={setMpesa} hint="From Safaricom Daraja" />
              <SecretInput label="Consumer Secret" field="consumerSecret" form={mpesa} setForm={setMpesa} />
              <div className="col-span-2">
                <SecretInput label="Lipa Na M-Pesa Passkey" field="passkey" form={mpesa} setForm={setMpesa} hint="From Safaricom portal" />
              </div>
              <div className="col-span-2 form-group">
                <label className="label">Callback URL</label>
                <input className="input" placeholder="https://your-backend.onrender.com/api/payments/mpesa/callback" value={mpesa.callbackUrl || ''} onChange={e => setMpesa(p => ({ ...p, callbackUrl: e.target.value }))} />
              </div>
            </div>
          </div>
          <SaveBtn label="Save M-Pesa Settings" />
        </form>
      )}

      {/* Bank / Other Payments */}
      {tab === 'bank' && (
        <form onSubmit={saveBank} className="space-y-4">
          <div className="card space-y-5">
            <h2 className="font-semibold text-slate-200">Other Payment Methods</h2>
            <p className="text-xs text-slate-500">These details are displayed to customers at the captive portal as payment options.</p>

            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paybill / Till</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">M-Pesa Paybill Number</label>
                <input className="input" placeholder="e.g. 522533" value={bank.paybill || ''} onChange={e => setBank(p => ({ ...p, paybill: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Till Number (Buy Goods)</label>
                <input className="input" placeholder="e.g. 789456" value={bank.tillNumber || ''} onChange={e => setBank(p => ({ ...p, tillNumber: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Airtel Money Code</label>
                <input className="input" placeholder="Airtel Money business code" value={bank.airtelMoneyCode || ''} onChange={e => setBank(p => ({ ...p, airtelMoneyCode: e.target.value }))} />
              </div>
            </div>

            <div className="divider pt-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Bank Transfer</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Bank Name</label>
                <input className="input" placeholder="e.g. Equity Bank" value={bank.bankName || ''} onChange={e => setBank(p => ({ ...p, bankName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Account Name</label>
                <input className="input" placeholder="Company name" value={bank.accountName || ''} onChange={e => setBank(p => ({ ...p, accountName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Account Number</label>
                <input className="input" placeholder="0012345678" value={bank.accountNumber || ''} onChange={e => setBank(p => ({ ...p, accountNumber: e.target.value }))} />
              </div>
            </div>
          </div>
          <SaveBtn label="Save Payment Settings" />
        </form>
      )}

      {/* Portal */}
      {tab === 'portal' && (
        <form onSubmit={savePortal} className="space-y-4">
          <div className="card space-y-5">
            <h2 className="font-semibold text-slate-200">Captive Portal Settings</h2>
            <p className="text-xs text-slate-500">Customize what users see when they connect to your WiFi hotspot.</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 form-group">
                <label className="label">WiFi SSID (Network Name)</label>
                <input className="input" placeholder="e.g. MyHotspot_Free" value={portal.ssid || ''} onChange={e => setPortal(p => ({ ...p, ssid: e.target.value }))} />
                <p className="text-xs text-slate-500 mt-1">Shown on the portal so customers know they're on the right network</p>
              </div>
              <div className="col-span-2 form-group">
                <label className="label">Welcome Message</label>
                <textarea className="input" rows={3} placeholder="Welcome! Buy internet access below..." value={portal.welcomeMessage || ''} onChange={e => setPortal(p => ({ ...p, welcomeMessage: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Support Phone</label>
                <input className="input" placeholder="0712 345 678" value={portal.supportPhone || ''} onChange={e => setPortal(p => ({ ...p, supportPhone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Support Email</label>
                <input className="input" type="email" placeholder="support@yourcompany.com" value={portal.supportEmail || ''} onChange={e => setPortal(p => ({ ...p, supportEmail: e.target.value }))} />
              </div>
              <div className="col-span-2 form-group">
                <label className="label">Footer Text</label>
                <input className="input" placeholder="© 2025 My Hotspot. Powered by Helvino Technologies" value={portal.footerText || ''} onChange={e => setPortal(p => ({ ...p, footerText: e.target.value }))} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-slate-400">
              <p className="font-semibold text-slate-300 mb-1">Your portal URL:</p>
              <code className="text-brand-400">https://hotspot-saas.vercel.app/portal/{user?.tenantSlug || 'your-slug'}</code>
              <p className="mt-2">Set this as the redirect URL in your router's hotspot/captive portal settings.</p>
            </div>
          </div>
          <SaveBtn label="Save Portal Settings" />
        </form>
      )}

      {/* Security */}
      {tab === 'security' && (
        <div className="card">
          <h2 className="font-semibold text-slate-200 mb-4">Change Password</h2>
          <form onSubmit={savePassword} className="space-y-4 max-w-sm">
            {[
              { field: 'currentPassword', label: 'Current Password' },
              { field: 'newPassword', label: 'New Password' },
              { field: 'confirmPassword', label: 'Confirm New Password' },
            ].map(({ field, label }) => (
              <div key={field} className="form-group">
                <label className="label">{label}</label>
                <input className="input" type="password" value={passForm[field]} onChange={e => setPassForm(p => ({ ...p, [field]: e.target.value }))} required minLength={field !== 'currentPassword' ? 8 : 1} />
              </div>
            ))}
            <SaveBtn label="Update Password" />
          </form>
        </div>
      )}
    </div>
  );
}
