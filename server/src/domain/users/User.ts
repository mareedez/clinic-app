import { Entity, type EntityProps } from "../common/Entity.js";
import { UserRole } from "./UserEnum.js";

export interface UserBaseProps extends EntityProps {
    email: string;
    passwordHash: string;
    isActive?: boolean;
    lastLoginAt?: Date;
}


function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export abstract class User extends Entity {
    public readonly role: UserRole;

    private _email: string;
    private _passwordHash: string;
    private _isActive: boolean;
    private _lastLoginAt: Date | undefined;

    protected constructor(role: UserRole, props: UserBaseProps) {
        super(props);

        const email = normalizeEmail(props.email);
        if (!isValidEmail(email)) throw new Error("Invalid email format.");
        if (!props.passwordHash.trim()) throw new Error("Password hash is required.");

        this.role = role;
        this._email = email;
        this._passwordHash = props.passwordHash.trim();
        this._isActive = props.isActive ?? true;
        this._lastLoginAt = props.lastLoginAt;
    }

    get email(): string {
        return this._email;
    }

    get isActive(): boolean {
        return this._isActive;
    }

    get lastLoginAt(): Date | undefined {
        return this._lastLoginAt;
    }

    public setPasswordHash(nextHash: string): void {
        const next = nextHash.trim();
        if (!next) throw new Error("Password hash cannot be empty.");
        this._passwordHash = next;
        this.touch();
    }

    public recordLogin(at: Date = new Date()): void {
        this._lastLoginAt = at;
        this.touch(at);
    }

    public deactivate(): void {
        this._isActive = false;
        this.touch();
    }

    public activate(): void {
        this._isActive = true;
        this.touch();
    }

    public abstract get displayName(): string;
}
