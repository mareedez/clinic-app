import type { AppointmentRepository } from "../../../ports/repositories/AppointmentRepository.js";
import { AppointmentStatusUpdateSchema } from "./schemas.js";
import { NotFoundError } from "./errors.js";
import { toAppointmentDTO } from "./AppointmentMapper.js";
import type {RequestContext} from "../../../shared/types.js";

export class StartAppointment {
    constructor(private readonly repo: AppointmentRepository) {}

    async execute(input: unknown, _ctx: RequestContext) {
        const validated = AppointmentStatusUpdateSchema.parse(input);
        const apt = await this.repo.getById(validated.appointmentId);
        if (!apt) throw new NotFoundError("Appointment not found.");
        apt.markNoShow(validated.at ?? new Date());
        await this.repo.save(apt, { expectedUpdatedAt: validated.expectedUpdatedAt });
        return toAppointmentDTO(apt);
    }
}