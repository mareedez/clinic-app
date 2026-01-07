import { PatientUser } from "../../../domain/users/PatientUser.js";
import type { UserRepository } from "../../../ports/repositories/UserRepository.js";
import { RegisterPatientSchema } from "./schemas.js";
import { ValidationError } from "../appointments/errors.js";
import { UserMapper } from "../../../domain/users/UserMapper.js";
import argon2 from "argon2";

export class RegisterPatient {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly userMapper: UserMapper
    ) {}

    async execute(input: unknown) {

        const data = RegisterPatientSchema.parse(input);
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing) {
            throw new ValidationError("A user with this email already exists.");
        }

        const passwordHash = await argon2.hash("Temporary123!");

        const patientProps: any = {
            email: data.email.toLowerCase(),
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            isActive: true
        };

        if (data.phone) patientProps.phone = data.phone;
        if (data.dateOfBirth) patientProps.dateOfBirth = data.dateOfBirth;

        const patient = PatientUser.create(patientProps);

        await this.userRepo.save(patient);

        return this.userMapper.toDTO(patient);
    }
}