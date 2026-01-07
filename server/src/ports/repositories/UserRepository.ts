import { User } from "../../domain/users/User.js";
import type {EntityId} from "../../domain/common/id.js";
import type {UserRole} from "../../domain/users/UserEnum.js";

export interface UserRepository {
    getById(id: EntityId): Promise<User | undefined>;
    findByEmail(email: string): Promise<User | undefined>;
    listByRole(role: UserRole): Promise<User[]>;
    save(user: User): Promise<void>;
    search(query: string, role?: UserRole): Promise<User[]>;
}