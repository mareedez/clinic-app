import type { AppointmentRepository } from "../../../ports/repositories/AppointmentRepository.js";
import { Appointment } from "../../../domain/clinic/Appointment.js";
import { AppointmentPolicy } from "../../../domain/policies/AppointmentPolicy.js";
import { ScheduleAppointmentSchema } from "./schemas.js";
import { ValidationError } from "./errors.js";
import { toAppointmentDTO } from "./AppointmentMapper.js";
import type {RequestContext} from "../../../shared/types.js";
import { addMinutes } from "../../../domain/common/validateHelper.js";


export class CreateScheduledAppointment {
    constructor(private readonly repo: AppointmentRepository) {}

    async execute(input: unknown, ctx: RequestContext) {
        const validated = ScheduleAppointmentSchema.parse(input);
        const start = validated.scheduledStartAt;
        const end = addMinutes(start, validated.scheduledDurationMinutes);

        const drApts = await this.repo.getByPhysicianAndDate(validated.physicianId, start);
        if (AppointmentPolicy.hasConflict(start, end, drApts)) {
            throw new ValidationError("Physician is already booked at this time.");
        }
        const patientApts = await this.repo.list({ patientId: validated.patientId });
        if (AppointmentPolicy.hasConflict(start, end, patientApts)) {
            throw new ValidationError("Patient has a conflicting appointment.");
        }

        const apt = Appointment.createScheduled({
            patientId: validated.patientId,
            physicianId: validated.physicianId,
            serviceType: validated.serviceType,
            scheduledStartAt: validated.scheduledStartAt,
            scheduledDurationMinutes: validated.scheduledDurationMinutes,
            notes: validated.notes,
            createdByUserId: ctx.userId,
        });

        await this.repo.save(apt);
        return toAppointmentDTO(apt);
    }
}
