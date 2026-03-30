import clsx from 'clsx';

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'brand', trend }) {
  const colors = {
    brand: { bg: 'bg-brand-500/10', text: 'text-brand-400', border: 'border-brand-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  };
  const c = colors[color] || colors.brand;

  return (
    <div className="card-hover animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center border', c.bg, c.border)}>
          {Icon && <Icon size={20} className={c.text} />}
        </div>
        {trend !== undefined && (
          <span className={clsx('text-xs font-semibold', trend >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-100 mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-400">{title}</div>
      {subtitle && <div className="text-xs text-slate-600 mt-1">{subtitle}</div>}
    </div>
  );
}
