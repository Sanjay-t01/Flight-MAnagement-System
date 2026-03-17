const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DB_PATH = path.join(__dirname, "..", "database", "fms.sqlite");

let db;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH);
    db.exec("PRAGMA foreign_keys = ON;");
  }
  return db;
}

function initDb() {
  // Lazy open to ensure file path exists; schema is created by `npm run seed`.
  getDb();
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function tx(fn) {
  await run("BEGIN IMMEDIATE;");
  try {
    const result = await fn();
    await run("COMMIT;");
    return result;
  } catch (e) {
    try {
      await run("ROLLBACK;");
    } catch {
      // ignore rollback errors
    }
    throw e;
  }
}

module.exports = { DB_PATH, initDb, getDb, run, get, all, tx };

