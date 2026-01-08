import type {AppointmentDTO} from "./AppointmentDTO.js";

export interface PatientDashboardDTO {

    upcoming: AppointmentDTO[];
    past: AppointmentDTO[];
}