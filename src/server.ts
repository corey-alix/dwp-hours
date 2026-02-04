import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const DB_PATH = path.join(__dirname, '..', 'db', 'dwp-hours.db');
const LOG_PATH = path.join(__dirname, '..', 'logs', 'app.log');

// Ensure logs directory exists
const logsDir = path.dirname(LOG_PATH);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple file-based logging
function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_PATH, logMessage);
  console.log(message);
}

// Database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    log(`Database connection error: ${err.message}`);
    process.exit(1);
  }
  log('Connected to SQLite database.');
});

// Basic routes
app.get('/api/health', (req, res) => {
  log('Health check requested');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Placeholder for PTO routes
app.get('/api/pto/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  log(`PTO entries requested for employee ${employeeId}`);
  // TODO: Implement PTO retrieval
  res.json({ employeeId, entries: [] });
});

app.post('/api/pto', (req, res) => {
  const { employeeId, startDate, endDate, type, hours } = req.body;
  log(`New PTO entry: ${JSON.stringify(req.body)}`);
  // TODO: Implement PTO creation
  res.json({ success: true, id: Date.now() });
});

// Placeholder for employee routes
app.get('/api/employees', (req, res) => {
  log('Employees list requested');
  // TODO: Implement employee listing
  res.json({ employees: [] });
});

app.post('/api/employees', (req, res) => {
  const { name, identifier, ptoRate, carryoverHours, role, hash } = req.body;
  log(`New employee: ${JSON.stringify(req.body)}`);
  // TODO: Implement employee creation
  res.json({ success: true, id: Date.now() });
});

// Start server
app.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
});

export default app;