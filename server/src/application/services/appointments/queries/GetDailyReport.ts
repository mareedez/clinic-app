import type {AppointmentRepository} from "../../../../ports/repositories/AppointmentRepository.js";
import { AppointmentStatus } from "../../../../domain/clinic/AppointmentStatusEnum.js";
import { AppointmentMapper } from "../AppointmentMapper.js";
import type {ClinicReportDTO} from "../../../dto/ClinicReportDTO.js";

export class GetDailyReport {
    constructor(
        private readonly repo: AppointmentRepository,
        private readonly mapper: AppointmentMapper
    ) {}

    async execute(date: Date = new Date()): Promise<ClinicReportDTO> {
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

        const appointments = await this.repo.list({ scheduledFrom: start, scheduledTo: end });

        const completed = appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
        const cancelled = appointments.filter(a => a.status === AppointmentStatus.CANCELLED).length;
        const noShow = appointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
        
        const total = appointments.length;
        const utilization = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";

        return {
            generatedAt: new Date().toISOString(),
            period: start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            summary: {
                totalAppointments: total,
                completed,
                cancelled,
                noShow,
                utilizationRate: `${utilization}%`
            },
            details: await Promise.all(appointments.map(a => this.mapper.toDTO(a)))
        };
    }
}