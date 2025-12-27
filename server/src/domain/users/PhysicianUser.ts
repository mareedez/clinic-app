import { User, type UserBaseProps } from "./User.js";
import { UserRole } from "./UserEnum.js";
import { mustNonEmpty, normalizeOptional } from "../common/validateHelper.js";

export interface PhysicianUserProps extends UserBaseProps {
    clinicPhysicianId?: string;
    firstName: string;
    lastName: string;
}

export class PhysicianUser extends User {
    private _clinicPhysicianId: string | undefined;
    private _firstName: string;
    private _lastName: string;

    private constructor(props: PhysicianUserProps) {
        super(UserRole.PHYSICIAN, props);

        this._firstName = mustNonEmpty("First name", props.firstName);
        this._lastName = mustNonEmpty("Last name", props.lastName);
        this._clinicPhysicianId = normalizeOptional(props.clinicPhysicianId);
    }

    public static create(props: PhysicianUserProps): PhysicianUser {
        return new PhysicianUser(props);
    }

    get clinicPhysicianId(): string | undefined {
        return this._clinicPhysicianId;
    }

    get firstName(): string {
        return this._firstName;
    }

    get lastName(): string {
        return this._lastName;
    }

    get displayName(): string {
        return `${this._firstName} ${this._lastName}`.trim();
    }

    public setClinicPhysicianId(value: string | undefined): void {
        const next = normalizeOptional(value);
        if (this._clinicPhysicianId === next) return;
        this._clinicPhysicianId = next;
        this.touch();
    }
}
