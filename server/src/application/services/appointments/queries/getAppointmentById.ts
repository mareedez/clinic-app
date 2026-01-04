import type { AppointmentRepository } from "../../../../ports/repositories/AppointmentRepository.js";
import type { EntityId } from "../../../../domain/common/id.js";
import { NotFoundError } from "../errors.js";
import { toAppointmentDTO } from "../AppointmentMapper.js";

export interface RequestContext {
    userId: EntityId;
    roles?: string[];
}

export class GetAppointmentById {
    constructor(private readonly repo: AppointmentRepository) {}

    async execute(appointmentId: EntityId, _ctx: RequestContext) {
        const apt = await this.repo.getById(appointmentId);
        if (!apt) throw new NotFoundError("Appointment not found.");
        return toAppointmentDTO(apt);
    }
}
