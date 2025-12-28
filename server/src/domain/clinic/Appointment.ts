import {Entity, type EntityProps} from "../common/Entity.js";
import {type EntityId} from "../common/id.js";
import {AppointmentStatus} from "./AppointmentStatusEnum.js";
import {ServiceType} from "./ServiceEnum.js";
import {addMinutes, mustPositiveInt, mustValidDate, normalizeOptional} from "../common/validateHelper.js";


export interface AppointmentProps extends EntityProps {
    patientId: EntityId;
    createdByUserId: EntityId;
    serviceType: ServiceType;

    // Self-Appointment
    requestedStartAt?: Date;
    requestedEndAt?: Date;
    notes?: string;

    // After Assignment
    physicianId?: EntityId;
    scheduledStartAt?: Date;
    scheduledDurationMinutes?: number;

    // State
    status: AppointmentStatus;

    // In Progress
    startedAt?: Date;

    // If Canceled
    cancelledAt?: Date;
    cancelReason?: string;

    // If no-Show
    noShowAt?: Date;

    // Once Completed Successfully
    completedAt?: Date;
}


export class Appointment extends Entity {
    private _patientId: EntityId;
    private _createdByUserId: EntityId;
    private _serviceType: ServiceType;
    private _requestedStartAt: Date | undefined;
    private _requestedEndAt: Date | undefined;
    private _notes: string | undefined;
    private _physicianId: EntityId | undefined;
    private _scheduledStartAt: Date | undefined;
    private _scheduledDurationMinutes: number | undefined;
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
        this._requestedStartAt = props.requestedStartAt ? mustValidDate("requestedStartAt", props.requestedStartAt) : undefined;
        this._requestedEndAt = props.requestedEndAt ? mustValidDate("requestedEndAt", props.requestedEndAt) : undefined;
        this._notes = normalizeOptional(props.notes);
        this._physicianId = props.physicianId;
        this._scheduledStartAt = props.scheduledStartAt ? mustValidDate("scheduledStartAt", props.scheduledStartAt) : undefined;
        this._scheduledDurationMinutes = props.scheduledDurationMinutes;
        this._startedAt = props.startedAt ? mustValidDate("startedAt", props.startedAt) : undefined;
        this._status = props.status;
        this._cancelledAt = props.cancelledAt ? mustValidDate("cancelledAt", props.cancelledAt) : undefined;
        this._cancelReason = normalizeOptional(props.cancelReason);
        this._noShowAt = props.noShowAt ? mustValidDate("noShowAt", props.noShowAt) : undefined;
        this._completedAt = props.completedAt ? mustValidDate("completedAt", props.completedAt) : undefined;
        this.assertInvariants();
    }


    get patientId(): EntityId {
        return this._patientId;
    }

    get createdByUserId(): EntityId {
        return this._createdByUserId;
    }

    get serviceType(): ServiceType {
        return this._serviceType;
    }

    get requestedStartAt(): Date | undefined {
        return this._requestedStartAt;
    }

    get requestedEndAt(): Date | undefined {
        return this._requestedEndAt;
    }

    get notes(): string | undefined {
        return this._notes;
    }

    get physicianId(): EntityId | undefined {
        return this._physicianId;
    }

    get scheduledStartAt(): Date | undefined {
        return this._scheduledStartAt;
    }

    get scheduledDurationMinutes(): number | undefined {
        return this._scheduledDurationMinutes;
    }

    get scheduledEndAt(): Date | undefined {
        if (!this._scheduledStartAt || this._scheduledDurationMinutes == undefined) return undefined;
        return addMinutes(this._scheduledStartAt, this._scheduledDurationMinutes);
    }

    get status(): AppointmentStatus {
        return this._status;
    }

    get cancelledAt(): Date | undefined {
        return this._cancelledAt;
    }

    get cancelReason(): string | undefined {
        return this._cancelReason;
    }

    get noShowAt(): Date | undefined {
        return this._noShowAt;
    }

    get startedAt(): Date | undefined {
        return this._startedAt;
    }

    get completedAt(): Date | undefined {
        return this._completedAt;
    }

    private assertInvariants(): void {

        if (this._requestedStartAt && this._requestedEndAt) {
            if (this._requestedEndAt <= this._requestedStartAt) {
                throw new Error("requestedEndAt must be after requestedStartAt.");
            }
        }

        if (this._status === AppointmentStatus.REQUESTED) {
            if (this._physicianId || this._scheduledStartAt || this._scheduledDurationMinutes != null) {
                throw new Error("REQUESTED appointment cannot include confirmed schedule fields.");
            }
        }

        if (this._status === AppointmentStatus.SCHEDULED) {
            if (!this._physicianId) throw new Error("SCHEDULED appointment must have physicianId.");
            if (!this._scheduledStartAt) throw new Error("SCHEDULED appointment must have scheduledStartAt.");
            if (this._scheduledDurationMinutes == null) throw new Error("SCHEDULED appointment must have scheduledDurationMinutes.");
            mustPositiveInt("scheduledDurationMinutes", this._scheduledDurationMinutes);
        }

        if (this._status === AppointmentStatus.IN_PROGRESS) {
            if (!this._physicianId) throw new Error("IN_PROGRESS appointment must have physicianId.");
            if (!this._scheduledStartAt) throw new Error("IN_PROGRESS appointment must have scheduledStartAt.");
            if (this._scheduledDurationMinutes == null) throw new Error("IN_PROGRESS appointment must have scheduledDurationMinutes.");
            mustPositiveInt("scheduledDurationMinutes", this._scheduledDurationMinutes);
            if (!this._startedAt) throw new Error("IN_PROGRESS appointment must include startedAt.");
        }

        if (this._status === AppointmentStatus.CANCELLED && !this._cancelledAt) {
            throw new Error("CANCELLED appointment must include cancelledAt.");
        }

        if (this._status !== AppointmentStatus.CANCELLED && this._cancelledAt) {
            throw new Error("cancelledAt can only exist when status is CANCELLED.");
        }

        if (this._status === AppointmentStatus.NO_SHOW && !this._noShowAt) {
            throw new Error("NO_SHOW appointment must include noShowAt.");
        }

        if (this._status !== AppointmentStatus.NO_SHOW && this._noShowAt) {
            throw new Error("noShowAt can only exist when status is NO_SHOW.");
        }

        if (this._status === AppointmentStatus.COMPLETED && !this._completedAt) {
            throw new Error("COMPLETED appointment must include completedAt.");
        }

        if (this._status !== AppointmentStatus.COMPLETED && this._completedAt) {
            throw new Error("completedAt can only exist when status is COMPLETED.");
        }
    }


    //Actions
    public requestAppointment(){
        this._status = AppointmentStatus.REQUESTED;
    }

    public scheduleAppointment(input: {
            physicianId: EntityId;
            scheduledStartAt: Date;
            durationMinutes: number;
            serviceType: ServiceType;
    }): void {
        this.ensureIsActiveAppointment("schedule");
        this._physicianId = input.physicianId;
        this._scheduledStartAt = mustValidDate("scheduledStartAt", input.scheduledStartAt);
        this._scheduledDurationMinutes = mustPositiveInt("durationMinutes", input.durationMinutes);
        this._status = AppointmentStatus.SCHEDULED;
        this._serviceType = input.serviceType;
        this.touch();
        this.assertInvariants();
    }

    public cancelAppointment(reason?: string, at: Date = new Date()): void {
        this.ensureIsActiveAppointment("cancel");
        this._status = AppointmentStatus.CANCELLED;
        this._cancelledAt = mustValidDate("cancelledAt", at);
        this._cancelReason = normalizeOptional(reason);
        this.touch(at);
        this.assertInvariants();
    }

    public markNoShow(at: Date = new Date()): void {
        this.ensureIsActiveAppointment("markNoShow");
        if (this._status !== AppointmentStatus.SCHEDULED) {
            throw new Error("Only SCHEDULED appointments can be marked as NO_SHOW.");
        }
        this._status = AppointmentStatus.NO_SHOW;
        this._noShowAt = mustValidDate("noShowAt", at);
        this.touch(at);
        this.assertInvariants();
    }

    public markInProgress(at: Date = new Date()): void{
        this.ensureIsActiveAppointment("markInProgress");
        if (this._status !== AppointmentStatus.SCHEDULED) {
            throw new Error("Only SCHEDULED appointments can be marked as IN_PROGRESS.");
        }
        this._startedAt = mustValidDate("startedAt", at)
        this._status = AppointmentStatus.IN_PROGRESS;
        this.touch(at);
        this.assertInvariants();
    }

    public completeAppointment(at: Date = new Date()): void {
        this.ensureIsActiveAppointment("complete");
        if (this._status !== AppointmentStatus.IN_PROGRESS) {
            throw new Error("Only IN_PROGRESS appointments can be marked as COMPLETED.");
        }
        this._status = AppointmentStatus.COMPLETED;
        this._completedAt = mustValidDate("completedAt", at);
        this.touch(at);
        this.assertInvariants();
    }

    private ensureIsActiveAppointment(action: string): void {
        if (
            this._status === AppointmentStatus.CANCELLED ||
            this._status === AppointmentStatus.NO_SHOW ||
            this._status === AppointmentStatus.COMPLETED
        ) {
            throw new Error(`Cannot ${action}: appointment is ${this._status}.`);
        }
    }
}
