import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Employee } from "./Employee.js";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "integer" })
  employee_id!: number;

  @Column({ type: "text" })
  type!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;

  @Column({ type: "datetime", nullable: true })
  read_at!: Date | null;

  @Column({ type: "datetime", nullable: true })
  expires_at!: Date | null;

  @Column({ type: "integer", nullable: true })
  created_by!: number | null;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "employee_id" })
  employee!: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "created_by" })
  creator!: Employee | null;
}
