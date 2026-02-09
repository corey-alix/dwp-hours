import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { PtoEntry } from "./PtoEntry.js";
import { MonthlyHours } from "./MonthlyHours.js";
import { Acknowledgement } from "./Acknowledgement.js";
import { AdminAcknowledgement } from "./AdminAcknowledgement.js";

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

  @Column({ type: "date" })
  hire_date!: Date;

  @Column({ type: "text", default: "Employee" })
  role!: string;

  @Column({ type: "text", nullable: true })
  hash!: string;

  @OneToMany(() => PtoEntry, (ptoEntry) => ptoEntry.employee)
  ptoEntries!: PtoEntry[];

  @OneToMany(() => MonthlyHours, (monthlyHours) => monthlyHours.employee)
  monthlyHours!: MonthlyHours[];

  @OneToMany(
    () => Acknowledgement,
    (acknowledgement) => acknowledgement.employee,
  )
  acknowledgements!: Acknowledgement[];

  @OneToMany(() => AdminAcknowledgement, (adminAck) => adminAck.employee)
  acknowledgedByAdmins!: AdminAcknowledgement[];

  @OneToMany(() => AdminAcknowledgement, (adminAck) => adminAck.admin)
  adminAcknowledgements!: AdminAcknowledgement[];
}
