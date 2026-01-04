import jwt from "jsonwebtoken";
import { LoginSchema } from "./schemas.js";
import { ValidationError } from "../appointments/errors.js";

const DEMO_USERS = [
    { id: "pat-demo", email: "demo.patient@clinic.local", password: "Demo@12345", roles: ["patient"] },
    { id: "doc-demo", email: "demo.doctor@clinic.local", password: "Demo@12345", roles: ["physician"] },
    { id: "fd-demo", email: "demo.desk@clinic.local", password: "Demo@12345", roles: ["front_desk"] }
];

export class AuthService {
    private readonly jwtSecret: string;

    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || "fallback-secret-for-dev-only";
    }

    async login(input: unknown) {
        const { email, password } = LoginSchema.parse(input);
        const user = DEMO_USERS.find(u => u.email === email && u.password === password);
        if (!user) {
            throw new ValidationError("Invalid email or password");
        }

        const token = jwt.sign(
            { 
                sub: user.id, 
                roles: user.roles[0],
                email: user.email 
            },
            this.jwtSecret,
            { expiresIn: "8h" }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                roles: user.roles[0]
            }
        };
    }
}