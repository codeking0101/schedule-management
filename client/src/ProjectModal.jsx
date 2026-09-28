import { useState } from 'react';
import { api } from './api.js';
import { Modal } from './ui.jsx';

// "Website Redesign" -> WR, "Website" -> WEB
function suggestKey(name) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const key = words.length > 1 ? words.map((w) => w[0]).join('') : words[0].slice(0, 3);
  return key.toUpperCase().slice(0, 5);
}

export default function ProjectModal({ project, users, currentUser, onClose, onSaved, onDeleted }) {
  const isNew = !project;
  const ownerId = project?.owner?.id || currentUser.id;
  const canManage = isNew || currentUser.role === 'admin' || ownerId === currentUser.id;

  const [name, setName] = useState(project?.name || '');
  const [key, setKey] = useState(project?.key || '');
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState(project?.description || '');
  const [members, setMembers] = useState(
    () => new Set(project ? project.members.map((m) => m.id) : [currentUser.id])
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const toggleMember = (id) => {
    const next = new Set(members);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setMembers(next);
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { name, description, members: [...members] };
      const saved = isNew
        ? await api.post('/projects', { ...payload, key })
        : await api.patch(`/projects/${project.id}`, payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function remove() {
    const ok = window.confirm(`Delete project ${project.key} and all of its tasks? This can't be undone.`);
    if (!ok) return;
    try {
      await api.del(`/projects/${project.id}`);
      onDeleted(project.id);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal title={isNew ? 'New project' : 'Project settings'} onClose={onClose}>
      <form onSubmit={submit} className="modal-body">
        {!canManage && (
          <p className="muted">Only the project owner or an admin can change these settings.</p>
        )}
        <fieldset disabled={!canManage || busy} className="plain">
          <label className="field">
            <span>Name</span>
            <input
              value={name}
              required
              maxLength={100}
              autoFocus
              onChange={(e) => {
                setName(e.target.value);
                if (isNew && !keyTouched) setKey(suggestKey(e.target.value));
              }}
            />
          </label>

          <label className="field">
            <span>Key (used in task IDs like {key || 'WEB'}-12)</span>
            <input
              value={key}
              required
              disabled={!isNew}
              maxLength={10}
              pattern="[A-Za-z][A-Za-z0-9]{1,9}"
              title="2-10 letters or digits, starting with a letter"
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value.toUpperCase());
              }}
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          <div className="field">
            <span>Members</span>
            <div className="member-list">
              {users.map((u) => (
                <label key={u.id} className="member">
                  <input
                    type="checkbox"
                    checked={members.has(u.id) || u.id === ownerId}
                    disabled={u.id === ownerId}
                    onChange={() => toggleMember(u.id)}
                  />
                  {u.name}
                  <span className="muted">{u.email}</span>
                </label>
              ))}
            </div>
          </div>
        </fieldset>

        {error && <div className="error">{error}</div>}

        <footer className="modal-foot">
          {!isNew && canManage && (
            <button type="button" className="btn danger" onClick={remove}>
              Delete project
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            {canManage ? 'Cancel' : 'Close'}
          </button>
          {canManage && (
            <button className="btn primary" disabled={busy}>
              {isNew ? 'Create project' : 'Save changes'}
            </button>
          )}
        </footer>
      </form>
    </Modal>
  );
}
