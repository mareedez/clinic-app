import { Appointment } from "../clinic/Appointment.js";
import { AppointmentStatus } from "../clinic/AppointmentStatusEnum.js";
import { PhysicianUser } from "../users/PhysicianUser.js";
import type { Service, TimeSlot } from "../../shared/types.js";


const APPOINTMENT_INCREMENT = 10;
const MIN_GAP = 10;


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

        const [startH, startM] = physician.workingHoursStart.split(":").map(Number) as number[];
        const [endH, endM] = physician.workingHoursEnd.split(":").map(Number) as number[];
        const workDayStartMs = new Date(workDate).setHours(startH!, startM!, 0, 0);
        const workDayEndMs = new Date(workDate).setHours(endH!, endM!, 0, 0);
        const activeAppts = existingAppointments.filter(apt => 
            apt.physicianId === physician.id &&
            ![AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW, AppointmentStatus.COMPLETED].includes(apt.status)
        );

        const durationMs = service.durationMinutes * 60000;
        const incrementMs = APPOINTMENT_INCREMENT * 60000;
        const gapMs = MIN_GAP * 60000;
        let currentStartMs = workDayStartMs;

        while (currentStartMs + durationMs <= workDayEndMs) {
            const currentEndMs = currentStartMs + durationMs;
            const isConflict = activeAppts.some(apt => {
                const aptStartMs = new Date(apt.scheduledStartAt!).getTime();
                const aptEndMs = new Date(apt.scheduledEndAt!).getTime();

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