import { z } from "zod";
import { ServiceType } from "../../../domain/clinic/ServiceEnum.js";
import { CLINIC_CONFIG } from "../../../config/clinicConfig.js";

const AppointmentIdSchema = z.string().min(1, "Appointment ID is required");


const ClinicLocalDateSchema = z.union([z.date(), z.string()]).transform((value) => {
    let dateStr: string;
    if (value instanceof Date) {
        const utcDate = value;
        const offsetMs = CLINIC_CONFIG.timezone.utcOffsetHours * 60 * 60 * 1000;
        const clinicDate = new Date(utcDate.getTime() + offsetMs);
        const year = clinicDate.getUTCFullYear();
        const month = String(clinicDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(clinicDate.getUTCDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
    } else {
        dateStr = value;
    }


    const [year, month, day] = dateStr.split('-').map(Number);
    if (year === undefined || month === undefined || day === undefined) {
        throw new Error("Invalid date components");
    }

    const clinicMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const offsetMs = CLINIC_CONFIG.timezone.utcOffsetHours * 60 * 60 * 1000;
    return new Date(clinicMidnight.getTime() - offsetMs);
});

const DateSchema = z.coerce.date()
const ConcurrencySchema = z.object({
    expectedUpdatedAt: DateSchema.optional(),
});

const ServiceTypeValues = Object.values(ServiceType) as string[];

const ServiceTypeSchema = z
    .string()
    .min(1, "Service type is required")
    .refine((v) => ServiceTypeValues.includes(v as ServiceType), {
        message: "Invalid service type selected" 
    })
    .transform((v) => v as ServiceType);

export const ScheduleAppointmentSchema = z.object({
    patientId: z.string().min(1, "Patient ID is required"),
    physicianId: z.string().min(1, "Physician ID is required"),
    serviceType: ServiceTypeSchema,
    scheduledStartAt: DateSchema,
    scheduledDurationMinutes: z.coerce.number().int().positive("Duration must be a positive integer"),
    notes: z.string().optional(),
});

export const CancelAppointmentSchema = z.object({
    appointmentId: AppointmentIdSchema,
    reason: z.string().trim().min(5, "Reason must be at least 5 characters long"),
    at: DateSchema.optional(),
}).merge(ConcurrencySchema);

export const AppointmentStatusUpdateSchema = z.object({
    appointmentId: AppointmentIdSchema,
    at: DateSchema.optional(),
}).merge(ConcurrencySchema);

export const GetAvailableSlotsSchema = z.object({
    physicianId: z.string().min(1),
    date: ClinicLocalDateSchema,
    serviceType: ServiceTypeSchema,
});

export type ScheduleAppointmentInput = z.infer<typeof ScheduleAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof CancelAppointmentSchema>;
export type StatusUpdateInput = z.infer<typeof AppointmentStatusUpdateSchema>;
export type GetAvailableSlotsInput = z.infer<typeof GetAvailableSlotsSchema>;
