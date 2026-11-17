const { DatabaseSync } = require('node:sqlite');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const seed = require('./seed.json');

function openDatabase(filename = path.join(__dirname, 'coati.db')) {
  const db = new DatabaseSync(filename);
  let inTransaction = false;
  try {
    db.exec('BEGIN IMMEDIATE');
    inTransaction = true;
    const existing = db.prepare("SELECT count(*) AS count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").get();
    // Like EnsureCreated in the source, seed only a newly created database.
    if (existing.count === 0) {
      db.exec(readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
      for (const [table, rows] of Object.entries(seed)) {
        for (const row of rows) {
          const columns = Object.keys(row);
          db.prepare(`INSERT INTO "${table}" (${columns.map(column => `"${column}"`).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`)
            .run(...Object.values(row));
        }
      }
    }
    for (const [table, rows] of Object.entries(seed)) {
      db.prepare(`SELECT ${Object.keys(rows[0]).map(column => `"${column}"`).join(', ')} FROM "${table}" LIMIT 0`).all();
    }
    db.exec('COMMIT');
    inTransaction = false;
    return db;
  } catch (error) {
    try {
      if (inTransaction) db.exec('ROLLBACK');
    } finally {
      db.close();
    }
    throw error;
  }
}

module.exports = { openDatabase };
