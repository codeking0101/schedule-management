import { useState } from 'react';
import { api, setToken } from './api.js';

export default function Login({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api.post(mode === 'login' ? '/auth/login' : '/auth/register', form);
      setToken(data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === 'login';

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>Team Scheduler</h1>
        <p className="muted">
          {isLogin
            ? 'Sign in to see what your team is working on.'
            : 'Create your account. The first account on a new install becomes the admin.'}
        </p>

        {!isLogin && (
          <label className="field">
            <span>Full name</span>
            <input value={form.name} onChange={set('name')} required autoFocus />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={set('email')} required autoFocus={isLogin} />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={form.password} onChange={set('password')} required minLength={8} />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn primary" disabled={busy}>
          {isLogin ? 'Sign in' : 'Create account'}
        </button>
        <button
          type="button"
          className="link"
          onClick={() => {
            setMode(isLogin ? 'register' : 'login');
            setError('');
          }}
        >
          {isLogin ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
