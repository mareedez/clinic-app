import { Appointment } from "../clinic/Appointment.js";
import { AppointmentStatus } from "../clinic/AppointmentStatusEnum.js";
import { PhysicianUser } from "../users/PhysicianUser.js";
import { CLINIC_CONFIG } from "../../config/clinicConfig.js";
import type { Service, TimeSlot } from "../../shared/types.js";
import { createClinicLocalDate, convertUtcToClinicLocal } from "../common/datetimeUtils.js";

export class SlotGenerator {
    public static generate(
        physician: PhysicianUser,
        date: Date,
        service: Service,
        existingAppointments: Appointment[]
    ): TimeSlot[] {
        const slots: TimeSlot[] = [];


        const clinicLocalDate = convertUtcToClinicLocal(date, CLINIC_CONFIG.timezone.utcOffsetHours);
        const year = clinicLocalDate.getUTCFullYear();
        const month = clinicLocalDate.getUTCMonth();
        const day = clinicLocalDate.getUTCDate();

        const dayOfWeek = clinicLocalDate.getUTCDay();
        if (!physician.workingDays.includes(dayOfWeek)) return [];

        const [startH, startM] = physician.workingHoursStart.split(":").map(Number);
        const [endH, endM] = physician.workingHoursEnd.split(":").map(Number);

        const workDayStartMs = createClinicLocalDate(year, month, day, startH || 0, startM || 0, CLINIC_CONFIG.timezone.utcOffsetHours).getTime();
        const workDayEndMs = createClinicLocalDate(year, month, day, endH || 0, endM || 0, CLINIC_CONFIG.timezone.utcOffsetHours).getTime();

        const activeAppts = existingAppointments.filter(apt =>
            apt.status !== AppointmentStatus.CANCELLED &&
            apt.status !== AppointmentStatus.NO_SHOW
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
