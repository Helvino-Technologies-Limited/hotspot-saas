import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { Wifi, CreditCard, CheckCircle2, Clock, Zap, Copy, Check, Phone, Globe, Mail } from 'lucide-react';
import { formatCurrency, formatDuration, copyToClipboard } from '../utils/helpers';
import toast from 'react-hot-toast';

const STEPS = { SELECT: 'select', PAYMENT: 'payment', CONFIRM: 'confirm', SUCCESS: 'success' };

export default function CaptivePortal() {
  const { tenantSlug } = useParams();
  const [tenant, setTenant] = useState(null);
  const [packages, setPackages] = useState([]);
  const [step, setStep] = useState(STEPS.SELECT);
  const [selected, setSelected] = useState(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [polling, setPolling] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [voucher, setVoucher] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/packages/public/${tenantSlug}`).then(({ data }) => {
      if (data.success) { setTenant(data.tenant); setPackages(data.packages); }
    }).catch(() => setError('Provider not found')).finally(() => setLoading(false));
  }, [tenantSlug]);

  useEffect(() => {
    if (!paymentId || step !== STEPS.CONFIRM) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/payments/status/${paymentId}`);
        if (data.data.status === 'completed' && data.data.voucherCode) {
          clearInterval(interval);
          setVoucher(data.data);
          setStep(STEPS.SUCCESS);
        } else if (data.data.status === 'failed') {
          clearInterval(interval);
          setError('Payment failed. Please try again.');
          setStep(STEPS.PAYMENT);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [paymentId, step]);

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    setPaying(true);
    try {
      const { data } = await api.post('/payments/mpesa/stk', { packageId: selected.id, phoneNumber: phone, tenantSlug });
      if (data.success) {
        setPaymentId(data.paymentId);
        setStep(STEPS.CONFIRM);
        if (data.sandbox) toast('Sandbox: Auto-completing in 3 seconds...', { icon: '🧪' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(voucher?.voucherCode);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const brandColor = tenant?.primary_color || '#0ea5e9';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error && !tenant) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-center px-6">
      <div><Wifi size={48} className="mx-auto mb-4 text-slate-700" /><p className="text-xl font-bold text-slate-300 mb-2">Provider Not Found</p><p>{error}</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ background: brandColor }}>
            <Wifi size={18} />
          </div>
          <div>
            <div className="font-bold text-slate-100">{tenant?.name}</div>
            <div className="text-xs text-slate-500">WiFi Access Portal</div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Online
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Step: Select Package */}
          {step === STEPS.SELECT && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-100 mb-2">Choose Your Plan</h1>
                <p className="text-slate-500 text-sm">Select an internet package to get started</p>
              </div>
              <div className="space-y-3">
                {packages.map(p => (
                  <button key={p.id} onClick={() => { setSelected(p); setStep(STEPS.PAYMENT); }}
                    className="w-full text-left card-hover flex items-center justify-between group transition-all hover:border-brand-500/50">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: brandColor + '20', border: `1px solid ${brandColor}40` }}>
                        <Clock size={18} style={{ color: brandColor }} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-100">{p.name}</div>
                        <div className="text-xs text-slate-500">
                          {formatDuration(p.duration_minutes)}
                          {p.speed_limit_mbps ? ` · ${p.speed_limit_mbps} Mbps` : ''}
                          {p.device_limit > 1 ? ` · ${p.device_limit} devices` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold" style={{ color: brandColor }}>{formatCurrency(p.price)}</div>
                    </div>
                  </button>
                ))}
                {!packages.length && <p className="text-center text-slate-500 py-8">No packages available</p>}
              </div>
            </div>
          )}

          {/* Step: Payment */}
          {step === STEPS.PAYMENT && selected && (
            <div className="space-y-6 animate-slide-up">
              <button onClick={() => setStep(STEPS.SELECT)} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">← Back</button>
              <div>
                <h1 className="text-2xl font-bold text-slate-100 mb-1">Complete Payment</h1>
                <p className="text-slate-500 text-sm">Pay via M-Pesa to access the internet</p>
              </div>

              {/* Summary */}
              <div className="card bg-slate-800/50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-100">{selected.name}</div>
                    <div className="text-xs text-slate-500">{formatDuration(selected.duration_minutes)}</div>
                  </div>
                  <div className="text-2xl font-extrabold" style={{ color: brandColor }}>{formatCurrency(selected.price)}</div>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
              )}

              <form onSubmit={handlePay} className="space-y-4">
                <div className="form-group">
                  <label className="label">M-Pesa Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input className="input pl-10" type="tel" placeholder="0712 345 678" value={phone}
                      onChange={e => setPhone(e.target.value)} required />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">You will receive an M-Pesa prompt on your phone</p>
                </div>
                <button type="submit" className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg" style={{ background: brandColor }} disabled={paying}>
                  {paying ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : `Pay ${formatCurrency(selected.price)}`}
                </button>
              </form>

              <div className="flex items-center gap-2 justify-center text-xs text-slate-600">
                <CreditCard size={12} />
                Powered by M-Pesa · Secure Payment
              </div>
            </div>
          )}

          {/* Step: Confirming */}
          {step === STEPS.CONFIRM && (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ background: brandColor + '20' }}>
                <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: brandColor, borderTopColor: 'transparent' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100 mb-2">Confirming Payment</h2>
                <p className="text-slate-500 text-sm">Check your phone for the M-Pesa prompt.<br />Complete the payment to get your voucher code.</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl text-sm text-slate-400 space-y-1">
                <p>Package: <span className="text-slate-200 font-medium">{selected?.name}</span></p>
                <p>Amount: <span className="font-bold" style={{ color: brandColor }}>{formatCurrency(selected?.price)}</span></p>
              </div>
              <button onClick={() => setStep(STEPS.PAYMENT)} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Cancel</button>
            </div>
          )}

          {/* Step: Success */}
          {step === STEPS.SUCCESS && voucher && (
            <div className="text-center space-y-6 animate-slide-up">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Payment Successful!</h2>
                <p className="text-slate-500 text-sm">Here is your WiFi access code</p>
              </div>

              <div className="card text-center" style={{ borderColor: brandColor + '40' }}>
                <p className="text-xs text-slate-500 mb-3">Your Voucher Code</p>
                <div className="text-4xl font-black tracking-[0.3em] mb-4" style={{ color: brandColor, fontFamily: 'JetBrains Mono, monospace' }}>
                  {voucher.voucherCode}
                </div>
                <button onClick={handleCopy} className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{ background: brandColor + '20', color: brandColor, border: `1px solid ${brandColor}40` }}>
                  {copied ? <><Check size={16} />Copied!</> : <><Copy size={16} />Copy Code</>}
                </button>
              </div>

              <div className="card bg-slate-800/50 text-left space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Package</span><span className="text-slate-200 font-medium">{voucher.packageName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Duration</span><span className="text-slate-200 font-medium">{formatDuration(voucher.durationMinutes)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount Paid</span><span className="font-bold" style={{ color: brandColor }}>{formatCurrency(voucher.amount)}</span></div>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-xl text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-400">How to connect:</p>
                <p>1. Go to your WiFi settings</p>
                <p>2. Connect to <strong className="text-slate-300">{tenant?.name}</strong></p>
                <p>3. Enter the code above as the password</p>
                <p>4. Enjoy the internet!</p>
              </div>

              <button onClick={() => { setStep(STEPS.SELECT); setVoucher(null); setSelected(null); setPhone(''); }}
                className="w-full py-3 rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-colors border border-slate-800 hover:border-slate-700">
                Buy Another
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-700 border-t border-slate-800">
        Powered by Helvino Technologies · helvino.org · info@helvino.org · 0110421320
      </footer>
    </div>
  );
}
