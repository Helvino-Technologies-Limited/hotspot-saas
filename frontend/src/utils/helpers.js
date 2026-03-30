import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatCurrency = (amount, currency = 'KES') =>
  `${currency} ${parseFloat(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDuration = (minutes) => {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} Min${minutes !== 1 ? 's' : ''}`;
  if (minutes < 1440) { const h = Math.floor(minutes/60); return `${h} Hour${h !== 1 ? 's' : ''}`; }
  if (minutes < 10080) { const d = Math.floor(minutes/1440); return `${d} Day${d !== 1 ? 's' : ''}`; }
  if (minutes < 43200) { const w = Math.floor(minutes/10080); return `${w} Week${w !== 1 ? 's' : ''}`; }
  const m = Math.floor(minutes/43200); return `${m} Month${m !== 1 ? 's' : ''}`;
};

export const formatDate = (date) => {
  if (!date) return '—';
  try { return format(typeof date === 'string' ? parseISO(date) : date, 'dd MMM yyyy, HH:mm'); }
  catch { return '—'; }
};

export const formatRelative = (date) => {
  if (!date) return '—';
  try { return formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, { addSuffix: true }); }
  catch { return '—'; }
};

export const formatShortDate = (date) => {
  if (!date) return '—';
  try { return format(typeof date === 'string' ? parseISO(date) : date, 'dd MMM'); }
  catch { return '—'; }
};

export const statusColor = (status) => {
  const map = {
    active: 'badge-success', unused: 'badge-info', expired: 'badge-warning',
    revoked: 'badge-danger', pending: 'badge-warning', completed: 'badge-success',
    failed: 'badge-danger', inactive: 'badge-gray', suspended: 'badge-danger',
    trial: 'badge-warning', terminated: 'badge-danger',
  };
  return map[status] || 'badge-gray';
};

export const truncate = (str, n = 30) => str?.length > n ? str.slice(0, n) + '...' : str;

export const copyToClipboard = async (text) => {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
};
