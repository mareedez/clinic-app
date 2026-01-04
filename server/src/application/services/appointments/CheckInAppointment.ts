import type { AppointmentRepository } from "../../../ports/repositories/AppointmentRepository.js";
import { AppointmentStatusUpdateSchema } from "./schemas.js";
import { NotFoundError } from "./errors.js";
import { toAppointmentDTO } from "./AppointmentMapper.js";
import type {RequestContext} from "../../../shared/types.js";

export class CheckInAppointment {
    constructor(private readonly repo: AppointmentRepository) {}
    async execute(input: unknown, _ctx: RequestContext) {
        const { appointmentId, at, expectedUpdatedAt } = AppointmentStatusUpdateSchema.parse(input);
        const apt = await this.repo.getById(appointmentId);
        if (!apt) throw new NotFoundError("Appointment not found.");
        apt.markCheckedIn(at ?? new Date());
        await this.repo.save(apt, { expectedUpdatedAt });
        return toAppointmentDTO(apt);
    }
}