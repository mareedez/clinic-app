import {Appointment} from "../clinic/Appointment.js";
import {AppointmentStatus} from "../clinic/AppointmentStatusEnum.js";
import {PhysicianUser} from "../users/PhysicianUser.js";
import {CLINIC_CONFIG} from "../../config/clinicConfig.js";
import type {Service, TimeSlot} from "../../shared/types.js";

export class SlotGenerator {

    public static generate(
        physician: PhysicianUser,
        date: Date,
        service: Service,
        existingAppointments: Appointment[]
    ): TimeSlot[] {
        const slots: TimeSlot[] = [];

        const workDate = new Date(date);
        const year = workDate.getUTCFullYear();
        const month = workDate.getUTCMonth();
        const day = workDate.getUTCDate();

        const targetDate = new Date(year, month, day, 0, 0, 0, 0);

        if (!physician.workingDays.includes(targetDate.getDay())) return [];

        const [startH, startM] = physician.workingHoursStart.split(":").map(Number);
        const [endH, endM] = physician.workingHoursEnd.split(":").map(Number);

        const workDayStartMs = new Date(year, month, day, startH || 0, startM || 0, 0, 0).getTime();
        const workDayEndMs = new Date(year, month, day, endH || 0, endM || 0, 0, 0).getTime();

        const activeAppts = existingAppointments.filter(apt => 
            apt.physicianId === physician.id &&
            ![AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW, AppointmentStatus.COMPLETED].includes(apt.status)
        );

        const durationMs = service.durationMinutes * 60000;
        const incrementMs = CLINIC_CONFIG.booking.slotIncrementMs;
        const gapMs = CLINIC_CONFIG.booking.minGapBetweenAppointmentsMs;
        
        let currentStartMs = workDayStartMs;

        while (currentStartMs + durationMs <= workDayEndMs) {
            const currentEndMs = currentStartMs + durationMs;

            const isConflict = activeAppts.some(apt => {
                if (!apt.scheduledStartAt || !apt.scheduledEndAt) return false;
                
                const aptStartMs = apt.scheduledStartAt.getTime();
                const aptEndMs = apt.scheduledEndAt.getTime();

                return currentStartMs < (aptEndMs + gapMs) &&
                    currentEndMs > (aptStartMs - gapMs);
            });

            slots.push({
                startTime: new Date(currentStartMs),
                endTime: new Date(currentEndMs),
                isAvailable: !isConflict,
                physicianId: physician.id
            });

            currentStartMs += incrementMs;
        }

        return slots;
    }
}