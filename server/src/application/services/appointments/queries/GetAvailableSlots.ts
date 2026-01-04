import type { AppointmentRepository } from "../../../../ports/repositories/AppointmentRepository.js";
import { SlotGenerator } from "../../../../domain/algorithms/SlotGenerator.js";
import { GetAvailableSlotsSchema } from "../schemas.js";
import { PhysicianUser } from "../../../../domain/users/PhysicianUser.js";
import type {Service} from "../../../../shared/types.js";

export class GetAvailableSlots {
    constructor(private readonly repo: AppointmentRepository) {}
    async execute(input: unknown) {
        const validated = GetAvailableSlotsSchema.parse(input);
        const existing = await this.repo.getByPhysicianAndDate(validated.physicianId, validated.date);

        const mockDoctor = {
            id: validated.physicianId,
            workingHoursStart: "09:00",
            workingHoursEnd: "17:00",
            workingDays: [1, 2, 3, 4, 5]
        } as unknown as PhysicianUser;

        const mockService = { durationMinutes: 30 } as Service;
        const slots = SlotGenerator.generate(mockDoctor, validated.date, mockService, existing);
        return slots.map(s => ({
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
            isAvailable: s.isAvailable,
            physicianId: validated.physicianId
        }));
    }
}