import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Employee } from "./Employee.js";

@Entity("sessions")
export class Session {
  @PrimaryColumn("text")
  token!: string;

  @Column("int")
  employee_id!: number;

  @Column("datetime")
  expires_at!: Date;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "employee_id" })
  employee!: Employee;
}
