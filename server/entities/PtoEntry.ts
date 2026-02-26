import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Employee } from "./Employee.js";

@Entity("pto_entries")
export class PtoEntry {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "integer" })
  employee_id!: number;

  @Column({ type: "text" })
  date!: string;

  @Column({ type: "text" })
  type!: "Sick" | "PTO" | "Bereavement" | "Jury Duty";

  @Column({ type: "real" })
  hours!: number;

  @Column({ type: "integer", nullable: true })
  approved_by!: number | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;

  @ManyToOne(() => Employee, (employee) => employee.ptoEntries)
  @JoinColumn({ name: "employee_id" })
  employee!: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: "approved_by" })
  approvedBy!: Employee | null;
}
