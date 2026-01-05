import type { AppointmentRepository } from "../../../../ports/repositories/AppointmentRepository.js";
import type { UserRepository } from "../../../../ports/repositories/UserRepository.js";
import { SlotGenerator } from "../../../../domain/algorithms/SlotGenerator.js";
import { GetAvailableSlotsSchema } from "../schemas.js";
import { NotFoundError } from "../errors.js";
import { toTimeSlotDTO } from "../../../../domain/algorithms/TimeSlotMapper.js";
import {SERVICE_DURATION_MAP} from "../../ServiceName.js";
import {UserRole} from "../../../../domain/users/UserEnum.js";


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

        const existing = await this.repo.getByPhysicianAndDate(validated.physicianId, validated.date);
        const duration = SERVICE_DURATION_MAP[validated.serviceType] || 30;
        const service: any = { 
            id: validated.serviceType, 
            durationMinutes: duration 
        };

        const slots = SlotGenerator.generate(user as any, validated.date, service, existing);


        return slots.map(slot => toTimeSlotDTO(slot));
    }
}