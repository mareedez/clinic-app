import type {AppointmentDTO} from "./AppointmentDTO.js";

export interface ClinicReportDTO {
    generatedAt: string;
    period: string;
    summary: {
        totalAppointments: number;
        completed: number;
        cancelled: number;
        noShow: number;
        utilizationRate: string;
    };
    details: AppointmentDTO[];
}