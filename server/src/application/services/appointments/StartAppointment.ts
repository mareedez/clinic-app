import type { AppointmentRepository } from "../../../ports/repositories/AppointmentRepository.js";
import { AppointmentStatusUpdateSchema } from "./schemas.js";
import { NotFoundError } from "./errors.js";
import { AppointmentMapper } from "./AppointmentMapper.js";
import type { RequestContext } from "../../../shared/types.js";

export class StartAppointment {
    constructor(
        private readonly repo: AppointmentRepository,
        private readonly mapper: AppointmentMapper
    ) {}

    async execute(input: unknown, _ctx: RequestContext) {
        const validated = AppointmentStatusUpdateSchema.parse(input);
        const apt = await this.repo.getById(validated.appointmentId);
        if (!apt) throw new NotFoundError("Appointment not found.");

        apt.markInProgress(validated.at ?? new Date());

        const saveOptions = validated.expectedUpdatedAt 
            ? { expectedUpdatedAt: validated.expectedUpdatedAt } 
            : {};

        await this.repo.save(apt, saveOptions);
        
        return await this.mapper.toDTO(apt);
    }
}