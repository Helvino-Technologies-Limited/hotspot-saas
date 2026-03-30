import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, CreditCard, Phone, Mail, Wifi, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AccountSuspended() {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState('');

  const copy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const isFirstTime = !user?.firstPaymentPaid;
  const amount = isFirstTime ? '70,000' : '20,000';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Wifi size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-100">HOTSPOT<span className="text-brand-400">SaaS</span></span>
          </div>
          <button onClick={logout} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={36} className="text-amber-400" />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-100 mb-3">Account Inactive</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            {user?.tenantStatus === 'trial'
              ? 'Your free trial has ended.'
              : 'Your subscription has expired or your account has been deactivated.'}{' '}
            Please make payment to restore full access to your dashboard.
          </p>

          {/* Payment Card */}
          <div className="card mb-6 text-left border-brand-500/20">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-brand-400" />
              <h2 className="font-semibold text-slate-100">Payment Instructions</h2>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Amount</span>
                <span className="font-bold text-brand-400 text-lg">KES {amount}</span>
              </div>
              <div className="border-t border-slate-800" />
              <PayRow label="Paybill Number" value="522533" onCopy={() => copy('522533', 'Paybill')} copied={copied === 'Paybill'} />
              <PayRow label="Account Number" value="8071524" onCopy={() => copy('8071524', 'Account')} copied={copied === 'Account'} />
              <PayRow label="Account Name" value="Helvino Technologies Ltd" />
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">M-Pesa Steps</p>
              {[
                'Go to M-Pesa → Lipa na M-Pesa → Pay Bill',
                'Business No: 522533',
                `Account No: 8071524`,
                `Amount: KES ${amount}`,
                'Enter your M-Pesa PIN and confirm',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-sm text-slate-400">
              <CheckCircle2 size={14} className="text-emerald-500 inline mr-1.5" />
              {isFirstTime
                ? 'First year: KES 70,000 — subsequent years: KES 20,000/year'
                : 'Annual renewal: KES 20,000/year'}
            </div>
          </div>

          {/* Contact */}
          <div className="card text-left">
            <p className="text-sm text-slate-500 mb-3">After payment, contact us to activate your account:</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <a href="tel:0110421320" className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors">
                <Phone size={16} className="text-brand-400 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Call / WhatsApp</div>
                  <div className="text-sm font-semibold text-slate-200">0110421320</div>
                </div>
              </a>
              <a href="mailto:info@helvino.org" className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors">
                <Mail size={16} className="text-brand-400 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Email</div>
                  <div className="text-sm font-semibold text-slate-200">info@helvino.org</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PayRow({ label, value, onCopy, copied }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-200">{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="text-slate-600 hover:text-brand-400 transition-colors">
            {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
