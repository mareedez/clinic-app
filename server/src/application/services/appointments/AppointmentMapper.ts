import { Appointment } from "../../../domain/clinic/Appointment.js";
import type { AppointmentDTO } from "../../dto/AppointmentDTO.js";
import { SERVICE_DISPLAY_NAMES } from "../ServiceName.js";
import type { UserRepository } from "../../../ports/repositories/UserRepository.js";
import { AppointmentStatus } from "../../../domain/clinic/AppointmentStatusEnum.js";
import { CLINIC_CONFIG } from "../../../config/clinicConfig.js";

export class AppointmentMapper {
    constructor(private readonly userRepo: UserRepository) {}


    public toDomain(raw: any): Appointment {
        return Appointment.reconstitute({
            id: raw.id,
            status: raw.status as AppointmentStatus,
            serviceType: raw.serviceType,
            notes: raw.notes || undefined,
            scheduledStartAt: raw.scheduledStartAt,
            scheduledDurationMinutes: raw.durationMinutes,

            // Получаем userId из вложенных профилей
            patientId: raw.patient.user.id,
            physicianId: raw.physician?.user.id,
            createdByUserId: raw.createdById,

            checkedInAt: raw.checkedInAt ?? undefined,
            startedAt: raw.startedAt ?? undefined,
            completedAt: raw.completedAt ?? undefined,
            cancelledAt: raw.cancelledAt ?? undefined,
            cancelReason: raw.cancelReason ?? undefined,
            noShowAt: raw.noShowAt ?? undefined,

            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt
        });
    }

    public toPersistence(a: Appointment) {
        return {
            id: a.id,
            status: a.status,
            serviceType: a.serviceType,
            notes: a.notes,
            scheduledStartAt: a.scheduledStartAt!,
            durationMinutes: a.scheduledDurationMinutes!,

            patientProfileId: a.patientId,
            physicianProfileId: a.physicianId!,
            createdById: a.createdByUserId,

            checkedInAt: a.checkedInAt,
            startedAt: a.startedAt,
            completedAt: a.completedAt,
            cancelledAt: a.cancelledAt,
            cancelReason: a.cancelReason,
            noShowAt: a.noShowAt
        };
    }

    async toDTO(a: Appointment): Promise<AppointmentDTO> {
        const [patient, physician] = await Promise.all([
            this.userRepo.getById(a.patientId),
            a.physicianId ? this.userRepo.getById(a.physicianId) : Promise.resolve(undefined)
        ]);

        const now = new Date();
        const startTime = a.scheduledStartAt;
        const hoursUntil = startTime ? (startTime.getTime() - now.getTime()) / (1000 * 60 * 60) : 0;

        const canCancel = a.status === AppointmentStatus.SCHEDULED && hoursUntil >= CLINIC_CONFIG.booking.cancellationWindowHours;
        const canCheckIn = a.status === AppointmentStatus.SCHEDULED;
        const canStart = a.status === AppointmentStatus.CHECKED_IN;
        const canComplete = a.status === AppointmentStatus.IN_PROGRESS;

        const dto: AppointmentDTO = {
            id: a.id,
            status: a.status as any,

            patient: {
                id: a.patientId,
                displayName: patient ? patient.displayName : `Patient #${a.patientId.substring(0, 4)}`,
            },

            service: {
                id: a.serviceType as any,
                type: a.serviceType as any,
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

            permissions: {
                canBeCancelled: canCancel,
                canBeCheckedIn: canCheckIn,
                canBeStarted: canStart,
                canBeCompleted: canComplete
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