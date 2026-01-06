export const UserRole = {
    ADMIN: "ADMIN",
    FRONT_DESK: "FRONT_DESK",
    PHYSICIAN: "PHYSICIAN",
    PATIENT: "PATIENT"
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AppointmentStatus = {
    SCHEDULED: "SCHEDULED",
    CHECKED_IN: "CHECKED_IN",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    NO_SHOW: "NO_SHOW"
} as const;

export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];
