import { User } from "./User.js";
import { PhysicianUser } from "./PhysicianUser.js";
import { PatientUser } from "./PatientUser.js";
import { FrontDeskUser } from "./FrontDeskUser.js";
import { UserRole } from "./UserEnum.js";
import type {UserDTO, PhysicianDTO, PatientDTO, FrontDeskDTO} from "../../application/dto/UserDTO.js";

export function toUserDTO(u: User): UserDTO {
    const base: UserDTO = {
        id: u.id,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt?.toISOString(),
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        displayName: u.displayName
    };

    if (u instanceof PhysicianUser) {
        return {
            ...base,
            role: UserRole.PHYSICIAN,
            specialization: u.specialization,
            clinicPhysicianId: u.clinicPhysicianId,
            workingHoursStart: u.workingHoursStart,
            workingHoursEnd: u.workingHoursEnd,
            workingDays: u.workingDays,
        } as PhysicianDTO;
    }

    if (u instanceof PatientUser) {
        return {
            ...base,
            role: UserRole.PATIENT,
            clinicPatientId: u.clinicPatientId,
            phone: u.phone,
            dateOfBirth: u.dateOfBirth,
        } as PatientDTO;
    }

    if (u instanceof FrontDeskUser) {
        return {
            ...base,
            role: UserRole.FRONT_DESK,
            clinicStaffId: u.clinicStaffId,
        } as FrontDeskDTO;
    }

    return base;
}