import type { AppointmentRepository } from "../../../../ports/repositories/AppointmentRepository.js";
import { AppointmentMapper } from "../AppointmentMapper.js";
import { NotFoundError } from "../errors.js";
import type { RequestContext } from "../../../../shared/types.js";

export class GetAppointmentById {
    constructor(
        private readonly repo: AppointmentRepository,
        private readonly mapper: AppointmentMapper
    ) {}

    async execute(id: string, _ctx: RequestContext) {
        const apt = await this.repo.getById(id);
        if (!apt) throw new NotFoundError("Appointment not found.");
        return await this.mapper.toDTO(apt);
    }
}
