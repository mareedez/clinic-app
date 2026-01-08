export interface TimeSlotDTO {
    startTime: string; // ISO
    endTime: string;   // ISO
    isAvailable: boolean;
    physicianId: string;
}