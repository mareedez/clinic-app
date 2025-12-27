import { User, type UserBaseProps } from "./User.js";
import { UserRole } from "./UserEnum.js";
import { mustNonEmpty, normalizeOptional } from "../common/validateHelper.js";

export interface FrontDeskUserProps extends UserBaseProps {
    clinicStaffId?: string;
    firstName: string;
    lastName: string;
}

export class FrontDeskUser extends User {
    private _clinicStaffId: string | undefined;
    private _firstName: string;
    private _lastName: string;

    private constructor(props: FrontDeskUserProps) {
        super(UserRole.FRONT_DESK, props);

        this._firstName = mustNonEmpty("First name", props.firstName);
        this._lastName = mustNonEmpty("Last name", props.lastName);
        this._clinicStaffId = normalizeOptional(props.clinicStaffId);
    }

    public static create(props: FrontDeskUserProps): FrontDeskUser {
        return new FrontDeskUser(props);
    }

    get clinicStaffId(): string | undefined {
        return this._clinicStaffId;
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

    public setClinicStaffId(value: string | undefined): void {
        const next = normalizeOptional(value);
        if (this._clinicStaffId === next) return;
        this._clinicStaffId = next;
        this.touch();
    }
}
