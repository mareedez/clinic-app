import type {AppointmentRepository} from "../../../ports/repositories/AppointmentRepository.js";
import type {UserRepository} from "../../../ports/repositories/UserRepository.js";
import { Appointment } from "../../../domain/clinic/Appointment.js";
import { AppointmentStatus } from "../../../domain/clinic/AppointmentStatusEnum.js";
import { ServiceType } from "../../../domain/clinic/ServiceEnum.js";
import { UserRole } from "../../../domain/users/UserEnum.js";
import { AppointmentMapper } from "./AppointmentMapper.js";
import { SERVICE_DURATION_MAP } from "../ServiceName.js";
import type { RequestContext } from "../../../shared/types.js";

export interface RegisterWalkInInput {
    patientId: string;
    serviceType: ServiceType;
    notes?: string;
}

export class RegisterWalkIn {
    constructor(
        private readonly appointmentRepo: AppointmentRepository,
        private readonly userRepo: UserRepository,
        private readonly mapper: AppointmentMapper
    ) {}

    async execute(input: RegisterWalkInInput, ctx: RequestContext) {

        const doctors = await this.userRepo.listByRole(UserRole.PHYSICIAN);
        if (doctors.length === 0) throw new Error("No doctors available in clinic.");

        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const todayApts = await this.appointmentRepo.list({ scheduledFrom: start, scheduledTo: end });

        const doctorStats = doctors.map(doc => {
            const activeApt = todayApts.find(a => a.physicianId === doc.id && a.status === AppointmentStatus.IN_PROGRESS);
            const lastApt = todayApts
                .filter(a => a.physicianId === doc.id && a.status !== AppointmentStatus.CANCELLED)
                .sort((a, b) => (b.scheduledEndAt?.getTime() ?? 0) - (a.scheduledEndAt?.getTime() ?? 0))[0];

            return {
                id: doc.id,
                isBusy: !!activeApt,
                readyAt: lastApt?.scheduledEndAt?.getTime() ?? now.getTime()
            };
        });

        const bestDoc = doctorStats.sort((a, b) => {
            if (!a.isBusy && b.isBusy) return -1;
            if (a.isBusy && !b.isBusy) return 1;
            return a.readyAt - b.readyAt;
        })[0];

        if (!bestDoc) {
            throw new Error("Could not find a suitable physician for assignment.");
        }


        const duration = SERVICE_DURATION_MAP[input.serviceType] || 20;
        const apt = Appointment.reconstitute({
            patientId: input.patientId,
            physicianId: bestDoc.id,
            serviceType: input.serviceType,
            scheduledStartAt: new Date(bestDoc.readyAt),
            scheduledDurationMinutes: duration,
            status: AppointmentStatus.SCHEDULED,
            createdByUserId: ctx.userId,
            notes: input.notes,
            createdAt: new Date(),
            updatedAt: new Date()
        } as any);


        apt.markCheckedIn(new Date());
        await this.appointmentRepo.save(apt);

        return await this.mapper.toDTO(apt);
    }
}