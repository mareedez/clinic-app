import { CancelAppointmentSchema } from "./schemas.js";
import { ForbiddenError, NotFoundError } from "./errors.js";
import { AppointmentPolicy } from "../../../domain/policies/AppointmentPolicy.js";
import type { AppointmentRepository } from "../../../ports/repositories/AppointmentRepository.js";
import { AppointmentMapper } from "./AppointmentMapper.js";
import type { RequestContext } from "../../../shared/types.js";

export class CancelScheduledAppointment {
    constructor(
        private readonly repo: AppointmentRepository,
        private readonly mapper: AppointmentMapper
    ) {}

    async execute(input: unknown, ctx: RequestContext) {
        const validated = CancelAppointmentSchema.parse(input);
        const apt = await this.repo.getById(validated.appointmentId);
        if (!apt) throw new NotFoundError("Appointment not found.");

        if (!AppointmentPolicy.canCancel(apt, ctx.roles)) {
            throw new ForbiddenError("You cannot cancel this appointment.");
        }

        apt.cancelAppointment(validated.reason, validated.at ?? new Date());

        const saveOptions = validated.expectedUpdatedAt ? { expectedUpdatedAt: validated.expectedUpdatedAt } : {};
        await this.repo.save(apt, saveOptions);

        return await this.mapper.toDTO(apt);
    }
}
