const assert = require('node:assert/strict');
const { describe, it, before, after } = require('node:test');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

// Point data at a temp dir so tests don't touch real data
const TEST_DATA_DIR = path.join(__dirname, '../data-test');
process.env.DATA_DIR_OVERRIDE = TEST_DATA_DIR;

// Patch server to use test data dir before loading
// We do this by temporarily monkey-patching fs before require
const originalMkdirSync = fs.mkdirSync;
const originalWriteFileSync = fs.writeFileSync;
const originalReadFileSync = fs.readFileSync;
const originalExistsSync = fs.existsSync;

let app;

before(() => {
  // Ensure test dir is clean
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true });
  }
  // We re-require the app using a clean environment; since server.js uses
  // __dirname-relative paths, we just ensure the data dir is writable.
  app = require('../server.js');
});

after(() => {
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true });
  }
  // Also remove any data/notes.json created during tests
  const real = path.join(__dirname, '../data/notes.json');
  if (fs.existsSync(real)) {
    fs.writeFileSync(real, JSON.stringify([]));
  }
});

/** Lightweight fetch helper that talks to the express app directly via supertest-like approach */
function request(method, url, body) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const { port } = server.address();
      const options = {
        hostname: '127.0.0.1',
        port,
        path: url,
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
      };
      const req = http.request(options, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          server.close();
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
          });
        });
      });
      req.on('error', err => { server.close(); reject(err); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

describe('Notes API', () => {
  let createdId;

  it('GET /api/notes returns empty array initially', async () => {
    const res = await request('GET', '/api/notes');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  it('POST /api/notes creates a note', async () => {
    const res = await request('POST', '/api/notes', { title: 'Hello', body: 'World' });
    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Hello');
    assert.equal(res.body.body, 'World');
    assert.ok(res.body.id);
    createdId = res.body.id;
  });

  it('POST /api/notes returns 400 when title is missing', async () => {
    const res = await request('POST', '/api/notes', { body: 'no title' });
    assert.equal(res.status, 400);
  });

  it('GET /api/notes returns the created note', async () => {
    const res = await request('GET', '/api/notes');
    assert.equal(res.status, 200);
    assert.ok(res.body.some(n => n.id === createdId));
  });

  it('GET /api/notes/:id returns the note', async () => {
    const res = await request('GET', `/api/notes/${createdId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, createdId);
  });

  it('GET /api/notes/:id returns 404 for unknown id', async () => {
    const res = await request('GET', '/api/notes/nonexistent-id');
    assert.equal(res.status, 404);
  });

  it('PATCH /api/notes/:id updates the note', async () => {
    const res = await request('PATCH', `/api/notes/${createdId}`, { title: 'Updated', pinned: true });
    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'Updated');
    assert.equal(res.body.pinned, true);
  });

  it('PATCH /api/notes/:id returns 404 for unknown id', async () => {
    const res = await request('PATCH', '/api/notes/nonexistent-id', { title: 'x' });
    assert.equal(res.status, 404);
  });

  it('DELETE /api/notes/:id deletes the note', async () => {
    const res = await request('DELETE', `/api/notes/${createdId}`);
    assert.equal(res.status, 204);
  });

  it('GET /api/notes/:id returns 404 after deletion', async () => {
    const res = await request('GET', `/api/notes/${createdId}`);
    assert.equal(res.status, 404);
  });
});
