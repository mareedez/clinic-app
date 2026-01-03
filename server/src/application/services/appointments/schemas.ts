import { z } from "zod";
import { ServiceType } from "../../../domain/clinic/ServiceEnum.js";

const AppointmentIdSchema = z.string().min(1, "Appointment ID is required");
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
    date: DateSchema,
    serviceType: ServiceTypeSchema,
});

export type ScheduleAppointmentInput = z.infer<typeof ScheduleAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof CancelAppointmentSchema>;
export type StatusUpdateInput = z.infer<typeof AppointmentStatusUpdateSchema>;
export type GetAvailableSlotsInput = z.infer<typeof GetAvailableSlotsSchema>;