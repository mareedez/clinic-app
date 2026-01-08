import type {EntityId} from "./id.js";
import { UserRole } from "./UserEnum.js";

export interface UserDTO {
    id: EntityId;
    email: string;
    role: UserRole;
    isActive: boolean;
    lastLoginAt?: string | undefined; // ISO
    createdAt: string;
    updatedAt: string;
    displayName: string;
}

export interface PhysicianDTO extends UserDTO {
    role: UserRole.PHYSICIAN;
    specialization?: string | undefined;
    clinicPhysicianId?: string | undefined;
    workingHoursStart: string;
    workingHoursEnd: string;
    workingDays: number[];
}

export interface PatientDTO extends UserDTO {
    role: UserRole.PATIENT;
    clinicPatientId?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
}

export interface FrontDeskDTO extends UserDTO {
    role: UserRole.FRONT_DESK;
    clinicStaffId?: string | undefined;
}