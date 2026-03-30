import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import {
  Wifi, CreditCard, CheckCircle2, Clock, Copy, Check, Phone, ChevronRight,
  Smartphone, Building2, Zap, AlertCircle, ArrowLeft, MessageSquare, Shield
} from 'lucide-react';
import { formatCurrency, formatDuration, copyToClipboard } from '../utils/helpers';
import toast from 'react-hot-toast';

const STEPS = { SELECT: 'select', METHOD: 'method', PAYMENT: 'payment', CONFIRM: 'confirm', SUCCESS: 'success' };

const METHODS = {
  stk:     { id: 'stk',     label: 'M-Pesa STK Push',  icon: Smartphone, desc: 'Get a prompt on your phone instantly', auto: true },
  paybill: { id: 'paybill', label: 'M-Pesa Paybill',   icon: Building2,  desc: 'Pay to paybill and enter reference',  auto: false },
  till:    { id: 'till',    label: 'Buy Goods (Till)',  icon: CreditCard, desc: 'Pay to till number, enter reference',  auto: false },
  airtel:  { id: 'airtel',  label: 'Airtel Money',      icon: Smartphone, desc: 'Pay via Airtel Money, enter reference', auto: false },
};

export default function CaptivePortal() {
  const { tenantSlug } = useParams();
  const [tenant, setTenant] = useState(null);
  const [packages, setPackages] = useState([]);
  const [step, setStep] = useState(STEPS.SELECT);
  const [selected, setSelected] = useState(null);
  const [method, setMethod] = useState(null);
  const [phone, setPhone] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [voucher, setVoucher] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/packages/public/${tenantSlug}`)
      .then(({ data }) => { if (data.success) { setTenant(data.tenant); setPackages(data.packages); } })
      .catch(() => setError('Provider not found'))
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  // Poll for STK payment status
  useEffect(() => {
    if (!paymentId || step !== STEPS.CONFIRM) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/payments/status/${paymentId}`);
        if (data.data?.status === 'completed' && data.data?.voucherCode) {
          clearInterval(interval);
          setVoucher(data.data);
          setStep(STEPS.SUCCESS);
        } else if (data.data?.status === 'failed') {
          clearInterval(interval);
          setError('Payment failed or timed out. Please try again.');
          setStep(STEPS.PAYMENT);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [paymentId, step]);

  const brand = tenant?.primary_color || '#0ea5e9';

  // Available payment methods based on tenant config
  const availableMethods = tenant ? [
    tenant.paymentOptions?.stkPush && METHODS.stk,
    tenant.paymentOptions?.paybill && METHODS.paybill,
    tenant.paymentOptions?.tillNumber && METHODS.till,
    tenant.paymentOptions?.airtelMoney && METHODS.airtel,
  ].filter(Boolean) : [METHODS.stk]; // default to STK

  const handleSelectPackage = (pkg) => {
    setSelected(pkg);
    setError('');
    // If only one method available, skip method selection
    if (availableMethods.length === 1) {
      setMethod(availableMethods[0]);
      setStep(STEPS.PAYMENT);
    } else {
      setStep(STEPS.METHOD);
    }
  };

  const handleSelectMethod = (m) => {
    setMethod(m);
    setStep(STEPS.PAYMENT);
  };

  // STK Push payment
  const handleStkPay = async (e) => {
    e.preventDefault();
    setError(''); setPaying(true);
    try {
      const { data } = await api.post('/payments/mpesa/stk', {
        packageId: selected.id, phoneNumber: phone, tenantSlug,
      });
      if (data.success) {
        setPaymentId(data.paymentId);
        setStep(STEPS.CONFIRM);
        if (data.sandbox) toast('Sandbox mode: auto-completing in 3 seconds…', { icon: '🧪' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Try again.');
    } finally { setPaying(false); }
  };

  // Manual payment (Paybill / Till / Airtel)
  const handleManualPay = async (e) => {
    e.preventDefault();
    if (!reference.trim()) { setError('Please enter your transaction reference'); return; }
    setError(''); setPaying(true);
    try {
      const { data } = await api.post('/payments/manual', {
        packageId: selected.id, phoneNumber: phone, tenantSlug,
        method: method.id, reference: reference.trim(),
      });
      if (data.success) {
        setVoucher({
          voucherCode: data.voucherCode,
          packageName: data.packageName,
          durationMinutes: data.durationMinutes,
          amount: data.amount,
        });
        setStep(STEPS.SUCCESS);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not process payment. Check your reference and try again.');
    } finally { setPaying(false); }
  };

  const handleCopy = async () => {
    await copyToClipboard(voucher?.voucherCode);
    setCopied(true); toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setStep(STEPS.SELECT); setSelected(null); setMethod(null);
    setPhone(''); setReference(''); setVoucher(null); setError('');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#0ea5e9', borderTopColor: 'transparent' }} />
    </div>
  );

  if (error && !tenant) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-center px-6">
      <div>
        <Wifi size={48} className="mx-auto mb-4 text-slate-700" />
        <p className="text-xl font-bold text-slate-300 mb-2">Provider Not Found</p>
        <p className="text-slate-500">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {tenant?.logo_url
            ? <img src={tenant.logo_url} alt={tenant.name} className="h-9 object-contain rounded-lg" onError={e => e.target.style.display='none'} />
            : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: brand }}>
                <Wifi size={17} />
              </div>
          }
          <div>
            <div className="font-bold text-slate-100 text-sm">{tenant?.name}</div>
            {tenant?.ssid && <div className="text-xs text-slate-500">Network: {tenant.ssid}</div>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-5 pt-8">
        <div className="w-full max-w-sm">

          {/* Welcome message */}
          {step === STEPS.SELECT && tenant?.welcomeMessage && (
            <div className="mb-5 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-slate-400 text-center">
              {tenant.welcomeMessage}
            </div>
          )}

          {/* ── STEP 1: Select Package ── */}
          {step === STEPS.SELECT && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-100 mb-1">Buy Internet Access</h1>
                <p className="text-slate-500 text-sm">Choose a package to get started</p>
              </div>
              <div className="space-y-3">
                {packages.map(p => (
                  <button key={p.id} onClick={() => handleSelectPackage(p)}
                    className="w-full text-left p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: brand + '20', border: `1px solid ${brand}40` }}>
                        <Clock size={17} style={{ color: brand }} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-100">{p.name}</div>
                        <div className="text-xs text-slate-500">
                          {formatDuration(p.duration_minutes)}
                          {p.speed_limit_mbps ? ` · ${p.speed_limit_mbps} Mbps` : ''}
                          {' · 1 device'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold" style={{ color: brand }}>{formatCurrency(p.price)}</span>
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </button>
                ))}
                {!packages.length && (
                  <div className="text-center text-slate-500 py-10">No packages available right now.</div>
                )}
              </div>

              {/* Single-device notice */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
                <Shield size={13} className="flex-shrink-0 mt-0.5" />
                <span>Each voucher code works on <strong>one device only</strong>. Keep your code private.</span>
              </div>
            </div>
          )}

          {/* ── STEP 2: Choose Payment Method ── */}
          {step === STEPS.METHOD && selected && (
            <div className="space-y-5 animate-slide-up">
              <button onClick={() => setStep(STEPS.SELECT)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors">
                <ArrowLeft size={15} />Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-100 mb-1">How would you like to pay?</h1>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-sm text-slate-300">
                  <span className="font-bold" style={{ color: brand }}>{formatCurrency(selected.price)}</span>
                  <span className="text-slate-600">·</span>
                  <span>{selected.name}</span>
                </div>
              </div>
              <div className="space-y-3">
                {availableMethods.map(m => (
                  <button key={m.id} onClick={() => handleSelectMethod(m)}
                    className="w-full text-left p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <m.icon size={17} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-100 text-sm">{m.label}</div>
                      <div className="text-xs text-slate-500">{m.desc}</div>
                    </div>
                    {m.auto && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Instant</span>}
                    <ChevronRight size={15} className="text-slate-600 group-hover:text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3a: STK Push Payment ── */}
          {step === STEPS.PAYMENT && method?.id === 'stk' && (
            <div className="space-y-5 animate-slide-up">
              <button onClick={() => setStep(availableMethods.length > 1 ? STEPS.METHOD : STEPS.SELECT)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors">
                <ArrowLeft size={15} />Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-100 mb-1">M-Pesa STK Push</h1>
                <p className="text-slate-500 text-sm">Enter your phone — you'll get a payment prompt</p>
              </div>

              {/* Order summary */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-100">{selected?.name}</div>
                  <div className="text-xs text-slate-500">{formatDuration(selected?.duration_minutes)}</div>
                </div>
                <div className="text-xl font-extrabold" style={{ color: brand }}>{formatCurrency(selected?.price)}</div>
              </div>

              {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2"><AlertCircle size={14} className="flex-shrink-0 mt-0.5" />{error}</div>}

              <form onSubmit={handleStkPay} className="space-y-4">
                <div className="form-group">
                  <label className="label">M-Pesa Phone Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input className="input pl-10" type="tel" placeholder="0712 345 678" value={phone}
                      onChange={e => setPhone(e.target.value)} required />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Your voucher code will also be sent to this number via SMS</p>
                </div>
                <button type="submit" disabled={paying}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all flex items-center justify-center gap-2 shadow-lg"
                  style={{ background: paying ? brand + '80' : brand }}>
                  {paying
                    ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending prompt…</>
                    : <><Zap size={18} />Pay {formatCurrency(selected?.price)}</>}
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 3b: Manual Payment (Paybill / Till / Airtel) ── */}
          {step === STEPS.PAYMENT && method && method.id !== 'stk' && (
            <div className="space-y-5 animate-slide-up">
              <button onClick={() => setStep(availableMethods.length > 1 ? STEPS.METHOD : STEPS.SELECT)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors">
                <ArrowLeft size={15} />Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-100 mb-1">{method.label}</h1>
                <p className="text-slate-500 text-sm">Follow the steps below to pay</p>
              </div>

              {/* Payment instructions */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-3">
                <div className="text-sm font-semibold text-slate-300 mb-2">Payment Instructions</div>

                {method.id === 'paybill' && (
                  <ol className="space-y-1.5 text-sm text-slate-400">
                    <li className="flex gap-2"><span className="text-brand-400 font-bold">1.</span> Go to M-Pesa → Lipa Na M-Pesa → Pay Bill</li>
                    <li className="flex gap-2"><span className="text-brand-400 font-bold">2.</span> Business No: <strong className="text-slate-200">{tenant?.paymentOptions?.paybill}</strong></li>
                    <li className="flex gap-2"><span className="text-brand-400 font-bold">3.</span> Account No: <strong className="text-slate-200">your phone number</strong></li>
                    <li className="flex gap-2"><span className="text-brand-400 font-bold">4.</span> Amount: <strong className="text-slate-200">{formatCurrency(selected?.price)}</strong></li>
                    <li className="flex gap-2"><span className="text-brand-400 font-bold">5.</span> Enter PIN and confirm</li>
                  </ol>
                )}
                {method.id === 'till' && (
                  <ol className="space-y-1.5 text-sm text-slate-400">
                    <li className="flex gap-2"><span className="text-brand-400 font-bold">1.</span> Go to M-Pesa → Lipa Na M-Pesa → Buy Goods</li>
                    <li className="flex gap-2"><span className="text-brand-400 font-bold">2.</span> Till No: <strong className="text-slate-200">{tenant?.paymentOptions?.tillNumber}</strong></li>
                    <li className="flex gap-2"><span className="text-brand-400 font-bold">3.</span> Amount: <strong className="text-slate-200">{formatCurrency(selected?.price)}</strong></li>
                    <li className="flex gap-2"><span className="text-brand-400 font-bold">4.</span> Enter PIN and confirm</li>
                  </ol>
                )}
                {method.id === 'airtel' && (
                  <ol className="space-y-1.5 text-sm text-slate-400">
                    <li className="flex gap-2"><span className="text-brand-400 font-bold">1.</span> Dial *334# → Send Money → Business</li>
                    <li className="flex gap-2"><span className="text-brand-400 font-bold">2.</span> Business No: <strong className="text-slate-200">{tenant?.paymentOptions?.airtelMoney}</strong></li>
                    <li className="flex gap-2"><span className="text-brand-400 font-bold">3.</span> Amount: <strong className="text-slate-200">{formatCurrency(selected?.price)}</strong></li>
                    <li className="flex gap-2"><span className="text-brand-400 font-bold">4.</span> Confirm with PIN</li>
                  </ol>
                )}

                <div className="pt-2 border-t border-slate-700 text-xs text-slate-500">
                  After paying, copy the transaction code from your SMS confirmation (e.g. <span className="font-mono text-slate-300">RK12345678</span>) and enter it below.
                </div>
              </div>

              {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2"><AlertCircle size={14} className="flex-shrink-0 mt-0.5" />{error}</div>}

              <form onSubmit={handleManualPay} className="space-y-4">
                <div className="form-group">
                  <label className="label">Your Phone Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input className="input pl-10" type="tel" placeholder="0712 345 678" value={phone}
                      onChange={e => setPhone(e.target.value)} required />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Voucher code will be sent to this number via SMS</p>
                </div>
                <div className="form-group">
                  <label className="label">M-Pesa / Airtel Transaction Code</label>
                  <input className="input font-mono uppercase tracking-widest" placeholder="e.g. RK12345678"
                    value={reference} onChange={e => setReference(e.target.value.toUpperCase())} required />
                </div>
                <button type="submit" disabled={paying}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all flex items-center justify-center gap-2 shadow-lg"
                  style={{ background: paying ? brand + '80' : brand }}>
                  {paying
                    ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying…</>
                    : <><CheckCircle2 size={18} />Get My Voucher Code</>}
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 4: Waiting for STK confirmation ── */}
          {step === STEPS.CONFIRM && (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ background: brand + '15', border: `2px solid ${brand}30` }}>
                <div className="w-10 h-10 border-3 rounded-full animate-spin" style={{ borderColor: brand, borderTopColor: 'transparent', borderWidth: 3 }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100 mb-2">Check Your Phone</h2>
                <p className="text-slate-500 text-sm">An M-Pesa payment request has been sent to<br /><strong className="text-slate-300">{phone}</strong></p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-2xl text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-500">Package</span><span className="text-slate-200 font-medium">{selected?.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold" style={{ color: brand }}>{formatCurrency(selected?.price)}</span></div>
              </div>
              <p className="text-xs text-slate-600">Enter your M-Pesa PIN to confirm · Do not close this page</p>
              <button onClick={() => { setStep(STEPS.PAYMENT); setError(''); }} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Cancel
              </button>
            </div>
          )}

          {/* ── STEP 5: Success ── */}
          {step === STEPS.SUCCESS && voucher && (
            <div className="text-center space-y-5 animate-slide-up">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={34} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-1">You're All Set!</h2>
                <p className="text-slate-500 text-sm">Your voucher code is ready</p>
              </div>

              {/* Big code display */}
              <div className="p-5 rounded-2xl border-2" style={{ borderColor: brand + '50', background: brand + '08' }}>
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Your WiFi Code</p>
                <div className="text-4xl font-black tracking-[0.25em] mb-4" style={{ color: brand, fontFamily: 'monospace' }}>
                  {voucher.voucherCode}
                </div>
                <button onClick={handleCopy}
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{ background: brand + '20', color: brand, border: `1px solid ${brand}40` }}>
                  {copied ? <><Check size={15} />Copied!</> : <><Copy size={15} />Copy Code</>}
                </button>
              </div>

              {/* SMS notice */}
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-400">
                <MessageSquare size={13} />
                Code also sent via SMS to {phone}
              </div>

              {/* Details */}
              <div className="p-4 bg-slate-800/50 rounded-2xl text-left space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Package</span><span className="text-slate-200 font-medium">{voucher.packageName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Duration</span><span className="text-slate-200 font-medium">{formatDuration(voucher.durationMinutes)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount Paid</span><span className="font-bold" style={{ color: brand }}>{formatCurrency(voucher.amount)}</span></div>
              </div>

              {/* How to connect */}
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-500 text-left space-y-2">
                <p className="font-semibold text-slate-300 flex items-center gap-2"><Wifi size={13} />How to connect:</p>
                <p>1. Go to <strong className="text-slate-300">WiFi Settings</strong> on your device</p>
                {tenant?.ssid && <p>2. Connect to network: <strong className="text-slate-300">{tenant.ssid}</strong></p>}
                <p>{tenant?.ssid ? '3.' : '2.'} Enter the code above as the <strong className="text-slate-300">password</strong></p>
                <p className="text-amber-400 flex items-start gap-1.5 pt-1 border-t border-slate-800">
                  <Shield size={11} className="flex-shrink-0 mt-0.5" />
                  This code works on <strong>one device only</strong>. Do not share it.
                </p>
              </div>

              <button onClick={reset} className="w-full py-3 rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-colors border border-slate-800 hover:border-slate-700">
                Buy Another Package
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 px-5 text-center border-t border-slate-800 space-y-1">
        {(tenant?.supportPhone || tenant?.supportEmail) && (
          <div className="text-xs text-slate-600">
            Support:
            {tenant.supportPhone && <a href={`tel:${tenant.supportPhone}`} className="ml-2 text-slate-500 hover:text-slate-300">{tenant.supportPhone}</a>}
            {tenant.supportEmail && <a href={`mailto:${tenant.supportEmail}`} className="ml-2 text-slate-500 hover:text-slate-300">{tenant.supportEmail}</a>}
          </div>
        )}
        <p className="text-xs text-slate-700">
          {tenant?.footerText || `Powered by Helvino Technologies · helvino.org · 0110421320`}
        </p>
      </footer>
    </div>
  );
}
