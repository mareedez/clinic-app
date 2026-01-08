export const UserRole = {
    FRONT_DESK: "FRONT_DESK",
    PHYSICIAN: "PHYSICIAN",
    PATIENT: "PATIENT"
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];