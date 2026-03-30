const { customAlphabet } = require('nanoid');

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

const generateVoucherCode = () => {
  const part1 = nanoid(4);
  const part2 = nanoid(4);
  return `${part1}-${part2}`;
};

const formatCurrency = (amount, currency = 'KES') => {
  return `${currency} ${parseFloat(amount).toFixed(2)}`;
};

const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes} Min${minutes !== 1 ? 's' : ''}`;
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return `${hours} Hour${hours !== 1 ? 's' : ''}`;
  }
  if (minutes < 10080) {
    const days = Math.floor(minutes / 1440);
    return `${days} Day${days !== 1 ? 's' : ''}`;
  }
  const weeks = Math.floor(minutes / 10080);
  if (weeks < 4) return `${weeks} Week${weeks !== 1 ? 's' : ''}`;
  const months = Math.floor(minutes / 43200);
  return `${months} Month${months !== 1 ? 's' : ''}`;
};

const paginate = (page = 1, limit = 20) => {
  const offset = (Math.max(1, page) - 1) * Math.min(100, limit);
  return { offset, limit: Math.min(100, limit) };
};

module.exports = { generateVoucherCode, formatCurrency, formatDuration, paginate };
