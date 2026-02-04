-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

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

-- Create monthly hours table
CREATE TABLE IF NOT EXISTS monthly_hours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  month DATE NOT NULL,
  hours_worked REAL NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Create acknowledgements table
CREATE TABLE IF NOT EXISTS acknowledgements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  month DATE NOT NULL,
  acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Create indexes for monthly hours
CREATE INDEX IF NOT EXISTS idx_monthly_hours_employee_id ON monthly_hours(employee_id);
CREATE INDEX IF NOT EXISTS idx_monthly_hours_month ON monthly_hours(month);

-- Create indexes for acknowledgements
CREATE INDEX IF NOT EXISTS idx_acknowledgements_employee_id ON acknowledgements(employee_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgements_month ON acknowledgements(month);