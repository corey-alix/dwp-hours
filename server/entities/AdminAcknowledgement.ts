import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Employee } from "./Employee.js";

@Entity("admin_acknowledgements")
export class AdminAcknowledgement {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "integer" })
    employee_id!: number;

    @Column({ type: "text" })
    month!: string;

    @Column({ type: "integer" })
    admin_id!: number;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    acknowledged_at!: Date;

    @ManyToOne(() => Employee, employee => employee.acknowledgements)
    @JoinColumn({ name: "employee_id" })
    employee!: Employee;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: "admin_id" })
    admin!: Employee;
}