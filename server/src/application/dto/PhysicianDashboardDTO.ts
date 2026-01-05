import type { AppointmentDTO } from "./AppointmentDTO.js";

export interface PhysicianDashboardDTO {
    readonly stats: {
        readonly totalToday: number;
        readonly inProgress: number;
        readonly completedToday: number;
    };
    readonly todayAppointments: AppointmentDTO[];
    readonly upcomingAppointments: AppointmentDTO[];
}