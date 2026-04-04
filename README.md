# ncypuff

A minimal, self-hosted **notes mini-app** built with Node.js + Express and vanilla HTML/CSS/JS.

## Features

- Create, edit, delete, and pin notes
- Color-coded notes (6 pastel colors)
- Full-text search (title & body)
- Persistent JSON storage (no database needed)
- Responsive layout

## Tech Stack

| Layer    | Tech                         |
|----------|------------------------------|
| Backend  | Node.js 18+ · Express        |
| Frontend | Vanilla HTML/CSS/JS          |
| Storage  | JSON file on disk            |
| Tests    | Node.js built-in test runner |

## Getting Started

```bash
# install dependencies
npm install

# start the server (default port 3000)
npm start

# development mode (auto-reload via nodemon)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Reference

| Method | Path           | Description       |
|--------|----------------|-------------------|
| GET    | /api/notes     | List all notes    |
| GET    | /api/notes/:id | Get a single note |
| POST   | /api/notes     | Create a note     |
| PATCH  | /api/notes/:id | Update a note     |
| DELETE | /api/notes/:id | Delete a note     |

### Note schema

```json
{
  "id": "uuid",
  "title": "string (required)",
  "body": "string",
  "color": "#hex",
  "pinned": false,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

## Running Tests

```bash
npm test
```

All tests use the built-in `node:test` runner — no extra dependencies required.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT     | 3000    | Server port |
