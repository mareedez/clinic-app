import type {AppointmentRepository, AppointmentListFilter} from "../../ports/repositories/AppointmentRepository.js";
import { Appointment } from "../../domain/clinic/Appointment.js";
import type {EntityId} from "../../domain/common/id.js";
import { prisma } from "./prisma-client.js";
import { AppointmentMapper } from "../../application/services/appointments/AppointmentMapper.js";
import { AppointmentStatus } from "../../generated/prisma/enums.js";

export class PostgresAppointmentRepository implements AppointmentRepository {
    constructor(private readonly mapper: AppointmentMapper) {}

    async getById(id: EntityId): Promise<Appointment | undefined> {
        const record = await prisma.appointment.findUnique({
            where: { id },
            include: {
                patient: { include: { user: true } },
                physician: { include: { user: true } }
            }
        });

        if (!record) return undefined;
        return this.mapper.toDomain(record);
    }

    async getByPhysician(physicianId: string): Promise<Appointment[]> {
        const records = await prisma.appointment.findMany({
            where: {
                physician: { userId: physicianId }
            },
            include: {
                patient: { include: { user: true } },
                physician: { include: { user: true } }
            }
        });

        return records.map(r => this.mapper.toDomain(r));
    }

    async save(appointment: Appointment, opts?: { expectedUpdatedAt?: Date }): Promise<void> {
        const persistence = this.mapper.toPersistence(appointment);

        if (opts?.expectedUpdatedAt) {
            const current = await prisma.appointment.findUnique({
                where: { id: appointment.id },
                select: { updatedAt: true }
            });

            if (current && current.updatedAt.getTime() !== opts.expectedUpdatedAt.getTime()) {
                throw new Error("The appointment was updated by another user. Please refresh and try again.");
            }
        }

        await prisma.appointment.upsert({
            where: { id: appointment.id },
            update: {
                status: persistence.status as AppointmentStatus,
                notes: persistence.notes ?? null,
                checkedInAt: persistence.checkedInAt ?? null,
                startedAt: persistence.startedAt ?? null,
                completedAt: persistence.completedAt ?? null,
                cancelledAt: persistence.cancelledAt ?? null,
                cancelReason: persistence.cancelReason ?? null,
                noShowAt: persistence.noShowAt ?? null,
                scheduledStartAt: persistence.scheduledStartAt,
                durationMinutes: persistence.durationMinutes,
            },
            create: {
                id: persistence.id,
                status: persistence.status as AppointmentStatus,
                serviceType: persistence.serviceType,
                notes: persistence.notes ?? null,
                scheduledStartAt: persistence.scheduledStartAt,
                durationMinutes: persistence.durationMinutes,
                checkedInAt: persistence.checkedInAt ?? null,
                startedAt: persistence.startedAt ?? null,
                completedAt: persistence.completedAt ?? null,
                cancelledAt: persistence.cancelledAt ?? null,
                cancelReason: persistence.cancelReason ?? null,
                noShowAt: persistence.noShowAt ?? null,
                patient: { connect: { userId: persistence.patientProfileId } },
                physician: { connect: { userId: persistence.physicianProfileId } },
                createdBy: { connect: { id: persistence.createdById } }
            }
        });
    }

    async getByPhysicianAndDate(physicianId: string, date: Date): Promise<Appointment[]> {

        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

        const records = await prisma.appointment.findMany({
            where: {
                physician: { userId: physicianId },
                scheduledStartAt: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: { in: ['SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED'] }
            },
            include: {
                patient: { include: { user: true } },
                physician: { include: { user: true } }
            }
        });

        return records.map(r => this.mapper.toDomain(r));
    }

    async list(filter?: AppointmentListFilter): Promise<Appointment[]> {
        const where: any = {};

        if (filter) {
            if (filter.patientId) where.patient = { userId: filter.patientId };
            if (filter.physicianId) where.physician = { userId: filter.physicianId };
            if (filter.status) where.status = filter.status as AppointmentStatus;

            if (filter.scheduledFrom || filter.scheduledTo) {
                where.scheduledStartAt = {};
                if (filter.scheduledFrom) where.scheduledStartAt.gte = filter.scheduledFrom;
                if (filter.scheduledTo) where.scheduledStartAt.lte = filter.scheduledTo;
            }
        }

        const records = await prisma.appointment.findMany({
            where,
            include: {
                patient: { include: { user: true } },
                physician: { include: { user: true } }
            },
            orderBy: { scheduledStartAt: 'asc' }
        });

        return records.map(r => this.mapper.toDomain(r));
    }

    async findOverdueScheduled(threshold: Date): Promise<Appointment[]> {
        const records = await prisma.appointment.findMany({
            where: {
                status: AppointmentStatus.SCHEDULED,
                scheduledStartAt: { lt: threshold }
            },
            include: {
                patient: { include: { user: true } },
                physician: { include: { user: true } }
            }
        });

        return records.map(r => this.mapper.toDomain(r));
    }
}