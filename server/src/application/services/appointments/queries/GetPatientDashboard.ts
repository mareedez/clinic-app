import type { AppointmentRepository } from "../../../../ports/repositories/AppointmentRepository.js";
import { AppointmentStatus } from "../../../../domain/clinic/AppointmentStatusEnum.js";
import { AppointmentMapper } from "../AppointmentMapper.js";
import type { PatientDashboardDTO } from "../../../dto/PatientDashboardDTO.js";
import type { RequestContext } from "../../../../shared/types.js";

export class GetPatientDashboard {
    constructor(
        private readonly repo: AppointmentRepository,
        private readonly mapper: AppointmentMapper
    ) {}

    async execute(ctx: RequestContext): Promise<PatientDashboardDTO> {
        const patientId = ctx.userId;
        const allApts = await this.repo.list({ patientId });
        const now = new Date();

        const upcoming = allApts
            .filter(a => {
                const isFuture = a.scheduledStartAt ? a.scheduledStartAt > now : true;
                return isFuture && (a.status === AppointmentStatus.SCHEDULED || a.status === AppointmentStatus.CHECKED_IN);
            })
            .sort((a, b) => (a.scheduledStartAt?.getTime() ?? 0) - (b.scheduledStartAt?.getTime() ?? 0));

        const past = allApts
            .filter(a => {
                const isPast = a.scheduledStartAt ? a.scheduledStartAt <= now : false;
                const isFinished = [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW].includes(a.status);
                return isPast || isFinished;
            })
            .sort((a, b) => (b.scheduledStartAt?.getTime() ?? 0) - (a.scheduledStartAt?.getTime() ?? 0));

        return {
            upcoming: await Promise.all(upcoming.map(a => this.mapper.toDTO(a))),
            past: await Promise.all(past.map(a => this.mapper.toDTO(a)))
        };
    }
}