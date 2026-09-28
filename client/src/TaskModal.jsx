import { useState } from 'react';
import { Modal, Avatar } from './ui.jsx';
import { STATUSES, PRIORITIES, dayStr } from './constants.js';

export default function TaskModal({ task, defaults, project, onClose, onCreate, onSave, onDelete, onComment }) {
  const isNew = !task;

  const [form, setForm] = useState(() => ({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || defaults?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee: task ? task.assignee?.id || '' : '',
    startDate: task ? dayStr(task.startDate) : defaults?.startDate || '',
    dueDate: task ? dayStr(task.dueDate) : defaults?.dueDate || '',
    estimateHours: task?.estimateHours ?? '',
  }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState('');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (form.startDate && form.dueDate && form.startDate > form.dueDate) {
      setError('The start date must be on or before the due date.');
      return;
    }
    setBusy(true);
    setError('');
    const payload = {
      ...form,
      assignee: form.assignee || null,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
      estimateHours: form.estimateHours === '' ? null : Number(form.estimateHours),
    };
    try {
      if (isNew) await onCreate(payload);
      else await onSave(task.id, payload);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ${task.key}? This can't be undone.`)) return;
    try {
      await onDelete(task.id);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  async function postComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await onComment(task.id, comment.trim());
      setComment('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal title={isNew ? 'New task' : task.key} onClose={onClose} wide>
      <form onSubmit={submit} className="modal-body">
        <div className="form-grid">
          <label className="field full">
            <span>Title</span>
            <input value={form.title} onChange={set('title')} required maxLength={200} autoFocus />
          </label>

          <label className="field full">
            <span>Description</span>
            <textarea rows={4} value={form.description} onChange={set('description')} />
          </label>

          <label className="field">
            <span>Status</span>
            <select value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Priority</span>
            <select value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Assignee</span>
            <select value={form.assignee} onChange={set('assignee')}>
              <option value="">Unassigned</option>
              {project.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Estimate (hours)</span>
            <input type="number" min="0" step="0.5" value={form.estimateHours} onChange={set('estimateHours')} />
          </label>

          <label className="field">
            <span>Start date</span>
            <input type="date" value={form.startDate} onChange={set('startDate')} />
          </label>

          <label className="field">
            <span>Due date</span>
            <input type="date" value={form.dueDate} min={form.startDate || undefined} onChange={set('dueDate')} />
          </label>
        </div>

        {error && <div className="error">{error}</div>}

        <footer className="modal-foot">
          {!isNew && (
            <button type="button" className="btn danger" onClick={remove}>
              Delete task
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={busy}>
            {isNew ? 'Create task' : 'Save changes'}
          </button>
        </footer>
      </form>

      {!isNew && (
        <section className="comments">
          <h3>Comments</h3>
          {task.comments.length === 0 && <p className="muted">No comments yet.</p>}
          {task.comments.map((c) => (
            <div key={c.id} className="comment">
              <Avatar name={c.author?.name} small />
              <div>
                <div className="comment-head">
                  <strong>{c.author?.name || 'Former member'}</strong>
                  <span className="muted">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <div className="comment-text">{c.text}</div>
              </div>
            </div>
          ))}
          <form onSubmit={postComment} className="comment-form">
            <input
              placeholder="Add a comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={5000}
            />
            <button className="btn" disabled={!comment.trim()}>
              Post comment
            </button>
          </form>
        </section>
      )}
    </Modal>
  );
}
