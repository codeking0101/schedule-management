import { useMemo, useState } from 'react';
import { dayStr, todayStr } from './constants.js';

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_SLOTS = 4; // task rows shown per week; the rest collapse into "+N more"

// Weeks (Monday first) that cover the given month, each as 7 'YYYY-MM-DD' strings.
function buildWeeks(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  let cursor = new Date(year, month, 1 - offset);
  const weeks = [];
  do {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(ymd(cursor));
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    }
    weeks.push(days);
  } while (cursor.getMonth() === month);
  return weeks;
}

// Give every task that touches this week a fixed row, so multi-day bars stay level.
function layoutWeek(days, tasks) {
  const first = days[0];
  const last = days[6];
  const items = tasks
    .map((t) => ({ t, s: dayStr(t.startDate) || dayStr(t.dueDate), e: dayStr(t.dueDate) || dayStr(t.startDate) }))
    .filter((x) => x.s && x.e && x.s <= last && x.e >= first)
    .sort((a, b) => a.s.localeCompare(b.s) || b.e.localeCompare(a.e) || a.t.number - b.t.number);

  const rows = []; // rows[slot] = which of the 7 columns are already taken
  const placed = [];
  const hidden = Array(7).fill(0);

  for (const it of items) {
    const cs = it.s < first ? 0 : days.indexOf(it.s);
    const ce = it.e > last ? 6 : days.indexOf(it.e);
    let slot = 0;
    while (rows[slot] && rows[slot].slice(cs, ce + 1).some(Boolean)) slot++;
    if (!rows[slot]) rows[slot] = Array(7).fill(false);
    for (let c = cs; c <= ce; c++) rows[slot][c] = true;

    if (slot >= MAX_SLOTS) {
      for (let c = cs; c <= ce; c++) hidden[c]++;
    } else {
      placed.push({ t: it.t, cs, ce, slot, prev: it.s < first, next: it.e > last });
    }
  }
  return { placed, hidden };
}

function Week({ days, tasks, month, today, onOpen, onAdd }) {
  const { placed, hidden } = useMemo(() => layoutWeek(days, tasks), [days, tasks]);

  return (
    <div className="week">
      {days.map((d, i) => {
        const inMonth = Number(d.slice(5, 7)) - 1 === month;
        return (
          <div
            key={d}
            className={'day' + (inMonth ? '' : ' out') + (d === today ? ' today' : '')}
            style={{ gridColumn: i + 1, gridRow: '1 / span 6' }}
            onClick={() => onAdd(d)}
            title="Add a task on this day"
          >
            <span className="day-num">{Number(d.slice(8))}</span>
          </div>
        );
      })}

      {placed.map((p) => (
        <button
          key={p.t.id}
          className={'bar st-' + p.t.status + (p.prev ? ' prev' : '') + (p.next ? ' next' : '')}
          style={{ gridColumn: `${p.cs + 1} / ${p.ce + 2}`, gridRow: p.slot + 2 }}
          onClick={() => onOpen(p.t.id)}
          title={`${p.t.key}: ${p.t.title}`}
        >
          <span className="tkey">{p.t.key}</span> {p.t.title}
        </button>
      ))}

      {hidden.map(
        (n, i) =>
          n > 0 && (
            <span key={i} className="more" style={{ gridColumn: i + 1, gridRow: 6 }}>
              +{n} more
            </span>
          )
      )}
    </div>
  );
}

export default function CalendarView({ tasks, onOpen, onAdd }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const weeks = useMemo(() => buildWeeks(cursor.y, cursor.m), [cursor]);
  const today = todayStr();

  const shift = (delta) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };
  const title = new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const unscheduled = tasks.filter((t) => !t.startDate && !t.dueDate && t.status !== 'done');

  return (
    <div className="cal">
      <div className="cal-bar">
        <h2>{title}</h2>
        <div className="cal-nav">
          <button className="btn" onClick={() => shift(-1)} aria-label="Previous month">
            ‹
          </button>
          <button className="btn" onClick={() => setCursor({ y: now.getFullYear(), m: now.getMonth() })}>
            Today
          </button>
          <button className="btn" onClick={() => shift(1)} aria-label="Next month">
            ›
          </button>
        </div>
      </div>

      <div className="cal-grid">
        <div className="cal-weekdays">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        {weeks.map((days) => (
          <Week key={days[0]} days={days} tasks={tasks} month={cursor.m} today={today} onOpen={onOpen} onAdd={onAdd} />
        ))}
      </div>

      {unscheduled.length > 0 && (
        <div className="unsched">
          <h3>Not scheduled yet</h3>
          <div className="unsched-list">
            {unscheduled.map((t) => (
              <button key={t.id} className="chip-plain" onClick={() => onOpen(t.id)}>
                <span className="tkey">{t.key}</span> {t.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
