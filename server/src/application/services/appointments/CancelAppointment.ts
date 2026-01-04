import { CancelAppointmentSchema } from "./schemas.js";
import { ForbiddenError, NotFoundError } from "./errors.js";
import { AppointmentPolicy } from "../../../domain/policies/AppointmentPolicy.js";
import type { AppointmentRepository } from "../../../ports/repositories/AppointmentRepository.js";
import { toAppointmentDTO } from "./AppointmentMapper.js";
import type {RequestContext} from "../../../shared/types.js";

export class CancelScheduledAppointment {
    constructor(private readonly repo: AppointmentRepository) {}

    async execute(input: unknown, ctx: RequestContext) {
        const validated = CancelAppointmentSchema.parse(input);
        const apt = await this.repo.getById(validated.appointmentId);
        if (!apt) throw new NotFoundError("Appointment not found.");

        if (!AppointmentPolicy.canCancel(apt, ctx.roles)) {
            throw new ForbiddenError("You cannot cancel this appointment at this time.");
        }
        apt.cancelAppointment(validated.reason, validated.at ?? new Date());
        await this.repo.save(apt, { expectedUpdatedAt: validated.expectedUpdatedAt });

        return toAppointmentDTO(apt);
    }
}
