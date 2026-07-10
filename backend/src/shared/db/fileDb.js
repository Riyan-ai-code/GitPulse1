import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../../database.json');

// Initialize database file if it doesn't exist
const initDb = () => {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ cache: [], history: [] }, null, 2), 'utf-8');
  }
};

const readDb = () => {
  try {
    initDb();
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[fileDb] Error reading database.json, resetting:', error);
    return { cache: [], history: [] };
  }
};

const writeDb = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('[fileDb] Error writing to database.json:', error);
  }
};

export const getCache = (key) => {
  const db = readDb();
  const cached = db.cache.find(c => c.key === key);
  if (!cached) return null;
  
  // Check if cache item has expired
  if (Date.now() > cached.expiresAt) {
    db.cache = db.cache.filter(c => c.key !== key);
    writeDb(db);
    return null;
  }
  return cached.data;
};

export const setCache = (key, data, durationMs = 3600000) => {
  const db = readDb();
  // Filter out existing key and expired items to keep DB compact
  db.cache = db.cache.filter(c => c.key !== key && Date.now() < c.expiresAt);
  db.cache.push({
    key,
    data,
    expiresAt: Date.now() + durationMs
  });
  writeDb(db);
};

export const logAudit = (owner, repo, score, stars, forks, language, version) => {
  const db = readDb();
  // Filter out existing audit of the same repo to keep history list unique
  db.history = db.history.filter(h => 
    !(h.owner.toLowerCase() === owner.toLowerCase() && h.repo.toLowerCase() === repo.toLowerCase())
  );
  
  db.history.unshift({
    owner,
    repo,
    score,
    stars,
    forks,
    primaryLanguage: language || 'Unknown',
    version: version || null,
    analyzedAt: new Date().toISOString()
  });
  
  // Keep only the last 30 logs in query history
  db.history = db.history.slice(0, 30);
  writeDb(db);
};

export const getHistory = () => {
  const db = readDb();
  return db.history || [];
};

export const deleteHistoryEntry = (owner, repo) => {
  const db = readDb();
  const before = db.history.length;
  db.history = db.history.filter(h =>
    !(h.owner.toLowerCase() === owner.toLowerCase() && h.repo.toLowerCase() === repo.toLowerCase())
  );
  writeDb(db);
  return db.history.length < before;
};

export const deleteCacheEntries = (owner, repo) => {
  const db = readDb();
  const prefix = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const before = db.cache.length;
  db.cache = db.cache.filter(c => !c.key.endsWith(prefix));
  writeDb(db);
  return db.cache.length < before;
};
