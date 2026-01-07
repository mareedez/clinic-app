import type { AppointmentRepository } from "../../../../ports/repositories/AppointmentRepository.js";
import type { UserRepository } from "../../../../ports/repositories/UserRepository.js";
import { SlotGenerator } from "../../../../domain/algorithms/SlotGenerator.js";
import { GetAvailableSlotsSchema } from "../schemas.js";
import { NotFoundError } from "../errors.js";
import { toTimeSlotDTO } from "../../../../domain/algorithms/TimeSlotMapper.js";
import { SERVICE_DURATION_MAP } from "../../ServiceName.js";
import { UserRole } from "../../../../domain/users/UserEnum.js";
import { PhysicianUser } from "../../../../domain/users/PhysicianUser.js";
import type { Service } from "../../../../shared/types.js";

export class GetAvailableSlots {
    constructor(
        private readonly repo: AppointmentRepository,
        private readonly userRepo: UserRepository
    ) {}

    async execute(input: unknown) {
        const validated = GetAvailableSlotsSchema.parse(input);

        const user = await this.userRepo.getById(validated.physicianId);

        if (!user || user.role !== UserRole.PHYSICIAN) {
            throw new NotFoundError("Physician not found or invalid user type.");
        }

        const physician = user as PhysicianUser;
        const existing = await this.repo.getByPhysicianAndDate(validated.physicianId, validated.date);
        console.log("exist", existing.length)

        const duration = SERVICE_DURATION_MAP[validated.serviceType] || 30;
        const service: Service = {
            id: validated.serviceType,
            name: validated.serviceType,
            durationMinutes: duration,
            isActive: true
        };

        const slots = SlotGenerator.generate(physician, validated.date, service, existing);

        return slots.map(slot => toTimeSlotDTO(slot));
    }
}