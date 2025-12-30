import {Entity, type EntityProps} from "../common/Entity.js";
import {type EntityId} from "../common/id.js";
import {AppointmentStatus} from "./AppointmentStatusEnum.js";
import {ServiceType} from "./ServiceEnum.js";
import {addMinutes, assertDateOrder, mustPositiveInt, normalizeOptional, mustValidDate} from "../common/validateHelper.js";

export class AppointmentDomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AppointmentDomainError";
    }
}

export interface AppointmentProps extends EntityProps {
    patientId: EntityId;
    createdByUserId: EntityId;
    serviceType: ServiceType;

    // Scheduled
    physicianId?: EntityId;
    scheduledStartAt?: Date;
    scheduledDurationMinutes?: number;
    notes?: string;
    status: AppointmentStatus;
    checkedInAt?: Date;
    startedAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
    noShowAt?: Date;
    completedAt?: Date;
}

export class Appointment extends Entity {
    private _patientId: EntityId;
    private _createdByUserId: EntityId;
    private _serviceType: ServiceType;
    private _notes: string | undefined;
    private _physicianId: EntityId | undefined;
    private _scheduledStartAt: Date | undefined;
    private _scheduledDurationMinutes: number | undefined;
    private _checkedInAt: Date | undefined;
    private _startedAt: Date | undefined;
    private _status: AppointmentStatus;
    private _cancelledAt: Date | undefined;
    private _cancelReason: string | undefined;
    private _noShowAt: Date | undefined;
    private _completedAt: Date | undefined;

    private constructor(props: AppointmentProps) {
        super(props);
        this._patientId = props.patientId;
        this._createdByUserId = props.createdByUserId;
        this._serviceType = props.serviceType;
        this._notes = normalizeOptional(props.notes);
        this._physicianId = props.physicianId;
        this._scheduledStartAt = props.scheduledStartAt; 
        this._scheduledDurationMinutes = props.scheduledDurationMinutes !== undefined 
            ? mustPositiveInt("scheduledDurationMinutes", props.scheduledDurationMinutes) 
            : undefined;
        this._checkedInAt = props.checkedInAt;
        this._startedAt = props.startedAt;
        this._status = props.status;
        this._cancelledAt = props.cancelledAt;
        this._cancelReason = normalizeOptional(props.cancelReason);
        this._noShowAt = props.noShowAt;
        this._completedAt = props.completedAt;
        this.assertInvariants();
    }

    public static reconstitute(props: AppointmentProps): Appointment {
        return new Appointment(props);
    }

    public static createScheduled(input: Omit<
        AppointmentProps,
        | "status"
        | "checkedInAt"
        | "startedAt"
        | "cancelledAt"
        | "cancelReason"
        | "noShowAt"
        | "completedAt"
    > & {
        physicianId: EntityId;
        scheduledStartAt: Date;
        scheduledDurationMinutes: number;
    }): Appointment {
        return new Appointment({
            ...input,
            status: AppointmentStatus.SCHEDULED,
        });
    }

    private throwInconsistent(message: string): never {
        throw new AppointmentDomainError(message);
    }

    // Getters

    get patientId(): EntityId { return this._patientId; }
    get createdByUserId(): EntityId { return this._createdByUserId; }
    get serviceType(): ServiceType { return this._serviceType; }
    get notes(): string | undefined { return this._notes; }
    get physicianId(): EntityId | undefined { return this._physicianId; }
    get scheduledStartAt(): Date | undefined { return this._scheduledStartAt; }
    get scheduledDurationMinutes(): number | undefined { return this._scheduledDurationMinutes; }
    get status(): AppointmentStatus { return this._status; }
    get checkedInAt(): Date | undefined { return this._checkedInAt; }
    get startedAt(): Date | undefined { return this._startedAt; }
    get cancelledAt(): Date | undefined { return this._cancelledAt; }
    get cancelReason(): string | undefined { return this._cancelReason; }
    get noShowAt(): Date | undefined { return this._noShowAt; }
    get completedAt(): Date | undefined { return this._completedAt; }

    get scheduledEndAt(): Date | undefined {
        if (!this._scheduledStartAt || this._scheduledDurationMinutes === undefined) return undefined;
        return addMinutes(this._scheduledStartAt, this._scheduledDurationMinutes);
    }

    // Error handling

    private assertInvariants(): void {
        const status = this._status;
        const check = (condition: boolean, value: any, label: string) => {
            if (condition) {
                if (!value) this.throwInconsistent(`${label} is required for status ${status}.`);
                mustValidDate(label, value);
            } else if (value !== undefined) {
                this.throwInconsistent(`${label} cannot exist for status ${status}.`);
            }
        };

        if (!this._physicianId) this.throwInconsistent("Physician is required.");
        check(true, this._scheduledStartAt, "scheduledStartAt");
        if (this._scheduledDurationMinutes === undefined) this.throwInconsistent("Duration is required.");
        const isCheckedIn = [AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED].includes(status);
        const isStarted = [AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED].includes(status);
        const isCompleted = status === AppointmentStatus.COMPLETED;
        const isCancelled = status === AppointmentStatus.CANCELLED;
        check(isCheckedIn, this._checkedInAt, "checkedInAt");
        check(isStarted, this._startedAt, "startedAt");
        check(isCompleted, this._completedAt, "completedAt");
        check(status === AppointmentStatus.CANCELLED, this._cancelledAt, "cancelledAt");
        check(isCancelled, this._cancelReason, "cancelReason");
        check(status === AppointmentStatus.NO_SHOW, this._noShowAt, "noShowAt");
        assertDateOrder(this._checkedInAt, this._startedAt, this.throwInconsistent.bind(this), "Start time cannot be before check-in.");
        assertDateOrder(this._startedAt, this._completedAt, this.throwInconsistent.bind(this), "Completion time cannot be before start.");
    }

    // Methods

    private ensureStatus(allowed: AppointmentStatus, action: string): void {
        if (this._status !== allowed) {
            this.throwInconsistent(`Cannot ${action}: current status is ${this._status}, but expected ${allowed}.`);
        }
    }

    public rescheduleAppointment(input: { scheduledStartAt: Date; }): void {
        this.ensureStatus(AppointmentStatus.SCHEDULED, "reschedule");
        this._scheduledStartAt = input.scheduledStartAt;
        this._scheduledStartAt = mustValidDate("scheduledStartAt", input.scheduledStartAt);
        this.touch();
        this.assertInvariants();
    }

    public cancelAppointment(reason?: string, at: Date = new Date()): void {
        this.ensureStatus(AppointmentStatus.SCHEDULED, "cancel");
        this._status = AppointmentStatus.CANCELLED;
        this._cancelledAt = at;
        this._cancelReason = normalizeOptional(reason);
        this.touch(at);
        this.assertInvariants();
    }

    public markCheckedIn(at: Date = new Date()): void {
        this.ensureStatus(AppointmentStatus.SCHEDULED, "check-in");
        this._status = AppointmentStatus.CHECKED_IN;
        this._checkedInAt = at;
        this.touch(at);
        this.assertInvariants();
    }

    public markNoShow(at: Date = new Date()): void {
        this.ensureStatus(AppointmentStatus.SCHEDULED, "no-show");
        this._status = AppointmentStatus.NO_SHOW;
        this._noShowAt = at;
        this.touch(at);
        this.assertInvariants();
    }
    
    public markInProgress(at: Date): void {
        this.ensureStatus(AppointmentStatus.CHECKED_IN, "start");
        this._status = AppointmentStatus.IN_PROGRESS;
        this._startedAt = at;
        this.touch(at);
        this.assertInvariants();
    }

    public completeAppointment(at: Date): void {
        this.ensureStatus(AppointmentStatus.IN_PROGRESS, "complete");
        this._status = AppointmentStatus.COMPLETED;
        this._completedAt = at;
        this.touch(at);
        this.assertInvariants();
    }
}