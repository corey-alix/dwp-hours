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
- **Employee Management**: Admin panel for adding/editing employee data
- **PTO Review**: Admin tools for reviewing monthly/yearly PTO usage
- **API Integration**: RESTful API for programmatic access
- **Responsive Design**: Vanilla CSS for clean, accessible UI

## Architecture

- **Frontend**: Vanilla HTML, CSS, and TypeScript
- **Backend**: Node.js with SQLite database
- **Development Server**: http-serve for local development
- **Database**: SQLite with two main tables:
  - `employees`: Stores employee name and identifier
  - `pto_entries`: Tracks time off entries with dates, types, and hours

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd dwp-hours-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run setup-db
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000` (or configured port).

## Usage

### For Employees

1. Log in with your employee identifier
2. Navigate to the dashboard to view your PTO status
3. Submit time off requests by selecting date ranges and types
4. View monthly and yearly PTO summaries

### For Admins

1. Access the admin panel
2. Manage employee records (add, edit, delete)
3. Review PTO usage reports by employee and time period
4. Adjust PTO rates and carryover as needed

## API Endpoints

- `POST /api/pto`: Submit a new PTO entry
- `GET /api/pto/:employeeId`: Retrieve PTO entries for an employee
- `GET /api/pto/status/:employeeId`: Get PTO status summary
- `POST /api/employees`: Add a new employee (admin only)
- `PUT /api/employees/:id`: Update employee information (admin only)
- `GET /api/employees/:id/pto-report`: Generate PTO report (admin only)

## Database Schema

### Employees Table
```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  identifier TEXT UNIQUE NOT NULL,
  pto_rate REAL DEFAULT 0.71,
  carryover_hours REAL DEFAULT 0
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
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
```

## Admin Panel

The admin panel provides:
- Employee CRUD operations
- PTO usage analytics and reports
- Monthly and yearly PTO summaries
- Rate and carryover management

Access requires admin privileges.

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