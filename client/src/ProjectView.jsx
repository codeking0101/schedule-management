import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import Board from './Board.jsx';
import ListView from './ListView.jsx';
import CalendarView from './CalendarView.jsx';
import TaskModal from './TaskModal.jsx';
import { Avatar } from './ui.jsx';

const VIEWS = [
  ['board', 'Board'],
  ['list', 'List'],
  ['calendar', 'Calendar'],
];

export default function ProjectView({ project, currentUser, onEditProject }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState(localStorage.getItem('ts_view') || 'board');
  const [q, setQ] = useState('');
  const [assignee, setAssignee] = useState('all');
  const [hideDone, setHideDone] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null); // defaults for a task being created

  useEffect(() => {
    localStorage.setItem('ts_view', view);
  }, [view]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    api
      .get(`/tasks?project=${project.id}`)
      .then((t) => live && setTasks(t))
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [project.id]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tasks.filter((t) => {
      if (hideDone && t.status === 'done') return false;
      if (assignee === 'me' && t.assignee?.id !== currentUser.id) return false;
      if (assignee === 'none' && t.assignee) return false;
      if (!['all', 'me', 'none'].includes(assignee) && t.assignee?.id !== assignee) return false;
      if (needle && !`${t.key} ${t.title}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [tasks, q, assignee, hideDone, currentUser.id]);

  // These throw on failure so the task dialog can show the message next to the form.
  const createTask = async (data) => {
    const t = await api.post('/tasks', { ...data, project: project.id });
    setTasks((ts) => [...ts, t]);
  };
  const saveTask = async (id, data) => {
    const t = await api.patch(`/tasks/${id}`, data);
    setTasks((ts) => ts.map((x) => (x.id === id ? t : x)));
  };
  const removeTask = async (id) => {
    await api.del(`/tasks/${id}`);
    setTasks((ts) => ts.filter((x) => x.id !== id));
  };
  const addComment = async (id, text) => {
    const t = await api.post(`/tasks/${id}/comments`, { text });
    setTasks((ts) => ts.map((x) => (x.id === id ? t : x)));
  };

  // Drag and drop / status dropdown: update instantly, roll back if the server refuses.
  const moveTask = async (id, status) => {
    const previous = tasks;
    setError('');
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      const updated = await api.patch(`/tasks/${id}`, { status });
      setTasks((ts) => ts.map((x) => (x.id === id ? updated : x)));
    } catch (e) {
      setTasks(previous);
      setError(e.message);
    }
  };

  const selected = tasks.find((t) => t.id === selectedId) || null;
  const closeModal = () => {
    setSelectedId(null);
    setDraft(null);
  };

  return (
    <div className="pv">
      <header className="pv-head">
        <div>
          <h1>
            {project.name} <span className="key-tag">{project.key}</span>
          </h1>
          {project.description && <p className="muted">{project.description}</p>}
        </div>
        <div className="pv-actions">
          <div className="avatars">
            {project.members.map((m) => (
              <Avatar key={m.id} name={m.name} small />
            ))}
          </div>
          <button className="btn" onClick={onEditProject}>
            Project settings
          </button>
          <button className="btn primary" onClick={() => setDraft({})}>
            New task
          </button>
        </div>
      </header>

      <div className="toolbar">
        <div className="tabs" role="tablist">
          {VIEWS.map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              className={'tab' + (view === id ? ' on' : '')}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          className="search"
          type="search"
          placeholder="Search tasks"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Filter by assignee">
          <option value="all">Everyone</option>
          <option value="me">Assigned to me</option>
          <option value="none">Unassigned</option>
          {project.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
          Hide done
        </label>
      </div>

      {error && (
        <div className="banner" role="alert" onClick={() => setError('')}>
          {error} <span className="muted">(click to dismiss)</span>
        </div>
      )}

      <div className="pv-body">
        {loading ? (
          <p className="muted pad">Loading tasks…</p>
        ) : (
          <>
            {tasks.length === 0 && (
              <p className="muted pad">No tasks yet. Use “New task” to add the first one.</p>
            )}
            {view === 'board' && (
              <Board tasks={visible} onOpen={setSelectedId} onMove={moveTask} onAdd={(status) => setDraft({ status })} />
            )}
            {view === 'list' && <ListView tasks={visible} onOpen={setSelectedId} onMove={moveTask} />}
            {view === 'calendar' && (
              <CalendarView
                tasks={visible}
                onOpen={setSelectedId}
                onAdd={(date) => setDraft({ startDate: date, dueDate: date })}
              />
            )}
          </>
        )}
      </div>

      {(draft || selected) && (
        <TaskModal
          key={selected?.id || 'new'}
          task={selected}
          defaults={draft}
          project={project}
          onClose={closeModal}
          onCreate={createTask}
          onSave={saveTask}
          onDelete={removeTask}
          onComment={addComment}
        />
      )}
    </div>
  );
}
