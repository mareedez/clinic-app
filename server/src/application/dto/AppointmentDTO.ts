import type { EntityId } from "../../domain/common/id.js";
import type { AppointmentStatus } from "../../domain/clinic/AppointmentStatusEnum.js";
import type { ServiceType } from "../../domain/clinic/ServiceEnum.js";


export interface AppointmentDTO {
    id: EntityId;
    status: AppointmentStatus;

    patient: {
        id: EntityId;
        displayName: string;
    };

    physician?: {
        id: EntityId;
        displayName: string;
    } | undefined;

    service: {
        id: EntityId;
        type: ServiceType;
        displayName: string;
        price: number;
    };

    schedule: {
        startAt?: string | undefined; // ISO String
        endAt?: string | undefined;   // ISO String
        durationMinutes?: number | undefined;
    };

    lifeCycle: {
        createdAt: string; // ISO String
        createdBy: EntityId;
        updatedAt: string; // ISO String
        checkedInAt?: string | undefined;
        startedAt?: string | undefined;
        completedAt?: string | undefined;
        cancelledAt?: string | undefined;
        cancelReason?: string | undefined;
        noShowAt?: string | undefined;
    };

    notes?: string | undefined;
}
