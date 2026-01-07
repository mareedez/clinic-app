import type { AppointmentRepository } from "../../../../ports/repositories/AppointmentRepository.js";
import type { ClinicReportDTO } from "../../../dto/ClinicReportDTO.js";
import { AppointmentStatus } from "../../../../domain/clinic/AppointmentStatusEnum.js";
import { SERVICE_PRICES } from "../../ServiceName.js";
import { AppointmentMapper } from "../AppointmentMapper.js";

export class GetDailyReport {
    constructor(
        private readonly repo: AppointmentRepository,
        private readonly mapper: AppointmentMapper
    ) {}

    async execute(date: Date): Promise<ClinicReportDTO> {
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

        const appointments = await this.repo.list({ scheduledFrom: start, scheduledTo: end });

        const completed = appointments.filter(a => a.status === AppointmentStatus.COMPLETED);
        const noShow = appointments.filter(a => a.status === AppointmentStatus.NO_SHOW);


        const revenue = completed.reduce((sum, a) => {
            const price = SERVICE_PRICES[a.serviceType] || 0;
            return sum + price;
        }, 0);


        const physicianStats = new Map<string, { name: string, completed: number, noShow: number }>();

        for (const a of appointments) {
            const dto = await this.mapper.toDTO(a);
            const name = dto.physician?.displayName || "Unknown Specialist";
            const id = a.physicianId || "unknown";

            const current = physicianStats.get(id) || { name, completed: 0, noShow: 0 };
            if (a.status === AppointmentStatus.COMPLETED) current.completed++;
            if (a.status === AppointmentStatus.NO_SHOW) current.noShow++;
            physicianStats.set(id, current);
        }

        const serviceStats = new Map<string, number>();
        appointments.forEach(a => {
            serviceStats.set(a.serviceType, (serviceStats.get(a.serviceType) || 0) + 1);
        });

        return {
            summary: {
                totalAppointments: appointments.length,
                noShow: noShow.length,
                completed: completed.length,
                revenue
            },
            physicianPerformance: Array.from(physicianStats.values()),
            serviceBreakdown: Array.from(serviceStats.entries()).map(([type, count]) => ({ type, count }))
        };
    }
}