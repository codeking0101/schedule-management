export const STATUSES = [
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'review', label: 'In review' },
  { id: 'done', label: 'Done' },
];

export const PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' },
];

export const PRIORITY_LEVEL = { low: 1, medium: 2, high: 3, urgent: 4 };

const pad = (n) => String(n).padStart(2, '0');

// All dates in the UI are plain calendar days: 'YYYY-MM-DD'.
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const dayStr = (value) => (value ? String(value).slice(0, 10) : '');

export const fmtDate = (s) => {
  if (!s) return '';
  const [y, m, d] = s.split('-').map(Number);
  const sameYear = y === new Date().getFullYear();
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  });
};

export const isOverdue = (task) =>
  !!task.dueDate && task.status !== 'done' && dayStr(task.dueDate) < todayStr();

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => (w[0] || '').toUpperCase())
    .join('');
