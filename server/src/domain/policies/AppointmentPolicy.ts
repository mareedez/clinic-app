import { Appointment } from "../clinic/Appointment.js";
import { AppointmentStatus } from "../clinic/AppointmentStatusEnum.js";

// Gap between appointments, ms
const BUFFER = 10 * 60000;
// Cancel appointment only allowed 24h in advance, ms
const CANCEL_LIMIT = 24 * 60 * 60 * 1000;

export class AppointmentPolicy {
    public static hasPatientConflict(
        newStart: Date,
        newEnd: Date,
        patientAppointments: Appointment[]
    ): boolean {
        return patientAppointments.some(apt => {
            if (apt.status === AppointmentStatus.CANCELLED) return false;
            const aptStart = apt.scheduledStartAt!.getTime();
            const aptEnd = apt.scheduledEndAt!.getTime();

            return newStart.getTime() < aptEnd + BUFFER &&
                newEnd.getTime() > aptStart - BUFFER;
        });
    }


    public static canCancel(apt: Appointment): boolean {
        const now = new Date();
        const limit = new Date(apt.scheduledStartAt!.getTime() - CANCEL_LIMIT);
        return now < limit;
    }
}