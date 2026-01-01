import { describe, it, expect } from "vitest";

import { Appointment } from "../Appointment.js";
import { AppointmentStatus } from "../AppointmentStatusEnum.js";
import { ServiceType } from "../ServiceEnum.js";
import { generateId } from "../../common/id.js";


function pickServiceType(): ServiceType {
    const values = Object.values(ServiceType);
    const firstString = values.find((v) => true);
    return (firstString ?? values[0]) as ServiceType;
}

function makeScheduled(overrides: Partial<Parameters<typeof Appointment.createScheduled>[0]> = {}) {
    return Appointment.createScheduled({
        id: generateId(),
        createdAt: new Date("2025-01-01T10:00:00.000Z"),
        updatedAt: new Date("2025-01-01T10:00:00.000Z"),

        patientId: generateId(),
        createdByUserId: generateId(),
        serviceType: pickServiceType(),

        physicianId: generateId(),
        scheduledStartAt: new Date("2025-01-02T10:00:00.000Z"),
        scheduledDurationMinutes: 30,

        notes: "Initial notes",
        ...overrides,
    });
}

describe("Appointment domain", () => {
    it("createScheduled creates SCHEDULED appointment", () => {
        const appt = makeScheduled();
        expect(appt.status).toBe(AppointmentStatus.SCHEDULED);
        expect(appt.physicianId).toBeTruthy();
        expect(appt.scheduledDurationMinutes).toBe(30);
    });

    it("scheduledEndAt is start + duration", () => {
        const appt = makeScheduled({
            scheduledStartAt: new Date("2025-01-02T10:00:00.000Z"),
            scheduledDurationMinutes: 45,
        });

        expect(appt.scheduledEndAt?.toISOString()).toBe("2025-01-02T10:45:00.000Z");
    });

    it("Entity normalizes updatedAt if updatedAt < createdAt", () => {
        const createdAt = new Date("2025-01-02T10:00:00.000Z");
        const updatedAt = new Date("2025-01-01T10:00:00.000Z");

        const appt = Appointment.createScheduled({
            id: generateId(),
            createdAt,
            updatedAt,
            patientId: generateId(),
            createdByUserId: generateId(),
            serviceType: pickServiceType(),
            physicianId: generateId(),
            scheduledStartAt: new Date("2025-01-02T10:00:00.000Z"),
            scheduledDurationMinutes: 30,
        });

        expect(appt.createdAt.toISOString()).toBe(createdAt.toISOString());
        expect(appt.updatedAt.toISOString()).toBe(createdAt.toISOString());
    });

    it("createScheduled rejects invalid scheduledStartAt", () => {
        expect(() => makeScheduled({ scheduledStartAt: new Date("not-a-date") })).toThrow();
    });

    it("createScheduled rejects invalid duration (<= 0)", () => {
        expect(() => makeScheduled({ scheduledDurationMinutes: 0 })).toThrow();
        expect(() => makeScheduled({ scheduledDurationMinutes: -10 })).toThrow();
    });

    it("markCheckedIn transitions SCHEDULED -> CHECKED_IN", () => {
        const appt = makeScheduled();
        const at = new Date("2025-01-02T09:55:00.000Z");

        appt.markCheckedIn(at);

        expect(appt.status).toBe(AppointmentStatus.CHECKED_IN);
        expect(appt.checkedInAt?.toISOString()).toBe(at.toISOString());
    });

    it("markInProgress transitions CHECKED_IN -> IN_PROGRESS", () => {
        const appt = makeScheduled();
        const checkInAt = new Date("2025-01-02T09:55:00.000Z");
        const startAt = new Date("2025-01-02T10:00:00.000Z");

        appt.markCheckedIn(checkInAt);
        appt.markInProgress(startAt);

        expect(appt.status).toBe(AppointmentStatus.IN_PROGRESS);
        expect(appt.startedAt?.toISOString()).toBe(startAt.toISOString());
    });

    it("cannot start before check-in", () => {
        const appt = makeScheduled();
        const checkInAt = new Date("2025-01-02T10:00:00.000Z");
        const startEarlier = new Date("2025-01-02T09:59:00.000Z");

        appt.markCheckedIn(checkInAt);
        expect(() => appt.markInProgress(startEarlier)).toThrow();
    });

    it("completeAppointment transitions IN_PROGRESS -> COMPLETED", () => {
        const appt = makeScheduled();
        const checkInAt = new Date("2025-01-02T09:55:00.000Z");
        const startAt = new Date("2025-01-02T10:00:00.000Z");
        const doneAt = new Date("2025-01-02T10:20:00.000Z");

        appt.markCheckedIn(checkInAt);
        appt.markInProgress(startAt);
        appt.completeAppointment(doneAt);

        expect(appt.status).toBe(AppointmentStatus.COMPLETED);
        expect(appt.completedAt?.toISOString()).toBe(doneAt.toISOString());
    });

    it("cannot complete before start", () => {
        const appt = makeScheduled();
        const checkInAt = new Date("2025-01-02T09:55:00.000Z");
        const startAt = new Date("2025-01-02T10:00:00.000Z");
        const doneEarlier = new Date("2025-01-02T09:59:00.000Z");

        appt.markCheckedIn(checkInAt);
        appt.markInProgress(startAt);

        expect(() => appt.completeAppointment(doneEarlier)).toThrow();
    });

    it("markNoShow transitions SCHEDULED -> NO_SHOW", () => {
        const appt = makeScheduled();
        const at = new Date("2025-01-02T10:05:00.000Z");

        appt.markNoShow(at);

        expect(appt.status).toBe(AppointmentStatus.NO_SHOW);
        expect(appt.noShowAt?.toISOString()).toBe(at.toISOString());
    });

    it("cannot cancel after CHECKED_IN rule", () => {
        const appt = makeScheduled();
        appt.markCheckedIn(new Date("2025-01-02T09:55:00.000Z"));
        expect(() => appt.cancelAppointment("Too late", new Date())).toThrow();
    });

    it("cancelAppointment requires a reason", () => {
        const appt = makeScheduled();
        expect(() => appt.cancelAppointment("", new Date())).toThrow();
    });

    it("cancelAppointment transitions SCHEDULED -> CANCELLED and saves reason", () => {
        const appt = makeScheduled();
        const cancelTime = new Date("2025-01-02T09:00:00.000Z");
        const reason = "Patient called to cancel";

        appt.cancelAppointment(reason, cancelTime);

        expect(appt.status).toBe(AppointmentStatus.CANCELLED);
        expect(appt.cancelledAt?.toISOString()).toBe(cancelTime.toISOString());
        expect(appt.cancelReason).toBe(reason);
    });

    it("reconstitute rejects inconsistent state (checkedInAt present while SCHEDULED)", () => {
        expect(() =>
            Appointment.reconstitute({
                id: generateId(),
                createdAt: new Date("2025-01-01T10:00:00.000Z"),
                updatedAt: new Date("2025-01-01T10:00:00.000Z"),

                patientId: generateId(),
                createdByUserId: generateId(),
                serviceType: pickServiceType(),

                physicianId: generateId(),
                scheduledStartAt: new Date("2025-01-02T10:00:00.000Z"),
                scheduledDurationMinutes: 30,

                status: AppointmentStatus.SCHEDULED,
                checkedInAt: new Date("2025-01-02T09:55:00.000Z"),
            })
        ).toThrow();
    });
});
