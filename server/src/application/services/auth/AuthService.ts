import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { LoginSchema } from "./schemas.js";
import { ValidationError } from "../appointments/errors.js";
import type { UserRepository } from "../../../ports/repositories/UserRepository.js";
import { UserMapper } from "../../../domain/users/UserMapper.js";

export class AuthService {
    private readonly jwtSecret: string;

    constructor(
        private readonly userRepo: UserRepository,
        private readonly userMapper: UserMapper,
        jwtSecret: string | undefined
    ) {
        if (!jwtSecret) {
            throw new Error("AuthService: JWT_SECRET is required but was not provided.");
        }
        this.jwtSecret = jwtSecret;
    }


    async login(input: unknown) {
        const { email, password } = LoginSchema.parse(input);
        const user = await this.userRepo.findByEmail(email.toLowerCase());
        if (!user || !(await argon2.verify((user as any)._passwordHash, password))) {
            throw new ValidationError("Invalid email or password");
        }
        user.recordLogin();
        await this.userRepo.save(user);

        const token = jwt.sign(
            {
                sub: user.id,
                roles: user.role,
                email: user.email
            },
            this.jwtSecret,
            { expiresIn: "8h" }
        );

        return {
            token,
            user: this.userMapper.toDTO(user)
        };
    }
}
