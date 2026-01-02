import { User, type UserBaseProps } from "./User.js";
import { UserRole } from "./UserEnum.js";
import { mustNonEmpty, normalizeOptional } from "../common/validateHelper.js";

export interface PatientUserProps extends UserBaseProps {
    clinicPatientId?: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string; // ISO "YYYY-MM-DD"
}

export class PatientUser extends User {
    private _clinicPatientId: string | undefined;
    private _firstName: string;
    private _lastName: string;
    private _phone: string | undefined;
    private _dateOfBirth: string | undefined;

    private constructor(props: PatientUserProps) {
        super(UserRole.PATIENT, props);

        this._firstName = mustNonEmpty("First name", props.firstName);
        this._lastName = mustNonEmpty("Last name", props.lastName);
        this._phone = normalizeOptional(props.phone);

        this._dateOfBirth = normalizeOptional(props.dateOfBirth);
        if (this._dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(this._dateOfBirth)) {
            throw new Error("Date of birth must be in YYYY-MM-DD format.");
        }

        this._clinicPatientId = normalizeOptional(props.clinicPatientId);
    }

    public static create(props: PatientUserProps): PatientUser {
        return new PatientUser(props);
    }

    get clinicPatientId(): string | undefined {
        return this._clinicPatientId;
    }

    get firstName(): string {
        return this._firstName;
    }

    get lastName(): string {
        return this._lastName;
    }

    get phone(): string | undefined {
        return this._phone;
    }

    get dateOfBirth(): string | undefined {
        return this._dateOfBirth;
    }

    get displayName(): string {
        return `${this._firstName} ${this._lastName}`.trim();
    }

    public setClinicPatientId(value: string | undefined): void {
        const next = normalizeOptional(value);
        if (this._clinicPatientId === next) return;
        if (this._clinicPatientId && next && this._clinicPatientId !== next) {
            throw new Error("Clinic patient ID is already set and cannot be changed.");
        }
        this._clinicPatientId = next;
        this.touch();
    }

    public setName(firstName: string, lastName: string): void {
        const nextFirst = mustNonEmpty("First name", firstName);
        const nextLast = mustNonEmpty("Last name", lastName);
        if (this._firstName === nextFirst && this._lastName === nextLast) return;
        this._firstName = nextFirst;
        this._lastName = nextLast;
        this.touch();
    }

    public setPhone(phone?: string): void {
        const next = normalizeOptional(phone);
        if (this._phone === next) return;
        this._phone = next;
        this.touch();
    }

    public setDateOfBirth(dateOfBirth?: string): void {
        const next = normalizeOptional(dateOfBirth);
        if (next && !/^\d{4}-\d{2}-\d{2}$/.test(next)) {
            throw new Error("Date of birth must be in YYYY-MM-DD format.");
        }
        if (this._dateOfBirth === next) return;
        this._dateOfBirth = next;
        this.touch();
    }
}