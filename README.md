# DWP Hours Tracker

A Node.js application for tracking monthly hours worked and managing Paid Time Off (PTO) for employees. This project migrates from a legacy Excel spreadsheet system to a modern web application with a user-friendly interface and API.

## Description

This application allows employees to log various types of time off (Sick, PTO, Bereavement, Jury Duty) for specific date ranges, including total hours. Users can view their PTO status for the entire year, broken down by month. An admin panel provides oversight for managing users and reviewing PTO usage.

**PTO Calculation Rules:**
- At the start of each year, the system automatically debits PTO entries with **96 hours of "PTO"** and **24 hours of "Sick"** dated January 1st
- PTO carryover from the prior year is added as an additional PTO entry on January 1st
- "Sick" time is **reset to 24 hours at the start of each year** (no carryover for sick time)
- In addition, employees **accrue pto_rate hours per work day** to their PTO balance throughout the year
- **Work days** are the total non-weekend (Monday-Friday) days in each month
- **Monthly accrual** = pto_rate × work_days_in_month
- **Available PTO** = Sum of allocation entries + Accrued - Used PTO Hours
- **Time Off Types**: "Sick", "PTO", "Bereavement", "Jury Duty" are all tracked as separate PTO types
- Each type has its own balance and usage tracking
- At year-end, usage reports must break down hours by type

The system ensures accurate tracking per employee with individual rates and carryover balances.

## Features

- **Time Off Logging**: Submit time off entries via web UI or API
  - Types: Sick, PTO, Bereavement, Jury Duty
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
- **Backend**: Node.js with TypeORM and SQLite database
- **Development Server**: http-serve for local development
- **Database**: SQLite with TypeORM entities for:
  - `Employee`: Employee information and authentication
  - `PtoEntry`: Time off tracking with relationships
  - `MonthlyHours`: Monthly hours worked submissions
  - `Acknowledgement`: Monthly review acknowledgements
- **ORM**: TypeORM with DataMapper pattern and sql.js driver for WSL compatibility
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

1. Access the admin panel (if you have admin role)
2. **Currently available:** Basic admin navigation
3. **Planned features (not yet implemented):**
   - Manage employee records (add, edit, delete)
   - Review PTO usage reports by employee and time period
   - Adjust PTO rates and carryover as needed
   - Monitor acknowledgement status and send reminders
   - Generate reports on monthly hours submissions

## API Endpoints

**Note: The following endpoints are actually implemented in the current codebase. Previous documentation listed some endpoints that do not exist or have different paths.**

### Authentication
- `POST /api/auth/request-link`: Send magic link authentication email to employee identifier
- `GET /api/auth/validate`: Validate authentication token from magic link

### PTO Management
- `GET /api/pto`: Retrieve all PTO entries (admin) or filtered entries
- `POST /api/pto`: Submit a new PTO entry for time off request
- `PUT /api/pto/:id`: Update an existing PTO entry (admin only)
- `DELETE /api/pto/:id`: Delete/cancel a PTO entry (admin only)
- `GET /api/pto/status/:employeeId`: Get comprehensive PTO status summary including balances, accruals, and usage by type

### Monthly Hours Tracking
- `POST /api/hours`: Submit monthly hours worked for an employee
- `GET /api/hours/:employeeId`: Retrieve monthly hours submissions for an employee

### Acknowledgement System
- `POST /api/acknowledgements`: Submit monthly review acknowledgement
- `GET /api/acknowledgements/:employeeId`: Check acknowledgement status for an employee

### Employee Management (Admin Only)
- `GET /api/employees`: List all employees with optional search/filtering
- `GET /api/employees/:id`: Get detailed information for a specific employee
- `PUT /api/employees/:id`: Update employee information (name, PTO rate, carryover, etc.)
- `DELETE /api/employees/:id`: Remove an employee from the system

**Missing from documentation but needed for full functionality:**
- `POST /api/employees`: Add a new employee (currently missing)
- `GET /api/employees/:id/pto-report`: Generate detailed PTO usage report (currently missing)
- `GET /api/reminders/unacknowledged`: Get list of employees needing monthly reminders (currently missing)

## TypeORM Entities

The database schema is defined using TypeORM entities with relationships and decorators. The entities are located in `src/entities/` and automatically generate the SQLite tables.

### Employee Entity

```typescript
@Entity("employees")
export class Employee {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text", unique: true })
  identifier!: string;

  @Column({ type: "real", default: 0.71 })
  pto_rate!: number;  // Hours per work day for accrual calculations

  @Column({ type: "real", default: 0 })
  carryover_hours!: number;

  @Column({ type: "date" })
  hire_date!: Date;

  @Column({ type: "text", default: "Employee" })
  role!: string;

  @Column({ type: "text", nullable: true })
  hash!: string;

  @OneToMany(() => PtoEntry, ptoEntry => ptoEntry.employee)
  ptoEntries!: PtoEntry[];

  @OneToMany(() => MonthlyHours, monthlyHours => monthlyHours.employee)
  monthlyHours!: MonthlyHours[];

  @OneToMany(() => Acknowledgement, acknowledgement => acknowledgement.employee)
  acknowledgements!: Acknowledgement[];
}
```

### PtoEntry Entity

```typescript
@Entity("pto_entries")
export class PtoEntry {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "integer" })
  employee_id!: number;

  @Column({ type: "date" })
  start_date!: Date;

  @Column({ type: "date" })
  end_date!: Date;

  @Column({ type: "text" })
  type!: "Sick" | "PTO" | "Bereavement" | "Jury Duty";

  @Column({ type: "real" })
  hours!: number;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;

  @ManyToOne(() => Employee, employee => employee.ptoEntries)
  @JoinColumn({ name: "employee_id" })
  employee!: Employee;
}
```

### MonthlyHours Entity

```typescript
@Entity("monthly_hours")
export class MonthlyHours {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "integer" })
  employee_id!: number;

  @Column({ type: "date" })
  month!: Date;

  @Column({ type: "real" })
  hours_worked!: number;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  submitted_at!: Date;

  @ManyToOne(() => Employee, employee => employee.monthlyHours)
  @JoinColumn({ name: "employee_id" })
  employee!: Employee;
}
```

### Acknowledgement Entity

```typescript
@Entity("acknowledgements")
export class Acknowledgement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "integer" })
  employee_id!: number;

  @Column({ type: "date" })
  month!: Date;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  acknowledged_at!: Date;

  @ManyToOne(() => Employee, employee => employee.acknowledgements)
  @JoinColumn({ name: "employee_id" })
  employee!: Employee;
}
```

## Admin Panel

**Status: Partially Implemented** - Basic UI structure exists but functionality is not yet complete.

Currently provides:
- Basic admin panel navigation (visible to admin users)
- Placeholder buttons for "Manage Employees" and "View Reports"
- Role-based access control (admin vs employee roles)

**Planned features (not yet implemented):**
- Employee CRUD operations
- PTO usage analytics and reports
- Monthly and yearly PTO summaries
- Rate and carryover management
- Monthly hours review and reporting
- Acknowledgement status monitoring
- Automated reminder system management

Access requires admin privileges.

## Monthly Review & Acknowledgement System

**Status: Partially Implemented** - Basic acknowledgement functionality exists but automated reminders are not yet implemented.

Currently provides:
- Manual submission of monthly acknowledgements via API
- Tracking of acknowledgement timestamps
- Basic acknowledgement status checking

**Planned automated features (not yet implemented):**
- Automatic reminders at month-end
- Daily follow-up reminders for unacknowledged reviews
- Automated reminder scheduler system

### Acknowledgement Process

- Employees can manually submit acknowledgements via the API
- The system tracks acknowledgement timestamps
- **Automated reminders are planned but not yet implemented**

### Reminder Workflow

**Current state:** Manual acknowledgement only
**Planned:** Automated monthly and daily reminder system

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
