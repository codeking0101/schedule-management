import { Avatar } from './ui.jsx';

export default function Sidebar({ user, projects, activeId, onSelect, onNew, onTeam, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">Team Scheduler</div>

      <div className="side-head">
        <span>Projects</span>
        <button className="icon-btn light" onClick={onNew} title="New project" aria-label="New project">
          +
        </button>
      </div>

      <nav className="proj-list">
        {projects.map((p) => (
          <button
            key={p.id}
            className={'proj' + (p.id === activeId ? ' active' : '')}
            onClick={() => onSelect(p.id)}
          >
            <span className="proj-key">{p.key}</span>
            <span className="proj-name">{p.name}</span>
          </button>
        ))}
        {projects.length === 0 && <p className="side-empty">No projects yet. Create one to start planning.</p>}
      </nav>

      <div className="side-foot">
        <div className="me">
          <Avatar name={user.name} />
          <div>
            <div className="me-name">{user.name}</div>
            <div className="me-role">{user.role}</div>
          </div>
        </div>
        {user.role === 'admin' && (
          <button className="side-link" onClick={onTeam}>
            Manage team
          </button>
        )}
        <button className="side-link" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
