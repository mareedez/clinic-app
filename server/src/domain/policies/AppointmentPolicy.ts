import {Appointment} from "../clinic/Appointment.js";
import {AppointmentStatus} from "../clinic/AppointmentStatusEnum.js";

// Gap between appointments, ms
const BUFFER = 10 * 60000;
// Cancel appointment only allowed 24h in advance, ms
const CANCEL_LIMIT = 24 * 60 * 60 * 1000;

export class AppointmentPolicy {

    public static hasConflict(
        newStart: Date,
        newEnd: Date,
        existingAppointments: Appointment[]
    ): boolean {
        return existingAppointments.some(apt => {
            if (apt.status === AppointmentStatus.CANCELLED || apt.status === AppointmentStatus.NO_SHOW || apt.status === AppointmentStatus.IN_PROGRESS) {
                return false;
            }
            const aptStart = apt.scheduledStartAt!.getTime();
            const aptEnd = apt.scheduledEndAt!.getTime();
            return newStart.getTime() < aptEnd + BUFFER &&
                   newEnd.getTime() > aptStart - BUFFER;
        });
    }


    public static canCancel(apt: Appointment, roles: string[]): boolean {
        if (apt.status !== AppointmentStatus.SCHEDULED) return false;
        const isStaff = roles.includes("PHYSICIAN") || roles.includes("FRONT_DESK");
        if (isStaff) return true;
        const now = new Date();
        const limit = new Date(apt.scheduledStartAt!.getTime() - CANCEL_LIMIT);
        return now < limit;
    }
}