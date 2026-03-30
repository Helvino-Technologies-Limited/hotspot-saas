import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wifi, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      if (data.success) {
        toast.success(`Welcome back, ${data.user.username}!`);
        navigate(data.user.role === 'superadmin' ? '/superadmin' : '/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Wifi size={22} className="text-white" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-xl text-slate-100 leading-none">HOTSPOT</div>
              <div className="text-brand-400 text-sm font-semibold">SaaS Platform</div>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 mt-4">Sign In to Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your WiFi hotspot business</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="email" className="input pl-10" placeholder="admin@example.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required autoFocus />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type={showPass ? 'text' : 'password'} className="input pl-10 pr-12" placeholder="••••••••"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
            {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-600">
              Demo: <span className="text-brand-500 font-mono">admin@demohotspot.com / Admin@123</span>
            </p>
          </div>
        </form>

        <p className="text-center mt-6 text-xs text-slate-600">
          <Link to="/" className="hover:text-slate-400 transition-colors">← Back to homepage</Link>
        </p>

        <div className="text-center mt-8 text-xs text-slate-700">
          Support: <a href="mailto:info@helvino.org" className="text-brand-600 hover:text-brand-400">info@helvino.org</a> · 0110421320
        </div>
      </div>
    </div>
  );
}
