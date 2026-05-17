import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs-extra';

let db: Database;

export async function initDb() {
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user',
      api_key TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      name TEXT,
      owner_id INTEGER,
      image TEXT,
      cpu REAL,
      ram INTEGER,
      storage INTEGER,
      status TEXT DEFAULT 'stopped',
      FOREIGN KEY(owner_id) REFERENCES users(id)
    );
  `);

  // Create admin if not exists
  const admin = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
  if (!admin) {
    // Default password is 'admin123' - should be changed
    await db.run('INSERT INTO users (username, password, role, api_key) VALUES (?, ?, ?, ?)', 
      ['admin', '$2a$10$6v46w6yNoI7j7K.rXQ9U.ef7p.x9sZ3O7v7.5yY6V.9.p.Y.Y.Y.Y', 'admin', 'admin-key-123']);
  }
  
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}
