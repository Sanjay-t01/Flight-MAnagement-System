const path = require("path");
const express = require("express");
const session = require("express-session");
const SQLiteStoreFactory = require("connect-sqlite3");

const { initDb } = require("./db");
const authRoutes = require("./routes/auth.routes");
const flightsRoutes = require("./routes/flights.routes");
const bookingsRoutes = require("./routes/bookings.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();
const PORT = process.env.PORT || 3000;

initDb();

app.use(express.json({ limit: "1mb" }));

const SQLiteStore = SQLiteStoreFactory(session);
app.use(
  session({
    store: new SQLiteStore({
      dir: path.join(__dirname, "..", "database"),
      db: "sessions.sqlite",
    }),
    secret: process.env.SESSION_SECRET || "fms_dev_secret_change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    },
  })
);

// Static frontend + assets
const frontendDir = path.join(__dirname, "..", "frontend");
const imagesDir = path.join(__dirname, "..", "images");
app.use(express.static(frontendDir));
app.use("/images", express.static(imagesDir));

// API
app.use("/api", authRoutes);
app.use("/api", flightsRoutes);
app.use("/api", bookingsRoutes);
app.use("/api", adminRoutes);

// SPA-like fallback for direct nav (simple: serve home)
app.get("/", (_req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`FMS server running at http://localhost:${PORT}`);
});

