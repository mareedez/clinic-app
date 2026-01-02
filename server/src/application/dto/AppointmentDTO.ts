import type { EntityId } from "../../domain/common/id.js";
import type { AppointmentStatus } from "../../domain/clinic/AppointmentStatusEnum.js";
import type { ServiceType } from "../../domain/clinic/ServiceEnum.js";

export interface AppointmentDTO {
    id: EntityId;

    patientId: EntityId;
    createdByUserId: EntityId;
    serviceType: ServiceType;

    physicianId: EntityId;
    scheduledStartAt: string; // ISO
    scheduledDurationMinutes: number;
    scheduledEndAt: string; // ISO

    status: AppointmentStatus;

    checkedInAt?: string | undefined;
    startedAt?: string | undefined;
    completedAt?: string | undefined;

    cancelledAt?: string | undefined;
    cancelReason?: string | undefined;

    noShowAt?: string | undefined;

    createdAt: string;
    updatedAt: string;
}
