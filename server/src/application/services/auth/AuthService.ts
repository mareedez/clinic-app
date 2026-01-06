import jwt from "jsonwebtoken";
import { LoginSchema } from "./schemas.js";
import { ValidationError } from "../appointments/errors.js";

const DEMO_USERS = [
    { id: "pat-demo", email: "demo.patient@clinic.local", password: "Demo@12345", roles: ["PATIENT"] },
    { id: "doc-demo", email: "demo.doctor@clinic.local", password: "Demo@12345", roles: ["PHYSICIAN"] },
    { id: "fd-demo", email: "demo.desk@clinic.local", password: "Demo@12345", roles: ["FRONT_DESK"] }
];

export class AuthService {
    private readonly jwtSecret: string;

    constructor() {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET environment variable is required");
        }
        this.jwtSecret = secret;
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
                roles: user.roles,
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
                role: user.roles[0]
            }
        };
    }
}
