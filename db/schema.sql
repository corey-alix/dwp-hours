-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  identifier TEXT UNIQUE NOT NULL,
  pto_rate REAL DEFAULT 0.71,
  carryover_hours REAL DEFAULT 0,
  hire_date DATE NOT NULL,
  role TEXT DEFAULT 'Employee',
  hash TEXT
);

-- Create PTO entries table
CREATE TABLE IF NOT EXISTS pto_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  date TEXT NOT NULL,  -- Changed from start_date/end_date
  type TEXT NOT NULL CHECK (type IN ('Sick', 'PTO', 'Bereavement', 'Jury Duty')),
  hours REAL NOT NULL,
  approved_by INTEGER,  -- NULL = pending approval, ID = approved by admin
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pto_entries_employee_id ON pto_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_pto_entries_date ON pto_entries(date);
CREATE INDEX IF NOT EXISTS idx_pto_entries_approved_by ON pto_entries(approved_by);

-- Create monthly hours table
CREATE TABLE IF NOT EXISTS monthly_hours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  hours_worked REAL NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Create acknowledgements table
CREATE TABLE IF NOT EXISTS acknowledgements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Create indexes for monthly hours
CREATE INDEX IF NOT EXISTS idx_monthly_hours_employee_id ON monthly_hours(employee_id);
CREATE INDEX IF NOT EXISTS idx_monthly_hours_month ON monthly_hours(month);

-- Create indexes for acknowledgements
CREATE INDEX IF NOT EXISTS idx_acknowledgements_employee_id ON acknowledgements(employee_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgements_month ON acknowledgements(month);

-- Create admin acknowledgements table
CREATE TABLE IF NOT EXISTS admin_acknowledgements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  admin_id INTEGER NOT NULL,
  acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Create indexes for admin acknowledgements
CREATE INDEX IF NOT EXISTS idx_admin_acknowledgements_employee_id ON admin_acknowledgements(employee_id);
CREATE INDEX IF NOT EXISTS idx_admin_acknowledgements_admin_id ON admin_acknowledgements(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_acknowledgements_month ON admin_acknowledgements(month);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_employee_id ON sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);