import type { AppointmentRepository, AppointmentListFilter } from "../../../../ports/repositories/AppointmentRepository.js";
import { AppointmentMapper } from "../AppointmentMapper.js";
import type { RequestContext } from "../../../../shared/types.js";

export class ListAppointments {
    constructor(
        private readonly repo: AppointmentRepository,
        private readonly mapper: AppointmentMapper
    ) {}

    async execute(filter: AppointmentListFilter, ctx: RequestContext) {
        const isPatient = ctx.roles.includes("patient");
        const effectiveFilter = isPatient ? { ...filter, patientId: ctx.userId } : filter;
        const appointments = await this.repo.list(effectiveFilter);

        return await Promise.all(appointments.map(a => this.mapper.toDTO(a)));
    }
}
