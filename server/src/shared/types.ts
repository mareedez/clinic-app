import type {EntityId} from "../domain/common/id.js";

export interface Service {
    id: string;
    name: string;
    description?: string;
    durationMinutes: number;
    price?: number;
    isActive: boolean;
}

/* Time Slot */
export interface TimeSlot {
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
    physicianId?: string;
}

export interface RequestContext {
    readonly userId: EntityId;
    readonly roles: string[];
}

