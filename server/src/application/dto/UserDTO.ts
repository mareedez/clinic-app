import type {EntityId} from "../../domain/common/id.js";
import { UserRole } from "../../domain/users/UserEnum.js";

export interface UserDTO {
    id: EntityId;
    email: string;
    role: UserRole;
    isActive: boolean;
    lastLoginAt?: string; // ISO
    createdAt: string;
    updatedAt: string;
    displayName: string;
}

export interface PhysicianDTO extends UserDTO {
    role: UserRole.PHYSICIAN;
    specialization?: string;
    clinicPhysicianId?: string;
    workingHoursStart: string;
    workingHoursEnd: string;
    workingDays: number[];
}

export interface PatientDTO extends UserDTO {
    role: UserRole.PATIENT;
    clinicPatientId?: string;
    phone?: string;
    dateOfBirth?: string;
}

export interface FrontDeskDTO extends UserDTO {
    role: UserRole.FRONT_DESK;
}