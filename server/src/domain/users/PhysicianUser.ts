import { User, type UserBaseProps } from "./User.js";
import { UserRole } from "./UserEnum.js";
import {mustNonEmpty, normalizeOptional} from "../common/validateHelper.js";

export interface PhysicianUserProps extends UserBaseProps {
    clinicPhysicianId?: string;
    firstName: string;
    lastName: string;
    specialization?: string;
    workingHoursStart: string;
    workingHoursEnd: string;
    workingDays: number[];
}

export class PhysicianUser extends User {
    private _clinicPhysicianId: string | undefined;
    private _firstName: string;
    private _lastName: string;
    private _specialization: string | undefined;
    private _workingHoursStart: string;
    private _workingHoursEnd: string;
    private _workingDays: number[];

    private constructor(props: PhysicianUserProps) {
        super(UserRole.PHYSICIAN, props);

        this._firstName = mustNonEmpty("First name", props.firstName);
        this._lastName = mustNonEmpty("Last name", props.lastName);
        this._clinicPhysicianId = normalizeOptional(props.clinicPhysicianId);
        this._specialization = normalizeOptional(props.specialization);
        this._workingHoursStart = mustNonEmpty("Working hours start", props.workingHoursStart);
        this._workingHoursEnd = mustNonEmpty("Working hours end", props.workingHoursEnd);
        this._workingDays = props.workingDays;
        this.assertInvariants();
    }

    public static create(props: PhysicianUserProps): PhysicianUser {
        return new PhysicianUser(props);
    }

    private assertInvariants(): void {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(this._workingHoursStart)) throw new Error("Invalid start time format");
        if (!timeRegex.test(this._workingHoursEnd)) throw new Error("Invalid end time format");
        if (this._workingDays.some(d => d < 0 || d > 6)) {
            throw new Error("Working days must be between 0 and 6");
        }
    }

    //Getters

    get clinicPhysicianId(): string | undefined { return this._clinicPhysicianId; }
    get firstName(): string { return this._firstName; }
    get lastName(): string { return this._lastName; }
    get displayName(): string { return `${this._firstName} ${this._lastName}`.trim(); }
    get specialization(): string | undefined { return this._specialization; }
    get workingHoursStart(): string { return this._workingHoursStart; }
    get workingHoursEnd(): string { return this._workingHoursEnd; }
    get workingDays(): number[] { return this._workingDays; }


    // Methods

    public updateProfile(input: { firstName: string; lastName: string; specialization?: string }): void {
        this._firstName = mustNonEmpty("First name", input.firstName);
        this._lastName = mustNonEmpty("Last name", input.lastName);
        this._specialization = normalizeOptional(input.specialization);
        this.touch();
    }
    public updateSchedule(start: string, end: string, days: number[]): void {
        this._workingHoursStart = mustNonEmpty("Start time", start);
        this._workingHoursEnd = mustNonEmpty("End time", end);
        this._workingDays = days;
        this.assertInvariants();
        this.touch();
    }

    public setClinicPhysicianId(value: string | undefined): void {
        const next = normalizeOptional(value);
        if (this._clinicPhysicianId === next) return;
        this._clinicPhysicianId = next;
        this.touch();
    }
}
