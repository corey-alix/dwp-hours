import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Employee } from "./Employee.js";

@Entity("monthly_hours")
export class MonthlyHours {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "integer" })
    employee_id!: number;

    @Column({ type: "text" })
    month!: string;

    @Column({ type: "real" })
    hours_worked!: number;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    submitted_at!: Date;

    @ManyToOne(() => Employee, employee => employee.monthlyHours)
    @JoinColumn({ name: "employee_id" })
    employee!: Employee;
}