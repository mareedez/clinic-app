import { Appointment } from "../../../domain/clinic/Appointment.js";
import type {AppointmentDTO} from "../../dto/AppointmentDTO.js";
import { SERVICE_DISPLAY_NAMES } from "../ServiceName.js";
import type {UserRepository} from "../../../ports/repositories/UserRepository.js";

export class AppointmentMapper {
    constructor(private readonly userRepo: UserRepository) {}

    async toDTO(a: Appointment): Promise<AppointmentDTO> {
        const [patient, physician] = await Promise.all([
            this.userRepo.getById(a.patientId),
            a.physicianId ? this.userRepo.getById(a.physicianId) : Promise.resolve(undefined)
        ]);

        const dto: AppointmentDTO = {
            id: a.id,
            status: a.status,

            patient: {
                id: a.patientId,
                displayName: patient ? patient.displayName : `Patient #${a.patientId.substring(0, 4)}`,
            },

            service: {
                id: a.serviceType as any,
                type: a.serviceType,
                displayName: SERVICE_DISPLAY_NAMES[a.serviceType] || a.serviceType,
                price: 0,
            },

            schedule: {
                startAt: a.scheduledStartAt?.toISOString(),
                endAt: a.scheduledEndAt?.toISOString(),
                durationMinutes: a.scheduledDurationMinutes,
            },

            lifeCycle: {
                createdAt: a.createdAt.toISOString(),
                createdBy: a.createdByUserId,
                updatedAt: a.updatedAt.toISOString(),
                checkedInAt: a.checkedInAt?.toISOString(),
                startedAt: a.startedAt?.toISOString(),
                completedAt: a.completedAt?.toISOString(),
                cancelledAt: a.cancelledAt?.toISOString(),
                cancelReason: a.cancelReason,
                noShowAt: a.noShowAt?.toISOString(),
            },

            notes: a.notes,
        };

        if (physician) {
            dto.physician = {
                id: physician.id,
                displayName: physician.displayName,
            };
        }

        return dto;
    }
}
