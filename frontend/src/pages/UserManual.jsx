import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  BookOpen, Wifi, CreditCard, Ticket, Router, Settings, Users,
  ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Globe, Phone, Mail, Zap
} from 'lucide-react';

const sections = [
  {
    id: 'overview',
    icon: BookOpen,
    title: 'System Overview',
    content: [
      {
        heading: 'What is HOTSPOT-SaaS?',
        text: `HOTSPOT-SaaS is a multi-tenant WiFi hotspot billing system developed by Helvino Technologies.
It allows Internet Service Providers (ISPs), hotels, schools, shops, and estates to monetize their WiFi
networks using a voucher-based system with M-Pesa payments.`,
      },
      {
        heading: 'How the system works',
        steps: [
          'Customer connects to your WiFi network',
          'They are redirected to your captive portal (buy page)',
          'They select a package and pay via M-Pesa',
          'A unique voucher code is generated and displayed',
          'They enter the voucher code as their WiFi password',
          'Internet access is granted for the purchased duration',
          'When time expires, the code is automatically deactivated and they are disconnected',
        ],
      },
    ],
  },
  {
    id: 'superadmin',
    icon: Users,
    title: 'Super Admin Guide',
    content: [
      {
        heading: 'Logging in as Super Admin',
        steps: [
          'Go to your admin portal URL and click "Admin Login"',
          'Use email: helvinotechltd@gmail.com and your super admin password',
          'You will land on the Super Admin Dashboard',
        ],
      },
      {
        heading: 'Creating a new Tenant (ISP Provider)',
        steps: [
          'Go to Tenants → click "New Tenant"',
          'Fill in: Company Name, Email, Phone, Brand Color',
          'Create an Admin account for the tenant: Admin Name, Email, Password',
          'Click "Create Tenant" — default packages are created automatically',
          'The tenant can now log in and configure their system',
        ],
      },
      {
        heading: 'Managing Tenants',
        steps: [
          'View all tenants on the Tenants page with their stats',
          'Click "Access" to impersonate a tenant and manage their system on their behalf',
          'Click "Disable/Enable" to activate or deactivate a tenant',
          'Disabled tenants cannot process payments or generate vouchers',
        ],
      },
    ],
  },
  {
    id: 'packages',
    icon: Ticket,
    title: 'Managing WiFi Packages',
    content: [
      {
        heading: 'Creating packages',
        steps: [
          'Go to Packages → click "New Package"',
          'Set the Package Name (e.g. "1 Hour", "Daily", "Weekly")',
          'Set the Price in KES',
          'Set Duration in minutes (60 = 1 hour, 1440 = 24 hours, 10080 = 1 week)',
          'Set Speed Limit in Mbps (optional — enforced by router)',
          'Set Device Limit (1–5 devices sharing one voucher)',
          'Click Save — the package appears on your captive portal immediately',
        ],
      },
      {
        heading: 'Package examples',
        table: {
          headers: ['Name', 'Price', 'Duration', 'Speed'],
          rows: [
            ['30 Minutes', 'KES 5', '30 min', '2 Mbps'],
            ['1 Hour', 'KES 10', '60 min', '5 Mbps'],
            ['2 Hours', 'KES 20', '120 min', '5 Mbps'],
            ['Daily', 'KES 50', '24 hours', '10 Mbps'],
            ['Weekly', 'KES 250', '7 days', '10 Mbps'],
            ['Monthly', 'KES 800', '30 days', '20 Mbps'],
          ],
        },
      },
    ],
  },
  {
    id: 'payments',
    icon: CreditCard,
    title: 'Payment Setup (M-Pesa)',
    content: [
      {
        heading: 'Setting up M-Pesa STK Push',
        steps: [
          'Go to Settings → M-Pesa tab',
          'Visit developer.safaricom.co.ke and create an account',
          'Create an app and copy your Consumer Key and Consumer Secret',
          'Get your Business Shortcode from the Safaricom portal',
          'Get your Lipa Na M-Pesa Passkey from the portal',
          'Set Environment to "Production" for live payments',
          'Set Callback URL to: https://your-backend.onrender.com/api/payments/mpesa/callback',
          'Click "Save M-Pesa Settings"',
        ],
      },
      {
        heading: 'How payments flow',
        steps: [
          'Customer selects a package on the captive portal',
          'Enters their phone number (07XX XXX XXX)',
          'Clicks Pay — an M-Pesa STK Push prompt appears on their phone',
          'Customer enters their M-Pesa PIN and confirms',
          'Payment is verified in real-time by the callback',
          'Voucher code is generated and displayed to the customer',
          'Customer uses the code as their WiFi password',
        ],
      },
      {
        heading: 'Other payment methods',
        text: 'Go to Settings → Other Payments to configure M-Pesa Paybill, Buy Goods (Till), Airtel Money, or Bank Transfer. These are shown to customers as manual payment options with instructions.',
      },
    ],
  },
  {
    id: 'routers',
    icon: Router,
    title: 'Router Integration',
    content: [
      {
        heading: 'How router integration works',
        text: `The system integrates with your router in two ways:
1. RADIUS authentication — voucher codes act as usernames/passwords verified against a FreeRADIUS server
2. MikroTik REST API — the system directly controls MikroTik hotspot sessions via the router's API`,
      },
      {
        heading: 'Adding a router',
        steps: [
          'Go to Routers → click "Add Router"',
          'Enter a Name, IP Address, and Type (MikroTik, Ubiquiti, etc.)',
          'For RADIUS: enter the RADIUS Port (default 1812), NAS Identifier, and RADIUS Secret',
          'For MikroTik REST API: enable "Use MikroTik API", enter API Username and Password',
          'Click "Test Connection" to verify connectivity (MikroTik API mode only)',
        ],
      },
      {
        heading: 'MikroTik setup (RADIUS mode)',
        steps: [
          'On MikroTik: go to Radius → Add New',
          'Set Address to your FreeRADIUS server IP',
          'Set Secret to your RADIUS secret (same as entered in the system)',
          'Go to IP → Hotspot → Server Profiles → set RADIUS as authentication',
          'Voucher codes become the Username AND Password for hotspot login',
          'Session timeout is automatically enforced by RADIUS attributes',
        ],
      },
      {
        heading: 'MikroTik setup (API mode — RouterOS 7+)',
        steps: [
          'On MikroTik: go to IP → Services → Enable www (HTTP) on port 80',
          'Or enable www-ssl (HTTPS) on port 443',
          'Create a dedicated API user: System → Users → Add',
          'Give the user "read" and "write" permissions',
          'Enter the router IP, API username, and password in the system',
          'Enable "Use MikroTik API" toggle',
          'Click "Test Connection" — you should see "Connected: [router name]"',
          'The system will now automatically disconnect users when vouchers expire',
        ],
      },
      {
        heading: 'Ubiquiti UniFi setup',
        steps: [
          'In UniFi Controller: Settings → Networks → Guest Hotspot',
          'Enable "Use RADIUS server" and point to your FreeRADIUS server',
          'Set RADIUS secret to match what you entered in the system',
          'Voucher codes are used as credentials for guest network access',
        ],
      },
      {
        heading: 'Configuring captive portal redirect',
        steps: [
          'The captive portal URL is: https://your-frontend.vercel.app/portal/your-slug',
          'Find this URL in Settings → Portal tab',
          'In MikroTik: IP → Hotspot → Server Profiles → Login Page → set to the portal URL',
          'When a user connects and opens a browser, they are redirected to this page',
        ],
      },
    ],
  },
  {
    id: 'vouchers',
    icon: Ticket,
    title: 'Voucher Management',
    content: [
      {
        heading: 'Voucher lifecycle',
        steps: [
          'UNUSED: Generated after payment, waiting to be redeemed',
          'ACTIVE: Customer has used the code — internet session running',
          'EXPIRED: Time is up — customer is automatically disconnected',
          'REVOKED: Admin manually cancelled the voucher',
        ],
      },
      {
        heading: 'Generating vouchers manually',
        steps: [
          'Go to Vouchers → click "Generate Vouchers"',
          'Select a package and choose how many (1–100)',
          'Vouchers are created in "Unused" state',
          'Distribute them to customers (print, SMS, or share the code)',
          'Customer enters the code on the captive portal or directly as WiFi password',
        ],
      },
      {
        heading: 'Monitoring vouchers',
        steps: [
          'View all vouchers with their status on the Vouchers page',
          'Filter by status: Unused, Active, Expired, Revoked',
          'See which IP and MAC address is using each voucher',
          'Revoke a voucher early by clicking the revoke button',
        ],
      },
    ],
  },
  {
    id: 'portal',
    icon: Wifi,
    title: 'Captive Portal',
    content: [
      {
        heading: 'What customers see',
        steps: [
          'Customer connects to your WiFi SSID',
          'Browser shows your branded captive portal automatically',
          'Portal displays your logo, colors, and available packages',
          'Customer selects a package, enters phone, pays via M-Pesa',
          'Voucher code is displayed — they copy it and enter as WiFi password',
          'They are online for the purchased duration',
        ],
      },
      {
        heading: 'Customizing the portal',
        steps: [
          'Go to Settings → Branding: set your logo, company name, and colors',
          'Go to Settings → Portal: set welcome message, SSID name, support contact',
          'Changes appear on the portal immediately',
          'Each tenant has their own unique portal URL: /portal/your-slug',
        ],
      },
    ],
  },
  {
    id: 'sessions',
    icon: Zap,
    title: 'Sessions & Monitoring',
    content: [
      {
        heading: 'Monitoring active users',
        steps: [
          'Go to Sessions to see all currently connected users',
          'Each session shows: Voucher code, MAC address, IP, start time, data used',
          'Click "Terminate" to forcefully disconnect a user',
          'Sessions are automatically closed when their voucher expires',
        ],
      },
      {
        heading: 'Dashboard stats',
        steps: [
          'Revenue Today / This Week / This Month',
          'Active sessions right now',
          'Vouchers sold today',
          '14-day revenue chart',
          'Top selling packages',
          'Recent payment history',
        ],
      },
    ],
  },
  {
    id: 'troubleshooting',
    icon: AlertCircle,
    title: 'Troubleshooting',
    content: [
      {
        heading: 'Customer not redirected to portal',
        steps: [
          'Ensure the router\'s captive portal/hotspot redirect is pointed to your portal URL',
          'The URL must be: https://your-frontend.vercel.app/portal/your-slug',
          'Check that the customer\'s device has no cached WiFi credentials',
          'Try opening http://neverssl.com to force the redirect',
        ],
      },
      {
        heading: 'M-Pesa payment not completing',
        steps: [
          'Verify your Consumer Key, Secret, Shortcode and Passkey are correct',
          'Ensure Callback URL is correct and your backend is publicly accessible',
          'Check payments page — pending payments expire after 30 minutes',
          'In sandbox mode, payments auto-complete in 3 seconds (for testing)',
        ],
      },
      {
        heading: 'Router not disconnecting expired users',
        steps: [
          'For RADIUS mode: ensure FreeRADIUS is running and Session-Timeout attribute is set',
          'For MikroTik API mode: ensure "Use MikroTik API" is enabled and credentials are correct',
          'Test the connection using the "Test Connection" button on the Routers page',
          'Check that RouterOS REST API is enabled (IP → Services → www)',
        ],
      },
      {
        heading: 'Login returns 500 error',
        steps: [
          'The database migration may not have run — contact Helvino Technologies support',
          'Verify your backend is running at the correct URL',
          'Check that environment variables are correctly set on Render',
        ],
      },
    ],
  },
];

const Section = ({ s }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="card-hover">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between p-0 text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
            <s.icon size={17} className="text-brand-400" />
          </div>
          <span className="font-semibold text-slate-100">{s.title}</span>
        </div>
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
      </button>

      {open && (
        <div className="mt-5 space-y-6 border-t border-slate-800 pt-5">
          {s.content.map((block, i) => (
            <div key={i}>
              <h3 className="font-semibold text-slate-200 mb-3">{block.heading}</h3>
              {block.text && <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{block.text}</p>}
              {block.steps && (
                <ol className="space-y-2">
                  {block.steps.map((step, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-slate-400">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold flex items-center justify-center mt-0.5">{j + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
              {block.table && (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        {block.table.headers.map(h => <th key={h} className="table-header text-left px-4 py-2">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {block.table.rows.map((row, ri) => (
                        <tr key={ri} className="table-row">
                          {row.map((cell, ci) => <td key={ci} className="table-cell">{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function UserManual() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center">
            <BookOpen size={20} className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">User Manual</h1>
            <p className="text-slate-500 text-sm">Complete guide to using HOTSPOT-SaaS</p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-400 mt-4">
          <CheckCircle2 size={12} className="inline mr-2 text-emerald-400" />
          Click any section below to expand it and read the guide.
        </div>
      </div>

      <div className="space-y-3">
        {sections.map(s => <Section key={s.id} s={s} />)}
      </div>

      {/* Support footer */}
      <div className="card text-sm text-slate-500 space-y-3">
        <div className="font-semibold text-slate-300">Need more help?</div>
        <p>Contact Helvino Technologies — the developers and maintainers of this system.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: Globe, label: 'helvino.org', href: 'https://helvino.org' },
            { icon: Mail, label: 'info@helvino.org', href: 'mailto:info@helvino.org' },
            { icon: Phone, label: '0110421320', href: 'tel:0110421320' },
          ].map(c => (
            <a key={c.label} href={c.href} className="flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors">
              <c.icon size={14} />{c.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
