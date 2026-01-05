import type { AppointmentRepository } from "../../../ports/repositories/AppointmentRepository.js";
import { Appointment } from "../../../domain/clinic/Appointment.js";
import { AppointmentPolicy } from "../../../domain/policies/AppointmentPolicy.js";
import { ScheduleAppointmentSchema } from "./schemas.js";
import { ValidationError } from "./errors.js";
import { AppointmentMapper } from "./AppointmentMapper.js";
import type { RequestContext } from "../../../shared/types.js";
import { addMinutes } from "../../../domain/common/validateHelper.js";

export class CreateScheduledAppointment {
    constructor(
        private readonly repo: AppointmentRepository,
        private readonly mapper: AppointmentMapper
    ) {}

    async execute(input: unknown, ctx: RequestContext) {
        const validated = ScheduleAppointmentSchema.parse(input);
        const start = validated.scheduledStartAt;
        const end = addMinutes(start, validated.scheduledDurationMinutes);

        const drApts = await this.repo.getByPhysicianAndDate(validated.physicianId, start);
        if (AppointmentPolicy.hasConflict(start, end, drApts)) {
            throw new ValidationError("The physician is already booked for this time slot.");
        }

        const patientApts = await this.repo.list({ 
            patientId: validated.patientId,
            scheduledFrom: new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0),
            scheduledTo: new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59)
        });
        
        if (AppointmentPolicy.hasConflict(start, end, patientApts)) {
            throw new ValidationError("You already have a conflicting appointment at this time.");
        }

        const props: any = {
            patientId: validated.patientId,
            physicianId: validated.physicianId,
            serviceType: validated.serviceType,
            scheduledStartAt: validated.scheduledStartAt,
            scheduledDurationMinutes: validated.scheduledDurationMinutes,
            createdByUserId: ctx.userId,
        };

        if (validated.notes !== undefined) {
            props.notes = validated.notes;
        }

        const apt = Appointment.createScheduled(props);
        await this.repo.save(apt);

        return await this.mapper.toDTO(apt);
    }
}
