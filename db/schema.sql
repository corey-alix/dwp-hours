-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  identifier TEXT UNIQUE NOT NULL,
  pto_rate REAL DEFAULT 0.71,
  carryover_hours REAL DEFAULT 0,
  role TEXT DEFAULT 'Employee',
  hash TEXT
);

-- Create PTO entries table
CREATE TABLE IF NOT EXISTS pto_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Sick', 'Full PTO', 'Partial PTO', 'Bereavement', 'Jury Duty')),
  hours REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pto_entries_employee_id ON pto_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_pto_entries_start_date ON pto_entries(start_date);
CREATE INDEX IF NOT EXISTS idx_pto_entries_end_date ON pto_entries(end_date);