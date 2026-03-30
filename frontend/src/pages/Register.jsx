import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wifi, Building2, Mail, Phone, User, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ businessName: '', email: '', phone: '', adminName: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        businessName: form.businessName,
        email: form.email,
        phone: form.phone,
        adminName: form.adminName,
        password: form.password,
      });
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Welcome! Your 5-day free trial has started.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Wifi size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-100">HOTSPOT<span className="text-brand-400">SaaS</span></span>
          </Link>
          <span className="text-sm text-slate-400">Already have an account? <Link to="/login" className="text-brand-400 hover:text-brand-300">Sign in</Link></span>
        </div>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-4">
              <CheckCircle2 size={14} />
              5-Day Free Trial
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 mb-2">Register Your Business</h1>
            <p className="text-slate-400 text-sm">Start your free trial — no payment required to begin.</p>
          </div>

          {/* Trial Info Box */}
          <div className="card mb-6 border-brand-500/20 bg-brand-500/5">
            <h3 className="font-semibold text-brand-400 mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} />
              Trial &amp; Subscription Details
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />5 days free trial — full access to all features</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />First year subscription: <span className="text-slate-200 font-semibold">KES 70,000</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />Annual renewal: <span className="text-slate-200 font-semibold">KES 20,000/year</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />Payment: Paybill <span className="text-slate-200 font-semibold">522533</span>, A/C: <span className="text-slate-200 font-semibold">8071524</span></li>
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Business Name</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text" required
                  value={form.businessName}
                  onChange={e => set('businessName', e.target.value)}
                  placeholder="e.g. City WiFi Solutions"
                  className="input pl-9 w-full"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Business Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email" required
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="you@business.com"
                    className="input pl-9 w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="input pl-9 w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Your Name (Admin)</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text" required
                  value={form.adminName}
                  onChange={e => set('adminName', e.target.value)}
                  placeholder="Your full name"
                  className="input pl-9 w-full"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPass ? 'text' : 'password'} required
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    className="input pl-9 pr-9 w-full"
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPass ? 'text' : 'password'} required
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    placeholder="Repeat password"
                    className="input pl-9 w-full"
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? 'Creating account…' : <><span>Start Free Trial</span> <ArrowRight size={16} /></>}
            </button>

            <p className="text-center text-xs text-slate-500">
              By registering you agree to our terms. After the 5-day trial, your account will be deactivated until payment is made.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
