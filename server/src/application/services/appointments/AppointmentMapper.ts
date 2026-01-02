import type { Appointment } from "../../../domain/clinic/Appointment.js";
import type { AppointmentDTO } from "../../dto/AppointmentDTO.js";

export function toAppointmentDTO(a: Appointment): AppointmentDTO {
    const scheduledStartAt = a.scheduledStartAt!;
    const scheduledEndAt = a.scheduledEndAt!;
    const physicianId = a.physicianId!;
    const duration = a.scheduledDurationMinutes!;

    return {
        id: a.id,

        patientId: a.patientId,
        createdByUserId: a.createdByUserId,
        serviceType: a.serviceType,

        physicianId,
        scheduledStartAt: scheduledStartAt.toISOString(),
        scheduledDurationMinutes: duration,
        scheduledEndAt: scheduledEndAt.toISOString(),

        status: a.status,

        checkedInAt: a.checkedInAt?.toISOString(),
        startedAt: a.startedAt?.toISOString(),
        completedAt: a.completedAt?.toISOString(),

        cancelledAt: a.cancelledAt?.toISOString(),
        cancelReason: a.cancelReason,

        noShowAt: a.noShowAt?.toISOString(),

        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
    };
}
