import type { EntityId } from "../../domain/common/id.js";
import { Appointment } from "../../domain/clinic/Appointment.js";
import { AppointmentStatus } from "../../domain/clinic/AppointmentStatusEnum.js";

export interface AppointmentListFilter {
    patientId?: EntityId;
    physicianId?: EntityId;
    status?: AppointmentStatus;
    scheduledFrom?: Date;
    scheduledTo?: Date;
}

export interface AppointmentRepository {
    getById(id: EntityId): Promise<Appointment | undefined>;
    getByPhysician(physicianId: EntityId): Promise<Appointment[]>;
    getByPhysicianAndDate(physicianId: EntityId, date: Date): Promise<Appointment[]>;
    list(filter?: AppointmentListFilter): Promise<Appointment[]>;
    save(appointment: Appointment, options?: { expectedUpdatedAt?: Date }): Promise<void>;
    findOverdueScheduled(threshold: Date): Promise<Appointment[]>;
}

