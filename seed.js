const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const { DB_PATH, getDb, run } = require("./db");

async function createTables() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS flights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      airline_name TEXT NOT NULL,
      flight_number TEXT NOT NULL UNIQUE,
      from_city TEXT NOT NULL,
      to_city TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      ticket_price REAL NOT NULL,
      total_seats INTEGER NOT NULL,
      available_seats INTEGER NOT NULL
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      flight_id INTEGER NOT NULL,
      booking_date TEXT NOT NULL,
      price_paid REAL NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(flight_id) REFERENCES flights(id) ON DELETE CASCADE
    );
  `);
}

async function resetDemoData() {
  await run("DELETE FROM bookings;");
  await run("DELETE FROM flights;");
  // users/admins are preserved except default admin ensure step
}

async function seedFlights() {
  const flights = [
    ["IndiGo", "6E-203", "Delhi", "Mumbai", "06:30", "08:40", 4499, 180, 42],
    ["Air India", "AI-665", "Delhi", "Mumbai", "10:15", "12:20", 5299, 180, 15],
    ["Vistara", "UK-941", "Delhi", "Bengaluru", "07:05", "09:50", 6199, 160, 22],
    ["SpiceJet", "SG-819", "Mumbai", "Goa", "09:10", "10:20", 2999, 180, 60],
    ["Akasa Air", "QP-112", "Mumbai", "Ahmedabad", "13:45", "15:05", 2799, 180, 75],
    ["IndiGo", "6E-771", "Bengaluru", "Hyderabad", "11:00", "12:10", 2199, 186, 90],
    ["Air India", "AI-517", "Hyderabad", "Chennai", "16:25", "17:35", 2399, 150, 30],
    ["Vistara", "UK-816", "Chennai", "Kolkata", "08:20", "10:55", 4899, 160, 18],
    ["SpiceJet", "SG-404", "Kolkata", "Delhi", "19:10", "21:35", 4599, 180, 11],
    ["IndiGo", "6E-902", "Pune", "Delhi", "05:50", "08:05", 3999, 180, 44],
    ["Air India", "AI-121", "Delhi", "Jaipur", "14:10", "15:00", 1899, 120, 80],
    ["Akasa Air", "QP-778", "Bengaluru", "Mumbai", "20:05", "21:40", 4099, 180, 5],
    ["Vistara", "UK-518", "Mumbai", "Delhi", "22:10", "00:20", 5699, 160, 12],
    ["IndiGo", "6E-335", "Goa", "Bengaluru", "12:30", "13:50", 3199, 180, 55],
    ["SpiceJet", "SG-900", "Ahmedabad", "Delhi", "18:15", "19:55", 3599, 180, 20],
    ["Air India", "AI-909", "Chennai", "Delhi", "06:40", "09:35", 5999, 180, 9],
  ];

  for (const f of flights) {
    await run(
      `INSERT INTO flights
        (airline_name, flight_number, from_city, to_city, departure_time, arrival_time, ticket_price, total_seats, available_seats)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      f
    );
  }
}

async function ensureDefaultAdmin() {
  const username = "admin";
  const password = "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await run(
    `INSERT INTO admins (username, password_hash, created_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash`,
    [username, passwordHash]
  );

  console.log("Default admin credentials:");
  console.log(`  username: ${username}`);
  console.log(`  password: ${password}`);
}

async function main() {
  const dbDir = path.join(__dirname, "..", "database");
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  // open db
  getDb();

  await createTables();
  await resetDemoData();
  await seedFlights();
  await ensureDefaultAdmin();

  console.log(`Seed completed. SQLite DB at: ${DB_PATH}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

