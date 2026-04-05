/* ── state ──────────────────────────────────────────────── */
let notes = [];
let selectedColor = '#ffffff';
let editColor = '#ffffff';

/* ── DOM refs ───────────────────────────────────────────── */
const noteForm      = document.getElementById('note-form');
const titleInput    = document.getElementById('note-title');
const bodyInput     = document.getElementById('note-body');
const notesGrid     = document.getElementById('notes-grid');
const emptyState    = document.getElementById('empty-state');
const searchInput   = document.getElementById('search');
const editModal     = document.getElementById('edit-modal');
const editForm      = document.getElementById('edit-form');
const editId        = document.getElementById('edit-id');
const editTitle     = document.getElementById('edit-title');
const editBody      = document.getElementById('edit-body');
const cancelEdit    = document.getElementById('cancel-edit');

/* ── api helpers ────────────────────────────────────────── */
async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  return res.json();
}

/* ── render ─────────────────────────────────────────────── */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderNotes(filter = '') {
  const query = filter.toLowerCase().trim();
  const filtered = query
    ? notes.filter(n => n.title.toLowerCase().includes(query) || n.body.toLowerCase().includes(query))
    : notes;

  // pinned first
  const sorted = [...filtered].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  notesGrid.innerHTML = '';

  if (sorted.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  sorted.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card' + (note.pinned ? ' pinned' : '');
    card.style.background = note.color || '#ffffff';
    card.dataset.id = note.id;

    card.innerHTML = `
      <div class="note-title">${escHtml(note.title)}</div>
      <div class="note-body">${escHtml(note.body)}</div>
      <div class="note-meta">${formatDate(note.updatedAt)}</div>
      <div class="note-actions">
        <button class="btn btn-ghost btn-pin" data-id="${note.id}" title="${note.pinned ? 'Unpin' : 'Pin'}">
          ${note.pinned ? '📌 Unpin' : '📌 Pin'}
        </button>
        <button class="btn btn-ghost btn-edit" data-id="${note.id}">Edit</button>
        <button class="btn btn-danger btn-delete" data-id="${note.id}">Delete</button>
      </div>
    `;
    notesGrid.appendChild(card);
  });
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── load ───────────────────────────────────────────────── */
async function loadNotes() {
  notes = await api('GET', '/api/notes');
  renderNotes(searchInput.value);
}

/* ── color pickers ──────────────────────────────────────── */
function initColorPicker(containerId, onSelect) {
  const container = document.getElementById(containerId);
  container.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      onSelect(swatch.dataset.color);
    });
  });
}

function setPickerColor(containerId, color) {
  const container = document.getElementById(containerId);
  container.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('selected', s.dataset.color === color);
  });
}

initColorPicker('color-picker', c => { selectedColor = c; });
initColorPicker('edit-color-picker', c => { editColor = c; });

/* ── add note ───────────────────────────────────────────── */
noteForm.addEventListener('submit', async e => {
  e.preventDefault();
  const note = await api('POST', '/api/notes', {
    title: titleInput.value,
    body: bodyInput.value,
    color: selectedColor,
  });
  if (note && note.id) {
    notes.unshift(note);
    titleInput.value = '';
    bodyInput.value = '';
    renderNotes(searchInput.value);
  }
});

/* ── note actions delegation ────────────────────────────── */
notesGrid.addEventListener('click', async e => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.classList.contains('btn-delete')) {
    await api('DELETE', `/api/notes/${id}`);
    notes = notes.filter(n => n.id !== id);
    renderNotes(searchInput.value);
  }

  if (btn.classList.contains('btn-pin')) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const updated = await api('PATCH', `/api/notes/${id}`, { pinned: !note.pinned });
    Object.assign(note, updated);
    renderNotes(searchInput.value);
  }

  if (btn.classList.contains('btn-edit')) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    editId.value = note.id;
    editTitle.value = note.title;
    editBody.value = note.body;
    editColor = note.color || '#ffffff';
    setPickerColor('edit-color-picker', editColor);
    editModal.classList.remove('hidden');
    editTitle.focus();
  }
});

/* ── edit form ──────────────────────────────────────────── */
editForm.addEventListener('submit', async e => {
  e.preventDefault();
  const id = editId.value;
  const updated = await api('PATCH', `/api/notes/${id}`, {
    title: editTitle.value,
    body: editBody.value,
    color: editColor,
  });
  const idx = notes.findIndex(n => n.id === id);
  if (idx !== -1) Object.assign(notes[idx], updated);
  closeModal();
  renderNotes(searchInput.value);
});

cancelEdit.addEventListener('click', closeModal);

editModal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

function closeModal() {
  editModal.classList.add('hidden');
}

/* ── search ─────────────────────────────────────────────── */
searchInput.addEventListener('input', () => renderNotes(searchInput.value));

/* ── init ───────────────────────────────────────────────── */
loadNotes();
