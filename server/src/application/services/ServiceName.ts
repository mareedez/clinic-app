import { ServiceType } from "../../domain/clinic/ServiceEnum.js";

export const SERVICE_DISPLAY_NAMES: Record<ServiceType, string> = {
    NEW_PATIENT_VISIT: "New Patient Consultation",
    FOLLOW_UP_VISIT: "Follow-up Visit",
    ANNUAL_PHYSICAL: "Annual Physical Exam",
    URGENT_SAME_DAY: "Urgent Same-day Visit",
    SICK_VISIT: "Sick Visit",
    VACCINATION: "Vaccination",
    LAB_DRAW: "Lab draw",
    PROCEDURE_MINOR: "Minor procedure",
    MEDICATION_REFILL: "Medication refill",
    TELEHEALTH_VISIT: "Telehealth visit"
};

export const SERVICE_DURATION_MAP: Record<ServiceType, number> = {
    NEW_PATIENT_VISIT: 30,
    FOLLOW_UP_VISIT: 20,
    ANNUAL_PHYSICAL: 60,
    URGENT_SAME_DAY: 20,
    SICK_VISIT: 20,
    VACCINATION: 15,
    LAB_DRAW: 15,
    PROCEDURE_MINOR: 45,
    MEDICATION_REFILL: 10,
    TELEHEALTH_VISIT: 20,
};