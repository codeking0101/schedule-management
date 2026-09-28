import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import Login from './Login.jsx';
import Sidebar from './Sidebar.jsx';
import ProjectView from './ProjectView.jsx';
import ProjectModal from './ProjectModal.jsx';
import TeamModal from './TeamModal.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(!!getToken());
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeId, setActiveId] = useState(localStorage.getItem('ts_project'));
  const [projectModal, setProjectModal] = useState(null); // 'new' or a project
  const [teamOpen, setTeamOpen] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setProjects([]);
    setUsers([]);
  }, []);

  // Restore the session on page load
  useEffect(() => {
    if (!getToken()) return;
    api
      .get('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  // Sign out automatically when the server says the session is over
  useEffect(() => {
    window.addEventListener('ts-unauthorized', logout);
    return () => window.removeEventListener('ts-unauthorized', logout);
  }, [logout]);

  const loadAll = useCallback(async () => {
    const [p, u] = await Promise.all([api.get('/projects'), api.get('/users')]);
    setProjects(p);
    setUsers(u);
    setActiveId((cur) => (p.some((x) => x.id === cur) ? cur : p[0]?.id || null));
  }, []);

  useEffect(() => {
    if (user) loadAll().catch(console.error);
  }, [user, loadAll]);

  useEffect(() => {
    if (activeId) localStorage.setItem('ts_project', activeId);
  }, [activeId]);

  if (booting) return <div className="boot">Loading…</div>;
  if (!user) return <Login onAuth={setUser} />;

  const active = projects.find((p) => p.id === activeId) || null;

  const onSaved = (saved) => {
    setProjects((ps) => {
      const exists = ps.some((p) => p.id === saved.id);
      const next = exists ? ps.map((p) => (p.id === saved.id ? saved : p)) : [...ps, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setActiveId(saved.id);
  };

  const onDeleted = (id) => {
    const rest = projects.filter((p) => p.id !== id);
    setProjects(rest);
    setActiveId(rest[0]?.id || null);
  };

  return (
    <div className="app">
      <Sidebar
        user={user}
        projects={projects}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={() => setProjectModal('new')}
        onTeam={() => setTeamOpen(true)}
        onLogout={logout}
      />

      <main className="main">
        {active ? (
          <ProjectView
            key={active.id}
            project={active}
            currentUser={user}
            onEditProject={() => setProjectModal(active)}
          />
        ) : (
          <div className="empty-main">
            <h1>Plan your team’s work</h1>
            <p className="muted">Create a project to add tasks, assign people and schedule dates.</p>
            <button className="btn primary" onClick={() => setProjectModal('new')}>
              Create a project
            </button>
          </div>
        )}
      </main>

      {projectModal && (
        <ProjectModal
          project={projectModal === 'new' ? null : projectModal}
          users={users}
          currentUser={user}
          onClose={() => setProjectModal(null)}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
      {teamOpen && (
        <TeamModal
          users={users}
          currentUser={user}
          onClose={() => setTeamOpen(false)}
          onChanged={loadAll}
        />
      )}
    </div>
  );
}
