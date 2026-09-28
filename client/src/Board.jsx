import { useState } from 'react';
import { STATUSES, PRIORITY_LEVEL, dayStr, fmtDate, isOverdue } from './constants.js';
import { Avatar, PriorityBars } from './ui.jsx';

const byPriorityThenNumber = (a, b) =>
  (PRIORITY_LEVEL[b.priority] || 0) - (PRIORITY_LEVEL[a.priority] || 0) || a.number - b.number;

export default function Board({ tasks, onOpen, onMove, onAdd }) {
  const [overColumn, setOverColumn] = useState(null);

  return (
    <div className="board">
      {STATUSES.map((s) => {
        const column = tasks.filter((t) => t.status === s.id).sort(byPriorityThenNumber);
        return (
          <section
            key={s.id}
            className={'col' + (overColumn === s.id ? ' over' : '')}
            onDragOver={(e) => {
              e.preventDefault();
              setOverColumn(s.id);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setOverColumn(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setOverColumn(null);
              const id = e.dataTransfer.getData('text/plain');
              const task = tasks.find((t) => t.id === id);
              if (task && task.status !== s.id) onMove(id, s.id);
            }}
          >
            <header className={'col-head st-' + s.id}>
              <span className="dot" />
              {s.label}
              <span className="count">{column.length}</span>
            </header>

            <div className="cards">
              {column.map((t) => (
                <article
                  key={t.id}
                  className="card"
                  draggable
                  tabIndex={0}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', t.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => onOpen(t.id)}
                  onKeyDown={(e) => e.key === 'Enter' && onOpen(t.id)}
                >
                  <div className="card-title">{t.title}</div>
                  <div className="card-meta">
                    <span className="tkey">{t.key}</span>
                    <PriorityBars priority={t.priority} />
                    {t.dueDate && (
                      <span className={'due' + (isOverdue(t) ? ' late' : '')}>
                        {isOverdue(t) ? 'Overdue ' : 'Due '}
                        {fmtDate(dayStr(t.dueDate))}
                      </span>
                    )}
                    <span className="spacer" />
                    <Avatar name={t.assignee?.name} small />
                  </div>
                </article>
              ))}
            </div>

            <button className="add-inline" onClick={() => onAdd(s.id)}>
              Add task
            </button>
          </section>
        );
      })}
    </div>
  );
}
