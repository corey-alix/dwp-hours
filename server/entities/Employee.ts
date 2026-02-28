import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { PtoEntry } from "./PtoEntry.js";
import { MonthlyHours } from "./MonthlyHours.js";
import { Acknowledgement } from "./Acknowledgement.js";
import { AdminAcknowledgement } from "./AdminAcknowledgement.js";
import { PTO_EARNING_SCHEDULE } from "../../shared/businessRules.js";

@Entity("employees")
export class Employee {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text", unique: true })
  identifier!: string;

  @Column({
    type: "real",
    default: PTO_EARNING_SCHEDULE[0].dailyRate,
  })
  pto_rate!: number;

  @Column({ type: "real", default: 0 })
  carryover_hours!: number;

  @Column({ type: "text" })
  hire_date!: string;

  @Column({ type: "text", default: "Employee" })
  role!: string;

  @Column({ type: "text", nullable: true })
  hash!: string;

  @OneToMany(() => PtoEntry, (ptoEntry) => ptoEntry.employee)
  ptoEntries!: PtoEntry[];

  @OneToMany(() => PtoEntry, (ptoEntry) => ptoEntry.approvedBy)
  approvedPtoEntries!: PtoEntry[];

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
