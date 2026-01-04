import type { AppointmentRepository } from "../../../../ports/repositories/AppointmentRepository.js";
import { toAppointmentDTO } from "../AppointmentMapper.js";
import type {RequestContext} from "../../../../shared/types.js";

export interface ListAppointmentsFilter {
    patientId?: string;
    physicianId?: string;
    status?: any;
}

export class ListAppointments {
    constructor(private readonly repo: AppointmentRepository) {}
    async execute(filter: ListAppointmentsFilter, ctx: RequestContext) {
        const effectiveFilter = ctx.roles.includes("PATIENT")
            ? { ...filter, patientId: ctx.userId } 
            : filter;
        const appointments = await this.repo.list(effectiveFilter);
        return appointments.map(toAppointmentDTO);
    }
}
