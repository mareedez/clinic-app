import {Appointment} from "../clinic/Appointment.js";
import {AppointmentStatus} from "../clinic/AppointmentStatusEnum.js";

// Buffer gap between appointments, ms (10 minutes)
const BUFFER = 10 * 60000;
// Cancellation limit for patients, ms (24 hours)
const CANCEL_LIMIT = 24 * 60 * 60 * 1000;

export class AppointmentPolicy {

    public static hasConflict(
        newStart: Date,
        newEnd: Date,
        existingAppointments: Appointment[]
    ): boolean {
        return existingAppointments.some(apt => {

            const isInactive = [
                AppointmentStatus.CANCELLED, 
                AppointmentStatus.NO_SHOW, 
                AppointmentStatus.COMPLETED
            ].includes(apt.status);

            if (isInactive) return false;

            const aptStart = apt.scheduledStartAt!.getTime();
            const aptEnd = apt.scheduledEndAt!.getTime();

            return newStart.getTime() < (aptEnd + BUFFER) &&
                   newEnd.getTime() > (aptStart - BUFFER);
        });
    }

    public static canCancel(apt: Appointment, roles: string | string[]): boolean {

        if (apt.status !== AppointmentStatus.SCHEDULED) return false;
        const rolesArray = Array.isArray(roles) ? roles : [roles];
        const normalizedRoles = rolesArray.map(r => r.toLowerCase());
        const isStaff = normalizedRoles.includes("physician") ||
            normalizedRoles.includes("front_desk");

        if (isStaff) return true;
        const now = new Date();
        if (!apt.scheduledStartAt) return true;

        const limitTime = apt.scheduledStartAt.getTime() - CANCEL_LIMIT;

        return now.getTime() < limitTime;
    }
}