import { useMemo, useState } from 'react';
import { STATUSES, PRIORITIES, dayStr, fmtDate, isOverdue } from './constants.js';
import { Avatar, PriorityBars } from './ui.jsx';

const SORTERS = {
  key: (t) => t.number,
  title: (t) => t.title.toLowerCase(),
  status: (t) => STATUSES.findIndex((s) => s.id === t.status),
  priority: (t) => -PRIORITIES.findIndex((p) => p.id === t.priority), // urgent first
  assignee: (t) => (t.assignee?.name || '\uffff').toLowerCase(),
  start: (t) => dayStr(t.startDate) || '9999',
  due: (t) => dayStr(t.dueDate) || '9999',
};

const COLUMNS = [
  ['key', 'Key'],
  ['title', 'Title'],
  ['status', 'Status'],
  ['priority', 'Priority'],
  ['assignee', 'Assignee'],
  ['start', 'Start'],
  ['due', 'Due'],
];

export default function ListView({ tasks, onOpen, onMove }) {
  const [sort, setSort] = useState({ by: 'due', dir: 1 });

  const rows = useMemo(() => {
    const val = SORTERS[sort.by];
    return [...tasks].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [tasks, sort]);

  const toggle = (by) => setSort((s) => (s.by === by ? { by, dir: -s.dir } : { by, dir: 1 }));

  return (
    <div className="table-wrap">
      <table className="list">
        <thead>
          <tr>
            {COLUMNS.map(([id, label]) => (
              <th key={id} aria-sort={sort.by === id ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                <button onClick={() => toggle(id)}>
                  {label}
                  {sort.by === id && <span aria-hidden="true">{sort.dir === 1 ? ' ↑' : ' ↓'}</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} onClick={() => onOpen(t.id)}>
              <td className="tkey">{t.key}</td>
              <td className="title-cell">{t.title}</td>
              <td onClick={(e) => e.stopPropagation()}>
                <select
                  className={'status-select st-' + t.status}
                  value={t.status}
                  onChange={(e) => onMove(t.id, e.target.value)}
                  aria-label={`Status of ${t.key}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <span className="prio-cell">
                  <PriorityBars priority={t.priority} />
                  {PRIORITIES.find((p) => p.id === t.priority)?.label}
                </span>
              </td>
              <td>
                <span className="who">
                  <Avatar name={t.assignee?.name} small />
                  {t.assignee?.name || <span className="muted">Unassigned</span>}
                </span>
              </td>
              <td>{fmtDate(dayStr(t.startDate)) || <span className="muted">—</span>}</td>
              <td className={isOverdue(t) ? 'late' : ''}>{fmtDate(dayStr(t.dueDate)) || <span className="muted">—</span>}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="muted pad">
                No tasks match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
