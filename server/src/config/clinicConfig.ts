export const CLINIC_CONFIG = {
    booking: {
        minDaysInAdvance: 1,
        maxDaysInAdvance: 90,
        cancellationWindowHours: 24,
        slotIncrementMs: 10 * 60 * 1000,
        minGapBetweenAppointmentsMs: 10 * 60 * 1000
    },
    timezone: {
        iana: "America/Los_Angeles",
        utcOffsetHours: -8
    }
} as const;
