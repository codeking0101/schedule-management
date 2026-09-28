import { useEffect } from 'react';
import { initials, PRIORITIES, PRIORITY_LEVEL } from './constants.js';

export function Avatar({ name, small }) {
  const size = small ? ' sm' : '';
  if (!name) {
    return (
      <span className={'avatar empty' + size} title="Unassigned">
        ?
      </span>
    );
  }
  return (
    <span className={'avatar' + size} title={name}>
      {initials(name)}
    </span>
  );
}

export function PriorityBars({ priority }) {
  const label = PRIORITIES.find((p) => p.id === priority)?.label || priority;
  return (
    <span className={`prio p${PRIORITY_LEVEL[priority] || 2}`} title={`${label} priority`} aria-label={`${label} priority`}>
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
