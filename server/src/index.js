require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// In production the built React app is served by this same server.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ error: `Invalid value for ${err.path}` });
  if (err.code === 11000) return res.status(409).json({ error: 'That value is already in use' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on the server' : err.message });
});

async function start() {
  if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not set. Copy .env.example to .env and set a real secret.');
  }
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/team_scheduler');
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, '0.0.0.0', () => console.log(`Team Scheduler is running on http://0.0.0.0:${port}`));
}

start().catch((err) => {
  console.error('Could not start:', err.message);
  process.exit(1);
});
