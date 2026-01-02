import { Appointment } from "../clinic/Appointment.js";
import { AppointmentStatus } from "../clinic/AppointmentStatusEnum.js";
import { PhysicianUser } from "../users/PhysicianUser.js";
import type { Service, TimeSlot } from "../../shared/types.js";


const APPOINTMENT_INCREMENT = 10;
const MIN_GAP = 10; //Appointment Gap


export class SlotGenerator {
    public static generate(
        physician: PhysicianUser,
        date: Date,
        service: Service,
        existingAppointments: Appointment[]
    ): TimeSlot[] {
        const slots: TimeSlot[] = [];
        const workDate = new Date(date);
        workDate.setHours(0, 0, 0, 0);

        if (!physician.workingDays.includes(workDate.getDay())) return [];
        const [startH, startM] = physician.workingHoursStart.split(":").map(Number);
        const [endH, endM] = physician.workingHoursEnd.split(":").map(Number);
        if (startH === undefined || endH === undefined) return [];

        let currentTime = new Date(workDate);
        currentTime.setHours(startH, startM, 0, 0);

        const endTime = new Date(workDate);
        endTime.setHours(endH, endM, 0, 0);

        const activeAppts = existingAppointments.filter(apt =>
            ![AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW, AppointmentStatus.COMPLETED].includes(apt.status)
        );

        const durationMs = service.durationMinutes * 60000;
        const incrementMs = APPOINTMENT_INCREMENT * 60000;
        const minGapMs = MIN_GAP * 60000;
        if (incrementMs <= 0) throw new Error("Invalid increment configuration");

        while (currentTime.getTime() + durationMs <= endTime.getTime()) {
            const slotEnd = new Date(currentTime.getTime() + durationMs);

            const isConflict = activeAppts.some(apt => {
                const aptStart = apt.scheduledStartAt!.getTime();
                const aptEnd = apt.scheduledEndAt!.getTime();

                const slotStartWithGap = currentTime.getTime() - minGapMs;
                const slotEndWithGap = slotEnd.getTime() + minGapMs;

                return slotStartWithGap < aptEnd && slotEndWithGap > aptStart;
            });

            slots.push({
                startTime: new Date(currentTime),
                endTime: slotEnd,
                isAvailable: !isConflict,
                physicianId: physician.id
            });

            currentTime = new Date(currentTime.getTime() + incrementMs);
        }

        return slots;
    }
}