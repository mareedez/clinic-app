import type {AppointmentRepository} from "../../../../ports/repositories/AppointmentRepository.js";
import type {UserRepository} from "../../../../ports/repositories/UserRepository.js";
import { AppointmentStatus } from "../../../../domain/clinic/AppointmentStatusEnum.js";
import { AppointmentMapper } from "../AppointmentMapper.js";
import type {FrontDeskDashboardDTO, PhysicianStatusDTO} from "../../../dto/FrontDeskDashboardDTO.js";
import { UserRole } from "../../../../domain/users/UserEnum.js";

export class GetFrontDeskDashboard {
    constructor(
        private readonly repo: AppointmentRepository,
        private readonly userRepo: UserRepository,
        private readonly mapper: AppointmentMapper
    ) {}

    async execute(): Promise<FrontDeskDashboardDTO> {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        const [allApts, allUsers] = await Promise.all([
            this.repo.list({ scheduledFrom: start, scheduledTo: end }),
            this.userRepo.listByRole(UserRole.PHYSICIAN)
        ]);

        const physicians: PhysicianStatusDTO[] = await Promise.all(allUsers.map(async doc => {
            const activeApt = allApts.find(a => a.physicianId === doc.id && a.status === AppointmentStatus.IN_PROGRESS);
            
            let estimatedReadyAt: string | undefined;
            if (activeApt && activeApt.scheduledStartAt) {
                const endTime = new Date(activeApt.scheduledStartAt.getTime() + (activeApt.scheduledDurationMinutes || 30) * 60000);
                estimatedReadyAt = endTime.toISOString();
            }

            return {
                id: doc.id,
                displayName: doc.displayName,
                status: activeApt ? "BUSY" : "AVAILABLE",
                activeAppointment: activeApt ? await this.mapper.toDTO(activeApt) : undefined,
                estimatedReadyAt
            };
        }));

        return {
            stats: {
                totalToday: allApts.length,
                waitingPatients: allApts.filter(a => a.status === AppointmentStatus.CHECKED_IN).length,
                availableDoctors: physicians.filter(p => p.status === "AVAILABLE").length
            },
            physicians,
            agenda: await Promise.all(allApts.map(a => this.mapper.toDTO(a)))
        };
    }
}