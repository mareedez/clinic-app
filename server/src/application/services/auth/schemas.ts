import { z } from "zod";

export const LoginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const RegisterPatientSchema = z.object({
    email: z.string().email("Invalid email format"),
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(), // YYYY-MM-DD
});

export type RegisterPatientInput = z.infer<typeof RegisterPatientSchema>;