import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Employee } from "./Employee.js";

@Entity("acknowledgements")
export class Acknowledgement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "integer" })
  employee_id!: number;

  @Column({ type: "text" })
  month!: string;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  acknowledged_at!: Date;

  @Column({ type: "text", nullable: true })
  note!: string | null;

  @Column({ type: "text", nullable: true })
  status!: string | null;

  @ManyToOne(() => Employee, (employee) => employee.acknowledgements)
  @JoinColumn({ name: "employee_id" })
  employee!: Employee;
}
