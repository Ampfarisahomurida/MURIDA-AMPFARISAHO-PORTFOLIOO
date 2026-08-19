import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'app.db');

function init() {
  // ensure data dir
  try { fs.mkdirSync(path.join(__dirname,'data'), { recursive: true }); } catch (e) {}
  const db = new Database(DB_FILE);

  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      sessionId TEXT PRIMARY KEY,
      history TEXT,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT,
      role TEXT,
      content TEXT,
      ts INTEGER
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      triggers TEXT,
      answer TEXT
    );

    CREATE TABLE IF NOT EXISTS analytics (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  return db;
}

const db = init();

export function saveConversation(sessionId, history) {
  try {
    const stmt = db.prepare(`INSERT INTO chats (sessionId, history, updatedAt) VALUES (?, ?, ?) ON CONFLICT(sessionId) DO UPDATE SET history=excluded.history, updatedAt=excluded.updatedAt`);
    stmt.run(sessionId, JSON.stringify(history), Date.now());

    const insertMsg = db.prepare(`INSERT INTO messages (sessionId, role, content, ts) VALUES (?, ?, ?, ?)`);
    const now = Date.now();
    // insert only the last few messages to avoid duplicates
    history.slice(-20).forEach(m => {
      insertMsg.run(sessionId, m.role, m.content, now);
    });
    return true;
  } catch (e) {
    console.error('saveConversation error', e);
    return false;
  }
}

export function loadAllConversations() {
  try {
    const rows = db.prepare('SELECT sessionId, history, updatedAt FROM chats').all();
    const result = {};
    rows.forEach(r => { result[r.sessionId] = JSON.parse(r.history || '[]'); });
    return result;
  } catch (e) {
    console.error('loadAllConversations error', e);
    return {};
  }
}

export function clearConversation(sessionId) {
  try {
    db.prepare('DELETE FROM chats WHERE sessionId = ?').run(sessionId);
    db.prepare('DELETE FROM messages WHERE sessionId = ?').run(sessionId);
    return true;
  } catch (e) {
    console.error('clearConversation error', e);
    return false;
  }
}

export function getAllFAQs() {
  try {
    return db.prepare('SELECT id, triggers, answer FROM faqs ORDER BY id DESC').all().map(r => ({ id: r.id, triggers: JSON.parse(r.triggers), answer: r.answer }));
  } catch (e) {
    console.error('getAllFAQs error', e);
    return [];
  }
}

export function upsertFAQ(triggers, answer, id=null) {
  try {
    if (id) {
      db.prepare('UPDATE faqs SET triggers = ?, answer = ? WHERE id = ?').run(JSON.stringify(triggers), answer, id);
      return id;
    } else {
      const info = db.prepare('INSERT INTO faqs (triggers, answer) VALUES (?, ?)').run(JSON.stringify(triggers), answer);
      return info.lastInsertRowid;
    }
  } catch (e) {
    console.error('upsertFAQ error', e);
    return null;
  }
}

export function deleteFAQ(id) {
  try {
    db.prepare('DELETE FROM faqs WHERE id = ?').run(id);
    return true;
  } catch (e) {
    console.error('deleteFAQ error', e);
    return false;
  }
}

export function exportChats() {
  try {
    const rows = db.prepare('SELECT sessionId, history, updatedAt FROM chats').all();
    const obj = {};
    rows.forEach(r => obj[r.sessionId] = JSON.parse(r.history || '[]'));
    return obj;
  } catch (e) {
    console.error('exportChats error', e);
    return {};
  }
}

export function getAnalytics() {
  try {
    const totalRow = db.prepare('SELECT COUNT(*) as cnt FROM messages').get();
    const total = totalRow ? totalRow.cnt : 0;
    const bySession = db.prepare('SELECT sessionId, COUNT(*) as cnt FROM messages GROUP BY sessionId ORDER BY cnt DESC LIMIT 50').all();
    return { total, bySession };
  } catch (e) {
    console.error('getAnalytics error', e);
    return { total: 0, bySession: [] };
  }
}

export default db;
