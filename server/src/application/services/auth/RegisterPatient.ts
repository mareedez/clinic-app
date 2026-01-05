import type { UserRepository } from "../../../ports/repositories/UserRepository.js";
import { RegisterPatientSchema } from "./schemas.js";
import { ValidationError } from "../appointments/errors.js";
import { toUserDTO } from "../../../domain/users/UserMapper.js";
import { UserRole } from "../../../domain/users/UserEnum.js";

export class RegisterPatient {
    constructor(private readonly userRepo: UserRepository) {}

    async execute(input: unknown) {

        const data = RegisterPatientSchema.parse(input);
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing) {
            throw new ValidationError("A user with this email already exists.");
        }

        const patient: any = {
            id: `pat-${Math.random().toString(36).substr(2, 9)}`,
            email: data.email.toLowerCase(),
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: `${data.firstName} ${data.lastName}`,
            role: UserRole.PATIENT,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Temp
            touch: () => {},
            activate: () => {},
            deactivate: () => {},
        };

        await this.userRepo.save(patient);

        return toUserDTO(patient);
    }
}