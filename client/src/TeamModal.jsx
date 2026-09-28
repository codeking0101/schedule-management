import { useState } from 'react';
import { api } from './api.js';
import { Modal } from './ui.jsx';

const EMPTY = { name: '', email: '', password: '', role: 'member' };

export default function TeamModal({ users, currentUser, onClose, onChanged }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function run(fn) {
    setError('');
    try {
      await fn();
      await onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post('/users', form);
      setForm(EMPTY);
    });
  };

  const setRole = (u, role) => run(() => api.patch(`/users/${u.id}`, { role }));

  const resetPassword = (u) => {
    const password = window.prompt(`New password for ${u.name} (at least 8 characters):`);
    if (!password) return;
    run(() => api.patch(`/users/${u.id}`, { password }));
  };

  return (
    <Modal title="Manage team" onClose={onClose} wide>
      <div className="modal-body">
        <table className="list compact">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.name}
                  {u.id === currentUser.id && <span className="muted"> (you)</span>}
                </td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => setRole(u, e.target.value)} aria-label={`Role for ${u.name}`}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <button className="link" onClick={() => resetPassword(u)}>
                    Reset password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="section-title">Add a teammate</h3>
        <form onSubmit={add} className="form-grid">
          <label className="field">
            <span>Full name</span>
            <input value={form.name} onChange={set('name')} required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={set('email')} required />
          </label>
          <label className="field">
            <span>Temporary password</span>
            <input type="password" value={form.password} onChange={set('password')} required minLength={8} />
          </label>
          <label className="field">
            <span>Role</span>
            <select value={form.role} onChange={set('role')}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div className="field full">
            <button className="btn primary">Add teammate</button>
          </div>
        </form>

        {error && <div className="error">{error}</div>}
      </div>
    </Modal>
  );
}
