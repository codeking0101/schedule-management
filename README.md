# Team Scheduler

A small Jira-style task and schedule manager for a team on an intranet.
Node.js + Express + MongoDB on the back end, React (Vite) on the front end.

**Features**
- Sign in with email and password. The first account created becomes the admin.
- Projects with members and task keys (WEB-1, WEB-2, ...).
- Tasks with status, priority, assignee, start and due dates, estimate and comments.
- Three views of the same tasks: Board (drag between columns), List (sortable) and Calendar (multi-day bars by month).
- Filters: search, assignee, hide done.
- Admin screen to add teammates, change roles and reset passwords.

## What you need
- Node.js 18 or newer
- MongoDB 6 or newer (installed, or run with the included `docker-compose.yml`)

## Run it

```bash
# 1. Start MongoDB (skip if you already have one running)
docker compose up -d

# 2. Install everything
npm run setup

# 3. Configure the server
cp server/.env.example server/.env
#    then edit server/.env and set JWT_SECRET to a long random string

# 4. Build the React app and start the server
npm run build
npm start
```

Open `http://<server-address>:4000` from any computer on your network.
Register the first account: it becomes the admin. Then either let teammates sign up
themselves, or set `ALLOW_REGISTRATION=false` in `server/.env`, restart, and add people from
**Manage team**.

### Development mode (auto reload)
Run these in two terminals, then open http://localhost:5173:
```bash
npm run dev:server
npm run dev:client
```

## Keep it running
On the server machine, `npm install -g pm2`, then from the `server` folder:
`pm2 start src/index.js --name team-scheduler` and `pm2 save`.

## Backups
```bash
mongodump --db team_scheduler --out ./backup-$(date +%F)
```

## Security notes for an intranet
- Set a strong `JWT_SECRET`. Sessions last 7 days.
- Traffic is plain HTTP by default. If the network is shared or untrusted, put the app behind a reverse proxy
  (nginx, Caddy) with HTTPS.
- MongoDB in `docker-compose.yml` only listens on localhost. Keep it that way.

## Project layout
```
server/src/
  index.js            Express app, serves the built client
  models/             User, Project, Task (Mongoose)
  routes/             auth, users, projects, tasks
  middleware/auth.js  JWT check
  access.js           who may see or manage a project
client/src/
  App.jsx             sign-in state, project list, dialogs
  ProjectView.jsx     tabs, filters, task actions
  Board.jsx  ListView.jsx  CalendarView.jsx
  TaskModal.jsx  ProjectModal.jsx  TeamModal.jsx
```

## API (all under /api, JSON, Bearer token)
| Method | Path | Purpose |
|---|---|---|
| POST | /auth/register, /auth/login | Sign up, sign in |
| GET | /auth/me | Current user |
| GET, POST | /users | List users, add user (admin) |
| PATCH | /users/:id | Role, name, password (admin) |
| GET, POST | /projects | Your projects, create |
| GET, PATCH, DELETE | /projects/:id | Read, update, delete (owner or admin) |
| GET | /tasks?project=ID | Tasks in a project |
| POST | /tasks | Create task |
| GET, PATCH, DELETE | /tasks/:id | Read, update, delete |
| POST | /tasks/:id/comments | Add a comment |
