import type { AppointmentRepository } from "../../../ports/repositories/AppointmentRepository.js";
import { AppointmentStatusUpdateSchema } from "./schemas.js";
import { NotFoundError } from "./errors.js";
import { AppointmentMapper } from "./AppointmentMapper.js";
import type { RequestContext } from "../../../shared/types.js";

export class CompleteAppointment {
    constructor(
        private readonly repo: AppointmentRepository,
        private readonly mapper: AppointmentMapper
    ) {}

    async execute(input: unknown, _ctx: RequestContext) {
        const { appointmentId, at, expectedUpdatedAt } = AppointmentStatusUpdateSchema.parse(input);
        const apt = await this.repo.getById(appointmentId);
        if (!apt) throw new NotFoundError("Appointment not found.");

        apt.completeAppointment(at ?? new Date());

        const saveOptions = expectedUpdatedAt ? { expectedUpdatedAt } : {};
        await this.repo.save(apt, saveOptions);
        
        return await this.mapper.toDTO(apt);
    }
}
