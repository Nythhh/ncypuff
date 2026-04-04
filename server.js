const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'notes.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- helpers ---

function readNotes() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeNotes(notes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2));
}

// --- routes ---

// GET /api/notes  – list all notes
app.get('/api/notes', (req, res) => {
  const notes = readNotes();
  res.json(notes);
});

// GET /api/notes/:id  – get single note
app.get('/api/notes/:id', (req, res) => {
  const notes = readNotes();
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

// POST /api/notes  – create note
app.post('/api/notes', (req, res) => {
  const { title, body, color } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const notes = readNotes();
  const note = {
    id: crypto.randomUUID(),
    title: title.trim(),
    body: (body || '').trim(),
    color: color || '#ffffff',
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notes.unshift(note);
  writeNotes(notes);
  res.status(201).json(note);
});

// PATCH /api/notes/:id  – update note
app.patch('/api/notes/:id', (req, res) => {
  const notes = readNotes();
  const idx = notes.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Note not found' });

  const { title, body, color, pinned } = req.body;
  const note = notes[idx];

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }
    note.title = title.trim();
  }
  if (body !== undefined) note.body = String(body).trim();
  if (color !== undefined) note.color = color;
  if (pinned !== undefined) note.pinned = Boolean(pinned);
  note.updatedAt = new Date().toISOString();

  writeNotes(notes);
  res.json(note);
});

// DELETE /api/notes/:id  – delete note
app.delete('/api/notes/:id', (req, res) => {
  const notes = readNotes();
  const idx = notes.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Note not found' });
  notes.splice(idx, 1);
  writeNotes(notes);
  res.status(204).send();
});

// --- start ---
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ncypuff running at http://localhost:${PORT}`);
  });
}

module.exports = app;
