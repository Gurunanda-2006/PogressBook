export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (isoStr) => {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatDuration = (minutes) => {
  const m = Number(minutes);
  if (Number.isNaN(m) || m === 0) return '0m';
  const h = Math.floor(m / 60);
  const remM = Math.round(m % 60);
  if (h > 0) {
    if (remM > 0) return `${h}h ${remM}m`;
    return `${h}h`;
  }
  return `${remM}m`;
};

export const formatCurrency = (amount) => {
  const num = Number(amount);
  if (Number.isNaN(num)) return 'INR 0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(num);
};

export const getDayLabel = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

export const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().split('T')[0];
};

export const shiftDate = (dateStr, days) => {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date - offset).toISOString().split('T')[0];
};

export const getWeekDates = () => {
  const dates = [];
  const current = new Date();
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const firstDay = new Date(current.setDate(diff));

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + i);
    const offset = date.getTimezoneOffset() * 60000;
    dates.push(new Date(date - offset).toISOString().split('T')[0]);
  }

  return dates;
};

export const getMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstOffset = firstDay.getTimezoneOffset() * 60000;
  const lastOffset = lastDay.getTimezoneOffset() * 60000;

  return {
    from: new Date(firstDay - firstOffset).toISOString().split('T')[0],
    to: new Date(lastDay - lastOffset).toISOString().split('T')[0],
  };
};

export const getDateRange = (from, to) => {
  const dates = [];
  const current = new Date(`${from}T12:00:00`);
  const last = new Date(`${to}T12:00:00`);

  while (current <= last) {
    const offset = current.getTimezoneOffset() * 60000;
    dates.push(new Date(current - offset).toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};
