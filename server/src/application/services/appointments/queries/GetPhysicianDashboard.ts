import type { AppointmentRepository } from "../../../../ports/repositories/AppointmentRepository.js";
import { AppointmentStatus } from "../../../../domain/clinic/AppointmentStatusEnum.js";
import { AppointmentMapper } from "../AppointmentMapper.js";
import type { PhysicianDashboardDTO } from "../../../dto/PhysicianDashboardDTO.js";
import type { RequestContext } from "../../../../shared/types.js";

export class GetPhysicianDashboard {
    constructor(
        private readonly repo: AppointmentRepository,
        private readonly mapper: AppointmentMapper
    ) {}

    async execute(ctx: RequestContext): Promise<PhysicianDashboardDTO> {
        const physicianId = ctx.userId;
        const allApts = await this.repo.getByPhysician(physicianId);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const todayApts = allApts
            .filter(a => {
                if (!a.scheduledStartAt) return false;
                return a.scheduledStartAt >= startOfToday && a.scheduledStartAt <= endOfToday && a.status !== AppointmentStatus.CANCELLED;
            })
            .sort((a, b) => (a.scheduledStartAt?.getTime() ?? 0) - (b.scheduledStartAt?.getTime() ?? 0));

        const upcomingApts = allApts
            .filter(a => {
                if (!a.scheduledStartAt) return false;
                return a.scheduledStartAt > endOfToday && a.status === AppointmentStatus.SCHEDULED;
            })
            .sort((a, b) => (a.scheduledStartAt?.getTime() ?? 0) - (b.scheduledStartAt?.getTime() ?? 0))
            .slice(0, 5);

        return {
            stats: {
                totalToday: todayApts.length,
                inProgress: todayApts.filter(a => a.status === AppointmentStatus.IN_PROGRESS).length,
                completedToday: todayApts.filter(a => a.status === AppointmentStatus.COMPLETED).length
            },
            todayAppointments: await Promise.all(todayApts.map(a => this.mapper.toDTO(a))),
            upcomingAppointments: await Promise.all(upcomingApts.map(a => this.mapper.toDTO(a)))
        };
    }
}