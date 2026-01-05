import type {AppointmentDTO} from "./AppointmentDTO.js";

export interface PhysicianStatusDTO {
    id: string;
    displayName: string;
    status: "AVAILABLE" | "BUSY";
    activeAppointment?: AppointmentDTO | undefined;
    estimatedReadyAt?: string | undefined; // ISO
}

export interface FrontDeskDashboardDTO {
    stats: {
        totalToday: number;
        waitingPatients: number;
        availableDoctors: number;
    };
    physicians: PhysicianStatusDTO[];
    agenda: AppointmentDTO[];
}