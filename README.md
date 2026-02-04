# DWP Hours Tracker

A Node.js application for tracking monthly hours worked and managing Paid Time Off (PTO) for employees. This project migrates from a legacy Excel spreadsheet system to a modern web application with a user-friendly interface and API.

## Description

This application allows employees to log various types of time off (Sick, Full PTO, Partial PTO, Bereavement, Jury Duty) for specific date ranges, including total hours. Users can view their PTO status for the entire year, broken down by month. An admin panel provides oversight for managing users and reviewing PTO usage.

The system accounts for individual PTO accumulation rates and carryover balances, ensuring accurate tracking per employee.

## Features

- **Time Off Logging**: Submit time off entries via web UI or API
  - Types: Sick, Full PTO, Partial PTO, Bereavement, Jury Duty
  - Date range selection with total hours
- **PTO Status Dashboard**: View annual PTO status by month
- **Monthly Hours Review**: Submit and review monthly hours worked
- **Acknowledgement System**: Monthly acknowledgement of hours review completion
  - Automatic reminders at month-end
  - Daily follow-up reminders for unacknowledged reviews
  - Track acknowledgement status per employee per month
- **Employee Management**: Admin panel for adding/editing employee data
- **PTO Review**: Admin tools for reviewing monthly/yearly PTO usage
- **API Integration**: RESTful API for programmatic access
- **Responsive Design**: Vanilla CSS for clean, accessible UI

## Architecture

- **Frontend**: Vanilla HTML, CSS, and TypeScript
- **Backend**: Node.js with SQLite database
- **Development Server**: http-serve for local development
- **Database**: SQLite with tables for:
  - `employees`: Employee information and authentication
  - `pto_entries`: Time off tracking
  - `monthly_hours`: Monthly hours worked submissions
  - `acknowledgements`: Monthly review acknowledgements
- **Automated Systems**: Monthly reminder scheduler and daily follow-up system

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Quick Start

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd dwp-hours-tracker
   npm install
   ```

2. **Set up the Database**

   ```bash
   npm run db:init
   ```

3. **Start Development Server**

   ```bash
   npm run dev
   ```

4. **Open in Browser**

   Navigate to `http://localhost:3000` to access the application.

### Development Workflow

- **Build**: `npm run build` - Compile TypeScript to JavaScript
- **Lint**: `npm run lint` - Check TypeScript for errors
- **Format**: `npm run format` - Format code with Prettier
- **Test**: `npm test` - Run unit tests with Vitest
- **E2E Test**: `npm run test:e2e` - Run end-to-end tests with Playwright

### Project Structure

```
dwp-hours-tracker/
├── src/                 # TypeScript source files
├── public/              # Static web assets
├── db/                  # Database files and schema
├── scripts/             # Utility scripts
├── docs/                # Documentation
├── dist/                # Compiled JavaScript (generated)
├── logs/                # Application logs
├── package.json         # Project configuration
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## Installation

## Usage

### For Employees

1. Log in with your employee identifier
2. Navigate to the dashboard to view your PTO status
3. Submit time off requests by selecting date ranges and types
4. Submit monthly hours worked at the end of each month
5. Review and acknowledge your monthly hours and PTO status
6. Receive reminders if acknowledgement is pending

### For Admins

1. Access the admin panel
2. Manage employee records (add, edit, delete)
3. Review PTO usage reports by employee and time period
4. Adjust PTO rates and carryover as needed
5. Monitor acknowledgement status and send reminders
6. Generate reports on monthly hours submissions

## API Endpoints

- `POST /api/pto`: Submit a new PTO entry
- `GET /api/pto/:employeeId`: Retrieve PTO entries for an employee
- `GET /api/pto/status/:employeeId`: Get PTO status summary
- `POST /api/monthly-hours`: Submit monthly hours worked
- `GET /api/monthly-hours/:employeeId/:month`: Get monthly hours for an employee
- `POST /api/acknowledgements`: Submit monthly review acknowledgement
- `GET /api/acknowledgements/:employeeId/:month`: Check acknowledgement status
- `POST /api/employees`: Add a new employee (admin only)
- `PUT /api/employees/:id`: Update employee information (admin only)
- `GET /api/employees/:id/pto-report`: Generate PTO report (admin only)
- `GET /api/reminders/unacknowledged`: Get list of employees needing reminders (admin only)

## Database Schema

### Employees Table

```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  identifier TEXT UNIQUE NOT NULL,
  pto_rate REAL DEFAULT 0.71,
  carryover_hours REAL DEFAULT 0,
  role TEXT DEFAULT 'Employee',
  hash TEXT
);
```

### PTO Entries Table

```sql
CREATE TABLE pto_entries (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER,
  start_date DATE,
  end_date DATE,
  type TEXT, -- 'Sick', 'Full PTO', 'Partial PTO', 'Bereavement', 'Jury Duty'
  hours REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
```

### Monthly Hours Table

```sql
CREATE TABLE monthly_hours (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  month DATE NOT NULL, -- YYYY-MM-01 format
  hours_worked REAL NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
```

### Acknowledgements Table

```sql
CREATE TABLE acknowledgements (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  month DATE NOT NULL, -- YYYY-MM-01 format
  acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
```

## Admin Panel

The admin panel provides:

- Employee CRUD operations
- PTO usage analytics and reports
- Monthly and yearly PTO summaries
- Rate and carryover management
- Monthly hours review and reporting
- Acknowledgement status monitoring
- Automated reminder system management

Access requires admin privileges.

## Monthly Review & Acknowledgement System

At the end of each month, the system automatically:

1. **Sends Reminders**: Notifies all employees to review and submit their monthly hours worked
2. **Tracks Submissions**: Records monthly hours submissions and PTO entries
3. **Requires Acknowledgement**: Employees must acknowledge they've reviewed their status
4. **Daily Follow-ups**: Sends daily reminders to employees who haven't acknowledged
5. **Admin Monitoring**: Provides admins with visibility into acknowledgement status

### Acknowledgement Process

- Employees receive a monthly reminder to review their hours and PTO
- If no changes are needed, they submit an acknowledgement confirming review completion
- The system tracks acknowledgement timestamps
- Unacknowledged employees receive daily reminders until they respond

### Reminder Workflow

- **Month-end**: Initial reminder sent to all employees
- **Daily (if unacknowledged)**: Follow-up reminders sent automatically
- **Admin Dashboard**: View acknowledgement status and manually send reminders if needed

## Similar Projects/Solutions

Here are some similar open-source projects and commercial solutions that can serve as inspiration:

1. **Time Off Management Systems**:
   - [OrangeHRM](https://www.orangehrm.com/): Open-source HR management with time off tracking
   - [Sentrifugo](https://www.sentrifugo.com/): HRMS with leave management

2. **Time Tracking Applications**:
   - [Kimai](https://www.kimai.org/): Open-source time tracking software
   - [Toggl Track](https://toggl.com/track/): Commercial time tracking with PTO features

3. **PTO-Specific Trackers**:
   - [Vacation Tracker](https://github.com/vacationtracker): Open-source vacation tracking
   - [BambooHR](https://www.bamboohr.com/): Commercial HR platform with PTO management

4. **Node.js-Based HR Tools**:
   - [Node-RED HR Dashboard](https://nodered.org/): Customizable dashboard for HR metrics
   - [Express.js PTO API](https://github.com/expressjs/express): Framework for building similar APIs

These projects demonstrate various approaches to time off tracking, from simple spreadsheets to full HR suites.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Migration from Legacy Spreadsheet

This application replaces the manual Excel spreadsheet tracking (see `legacy.spreadsheet.txt`) with an automated, database-driven system. The migration process involves:

- Importing existing employee data
- Converting spreadsheet entries to database records
- Setting up individual PTO rates and carryover balances
- Training users on the new interface
