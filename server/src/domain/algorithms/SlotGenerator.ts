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

        const duration = service.durationMinutes;

        while (currentTime.getTime() + duration * 60000 <= endTime.getTime()) {
            const slotEnd = new Date(currentTime.getTime() + duration * 60000);

            const isConflict = activeAppts.some(apt => {
                const aptStart = apt.scheduledStartAt!.getTime();
                const aptEnd = apt.scheduledEndAt!.getTime();

                const slotStartWithGap = currentTime.getTime() - MIN_GAP * 60000;
                const slotEndWithGap = slotEnd.getTime() + MIN_GAP * 60000;

                return slotStartWithGap < aptEnd && slotEndWithGap > aptStart;
            });

            slots.push({
                startTime: new Date(currentTime),
                endTime: slotEnd,
                isAvailable: !isConflict
            });

            currentTime = new Date(currentTime.getTime() + APPOINTMENT_INCREMENT * 60000);
        }

        return slots;
    }
}