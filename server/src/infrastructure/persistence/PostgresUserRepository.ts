import type {UserRepository} from "../../ports/repositories/UserRepository.js";
import { User } from "../../domain/users/User.js";
import { prisma } from "./prisma-client.js";
import { UserMapper } from "../../domain/users/UserMapper.js";
import type {UserRole} from "../../domain/users/UserEnum.js";

export class PostgresUserRepository implements UserRepository {
    constructor(private readonly mapper: UserMapper) {}

    async getById(id: string): Promise<User | undefined> {
        const record = await prisma.user.findUnique({
            where: { id },
            include: {
                patientProfile: true,
                physicianProfile: true
            }
        });

        if (!record) return undefined;
        return this.mapper.toDomain(record);
    }

    async findByEmail(email: string): Promise<User | undefined> {
        const record = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                patientProfile: true,
                physicianProfile: true
            }
        });

        if (!record) return undefined;
        return this.mapper.toDomain(record);
    }

    async listByRole(role: UserRole): Promise<User[]> {
        const records = await prisma.user.findMany({
            where: { role: role as any },
            include: {
                patientProfile: true,
                physicianProfile: true
            }
        });

        return records.map(r => this.mapper.toDomain(r));
    }

    async search(query: string, role?: UserRole): Promise<User[]> {
        const q = query.toLowerCase();
        const records = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { email: { contains: q, mode: 'insensitive' } },
                            { firstName: { contains: q, mode: 'insensitive' } },
                            { lastName: { contains: q, mode: 'insensitive' } }
                        ]
                    },
                    role ? { role: role as any } : {}
                ]
            },
            include: {
                patientProfile: true,
                physicianProfile: true
            }
        });

        return records.map(r => this.mapper.toDomain(r));
    }

    async save(user: User): Promise<void> {
        const persistence = this.mapper.toPersistence(user);
        const { patientProfile, physicianProfile, ...userData } = persistence;

        await prisma.user.upsert({
            where: { id: user.id },
            update: {
                ...userData,
                patientProfile: patientProfile ? {
                    upsert: {
                        create: patientProfile,
                        update: patientProfile
                    }
                } : undefined,
                physicianProfile: physicianProfile ? {
                    upsert: {
                        create: physicianProfile,
                        update: physicianProfile
                    }
                } : undefined
            },
            create: {
                ...userData,
                patientProfile: patientProfile ? { create: patientProfile } : undefined,
                physicianProfile: physicianProfile ? { create: physicianProfile } : undefined
            }
        });
    }
}