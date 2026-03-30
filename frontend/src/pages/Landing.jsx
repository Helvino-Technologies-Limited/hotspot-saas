import { Link } from 'react-router-dom';
import { Wifi, Shield, CreditCard, Clock, BarChart3, Router, CheckCircle2, Phone, Mail, Globe, ArrowRight, Zap, Users, Lock } from 'lucide-react';

export default function Landing() {
  const features = [
    { icon: CreditCard, title: 'M-Pesa Payments', desc: 'STK Push, Paybill & Till. Real-time payment verification with automatic voucher generation.', color: 'emerald' },
    { icon: Ticket, title: 'Voucher System', desc: 'Auto-generated unique codes. Time-limited access with automatic disconnect on expiry.', color: 'brand' },
    { icon: Router, title: 'Router Integration', desc: 'MikroTik, Ubiquiti, TP-Link & Cisco. RADIUS-based access control with bandwidth shaping.', color: 'violet' },
    { icon: BarChart3, title: 'Analytics & Reports', desc: 'Revenue tracking, usage patterns, peak hours analysis and comprehensive reporting.', color: 'amber' },
    { icon: Shield, title: 'Multi-Tenant SaaS', desc: 'Fully isolated tenant environments. Each ISP gets their own branded portal and admin dashboard.', color: 'rose' },
    { icon: Zap, title: 'Captive Portal', desc: 'Beautiful, mobile-first landing page. Users connect, pay, and get internet in under 60 seconds.', color: 'brand' },
  ];

  const plans = [
    { name: 'Setup Fee', price: 'KES 70,000', period: 'one-time', features: ['Full system setup', 'Custom branding', 'Router configuration', '3 months support', 'Training included'], cta: 'Get Started' },
    { name: 'Annual', price: 'KES 50,000', period: 'per year', features: ['All features', 'Unlimited vouchers', 'Priority support', 'Regular updates', 'SLA guarantee'], cta: 'Subscribe', highlight: true },
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Wifi size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-100">HOTSPOT<span className="text-brand-400">SaaS</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-slate-100 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-100 transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-slate-100 transition-colors">Contact</a>
          </div>
          <Link to="/login" className="btn-primary py-2 px-4 text-sm">Admin Login</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8">
            <Wifi size={14} />
            WiFi Hotspot Billing & Voucher Management
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-100 mb-6 leading-tight tracking-tight">
            Monetize Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">WiFi Network</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Complete hotspot billing system with M-Pesa payments, auto-generated vouchers, and router integration.
            Built for Kenyan ISPs, hotels, schools, and estates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="btn-primary py-3 px-8 text-base">
              Access Dashboard <ArrowRight size={18} />
            </Link>
            <Link to="/portal/demo-isp" className="btn-secondary py-3 px-8 text-base">
              View Demo Portal
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-slate-500">
            {['M-Pesa First', 'MikroTik Ready', 'Multi-Tenant'].map(t => (
              <span key={t} className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" />{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-slate-800/50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { v: '60s', l: 'Avg. Connection Time' },
            { v: '99.9%', l: 'Uptime SLA' },
            { v: 'M-Pesa', l: 'Primary Payment' },
            { v: '∞', l: 'Vouchers / Month' },
          ].map(s => (
            <div key={s.l}>
              <div className="text-3xl font-extrabold text-brand-400 mb-1">{s.v}</div>
              <div className="text-sm text-slate-500">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-100 mb-4">Everything You Need</h2>
            <p className="text-slate-400 max-w-xl mx-auto">A complete WiFi monetization platform designed for the Kenyan market with M-Pesa at its core.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const C = { emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20', violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20', amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20', rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }[f.color];
              return (
                <div key={f.title} className="card-hover group">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${C}`}>
                    <f.icon size={20} />
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 border-y border-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-100 mb-4">How It Works</h2>
            <p className="text-slate-400">Three simple steps to internet access</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', t: 'Connect & Select', d: 'User connects to WiFi and is redirected to the captive portal. Selects a package.', icon: Wifi },
              { n: '02', t: 'Pay via M-Pesa', d: 'Customer pays using M-Pesa STK Push. Payment confirmed in real-time.', icon: CreditCard },
              { n: '03', t: 'Get Online', d: 'Voucher code generated instantly. Use as WiFi password and access the internet.', icon: Lock },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="w-14 h-14 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <s.icon size={24} className="text-brand-400" />
                </div>
                <div className="text-4xl font-black text-slate-800 mb-2">{s.n}</div>
                <h3 className="font-semibold text-slate-200 mb-2">{s.t}</h3>
                <p className="text-sm text-slate-500">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-100 mb-4">Simple Pricing</h2>
            <p className="text-slate-400">Rent the platform, keep all your WiFi revenue</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {plans.map(p => (
              <div key={p.name} className={`card relative ${p.highlight ? 'border-brand-500/40 glow' : ''}`}>
                {p.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-500 rounded-full text-xs font-bold text-white">Most Popular</div>}
                <div className="mb-6">
                  <div className="text-sm text-slate-500 font-medium mb-1">{p.name}</div>
                  <div className="text-3xl font-extrabold text-slate-100">{p.price}</div>
                  <div className="text-sm text-slate-500">{p.period}</div>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                      <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#contact" className={`w-full text-center block py-2.5 rounded-xl font-semibold transition-all ${p.highlight ? 'btn-primary justify-center' : 'btn-secondary justify-center'}`}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-6 border-t border-slate-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-100 mb-4">Get In Touch</h2>
          <p className="text-slate-400 mb-10">Contact Helvino Technologies for licensing and support</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Globe, label: 'Website', value: 'helvino.org', href: 'https://helvino.org' },
              { icon: Mail, label: 'Email', value: 'info@helvino.org', href: 'mailto:info@helvino.org' },
              { icon: Phone, label: 'Phone', value: '0110421320', href: 'tel:0110421320' },
            ].map(c => (
              <a key={c.label} href={c.href} className="card-hover text-center group">
                <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <c.icon size={18} className="text-brand-400" />
                </div>
                <div className="text-xs text-slate-500 mb-1">{c.label}</div>
                <div className="text-sm font-semibold text-slate-300 group-hover:text-brand-400 transition-colors">{c.value}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center">
            <Wifi size={12} className="text-white" />
          </div>
          <span className="font-bold text-slate-400">HOTSPOT<span className="text-brand-500">SaaS</span></span>
        </div>
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} Helvino Technologies · helvino.org · info@helvino.org · 0110421320
        </p>
      </footer>
    </div>
  );
}

// fix missing import
const Ticket = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
  </svg>
);
