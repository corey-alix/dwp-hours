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
  pto_rate!: number;

  @Column({ type: "real", default: 0 })
  carryover_hours!: number;

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
  type!: "Sick" | "Full PTO" | "Partial PTO" | "Bereavement" | "Jury Duty";

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
