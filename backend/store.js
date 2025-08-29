// Simple JSON file store for MVP (not for production scale)
import fs from 'fs';
import path from 'path';
const dbPath = path.resolve('data/db.json');

function ensure() {
  if (!fs.existsSync(dbPath)) {
    const seed = {
      users: [
        { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
        { id: 2, username: 'operario', password: 'operario123', role: 'user' }
      ],
      orders: []
    };
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify(seed, null, 2));
  }
}
ensure();

export function readDB() {
  const raw = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(raw);
}

export function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}
