import type {TimeSlot} from "../../shared/types.js";
import type {TimeSlotDTO} from "../../application/dto/TimeSlotDTO.js";

export function toTimeSlotDTO(slot: TimeSlot, physicianId: string): TimeSlotDTO {
    return {
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        isAvailable: slot.isAvailable,
        physicianId: physicianId
    };
}