import type {UserRepository} from "../../../../ports/repositories/UserRepository.js";
import { UserRole } from "../../../../domain/users/UserEnum.js";
import { toUserDTO } from "../../../../domain/users/UserMapper.js";
import type {UserDTO} from "../../../dto/UserDTO.js";

export class SearchPatients {
    constructor(private readonly userRepo: UserRepository) {}

    async execute(query: unknown): Promise<UserDTO[]> {
        const q = typeof query === 'string' ? query.trim() : "";
        if (q.length < 2) return [];

        const results = await this.userRepo.search(q, UserRole.PATIENT);
        return results.map(toUserDTO);
    }
}