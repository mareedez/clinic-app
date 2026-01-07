import { User } from "./User.js";
import { PhysicianUser } from "./PhysicianUser.js";
import { PatientUser } from "./PatientUser.js";
import { FrontDeskUser } from "./FrontDeskUser.js";
import { UserRole } from "./UserEnum.js";
import type { UserDTO, PhysicianDTO, PatientDTO, FrontDeskDTO } from "../../application/dto/UserDTO.js";

export class UserMapper {

    public toDomain(raw: any): User {
        const role = raw.role as UserRole;
        const baseProps = {
            id: raw.id,
            email: raw.email,
            passwordHash: raw.passwordHash,
            isActive: raw.isActive,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
            lastLoginAt: raw.lastLoginAt || undefined,
        };

        if (role === UserRole.PHYSICIAN && raw.physicianProfile) {
            return PhysicianUser.create({
                ...baseProps,
                firstName: raw.firstName,
                lastName: raw.lastName,
                specialization: raw.physicianProfile.specialization,
                workingHoursStart: raw.physicianProfile.workingHoursStart,
                workingHoursEnd: raw.physicianProfile.workingHoursEnd,
                workingDays: raw.physicianProfile.workingDays,
            });
        }

        if (role === UserRole.PATIENT && raw.patientProfile) {
            return PatientUser.create({
                ...baseProps,
                firstName: raw.firstName,
                lastName: raw.lastName,
                phone: raw.patientProfile.phone || undefined,
                dateOfBirth: raw.patientProfile.dateOfBirth ?
                    raw.patientProfile.dateOfBirth.toISOString().split('T')[0] : undefined
            });
        }

        if (role === UserRole.FRONT_DESK) {
            return FrontDeskUser.create({
                ...baseProps,
                firstName: raw.firstName,
                lastName: raw.lastName,
            });
        }

        return (User as any).reconstitute(role, baseProps);
    }


    public toPersistence(u: User): any {
        const persistence: any = {
            id: u.id,
            email: u.email,
            passwordHash: (u as any)._passwordHash, // доступ к приватному полю для БД
            firstName: (u as any)._firstName || (u as any).firstName || "",
            lastName: (u as any)._lastName || (u as any).lastName || "",
            role: u.role,
            isActive: u.isActive,
        };

        if (u instanceof PhysicianUser) {
            persistence.physicianProfile = {
                specialization: u.specialization,
                workingHoursStart: u.workingHoursStart,
                workingHoursEnd: u.workingHoursEnd,
                workingDays: u.workingDays,
            };
        }

        if (u instanceof PatientUser) {
            persistence.patientProfile = {
                phone: u.phone || null,
                dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth) : null,
            };
        }

        return persistence;
    }

    public toDTO(u: User): UserDTO {
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
                workingHoursStart: u.workingHoursStart,
                workingHoursEnd: u.workingHoursEnd,
                workingDays: u.workingDays,
            } as PhysicianDTO;
        }

        if (u instanceof PatientUser) {
            return {
                ...base,
                role: UserRole.PATIENT,
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
}