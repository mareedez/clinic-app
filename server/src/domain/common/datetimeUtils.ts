export function getUtcDayStart(date: Date): Date {
    const utcDate = new Date(date);
    return new Date(Date.UTC(
        utcDate.getUTCFullYear(),
        utcDate.getUTCMonth(),
        utcDate.getUTCDate(),
        0, 0, 0, 0
    ));
}

export function getUtcDayEnd(date: Date): Date {
    const utcDate = new Date(date);
    return new Date(Date.UTC(
        utcDate.getUTCFullYear(),
        utcDate.getUTCMonth(),
        utcDate.getUTCDate(),
        23, 59, 59, 999
    ));
}
/**
 * Safely compares timestamps with tolerance for millisecond precision differences
 */
export function areTimestampsEqual(
    timestamp1: Date | number,
    timestamp2: Date | number,
    toleranceMs: number = 0
): boolean {
    const t1 = typeof timestamp1 === 'number' ? timestamp1 : timestamp1.getTime();
    const t2 = typeof timestamp2 === 'number' ? timestamp2 : timestamp2.getTime();
    return Math.abs(t1 - t2) <= toleranceMs;
}
/**
 * Converts a UTC Date to clinic local time Date
 */
export function convertUtcToClinicLocal(utcDate: Date, clinicUtcOffsetHours: number): Date {
    const offsetMs = clinicUtcOffsetHours * 60 * 60 * 1000;
    return new Date(utcDate.getTime() + offsetMs);
}

/**
 * Converts a clinic local time Date to UTC Date
 */
export function convertClinicLocalToUtc(localDate: Date, clinicUtcOffsetHours: number): Date {
    const offsetMs = clinicUtcOffsetHours * 60 * 60 * 1000;
    return new Date(localDate.getTime() - offsetMs);
}

/**
 * Gets the start of a day in clinic local time (00:00:00.000)
 */
export function getClinicDayStart(date: Date, clinicUtcOffsetHours: number): Date {
    const localDate = convertUtcToClinicLocal(date, clinicUtcOffsetHours);
    const year = localDate.getUTCFullYear();
    const month = localDate.getUTCMonth();
    const day = localDate.getUTCDate();

    const localMidnight = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return convertClinicLocalToUtc(localMidnight, clinicUtcOffsetHours);
}

/**
 * Gets the end of a day in clinic local time (23:59:59.999)
 */
export function getClinicDayEnd(date: Date, clinicUtcOffsetHours: number): Date {
    const localDate = convertUtcToClinicLocal(date, clinicUtcOffsetHours);
    const year = localDate.getUTCFullYear();
    const month = localDate.getUTCMonth();
    const day = localDate.getUTCDate();

    const localEndOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    return convertClinicLocalToUtc(localEndOfDay, clinicUtcOffsetHours);
}

/**
 * Creates a Date representing a specific clinic local date and time, stored as UTC
 */
export function createClinicLocalDate(
    year: number,
    month: number,
    day: number,
    hours: number,
    minutes: number,
    clinicUtcOffsetHours: number
): Date {

    const localDate = new Date(Date.UTC(year, month, day, hours, minutes, 0));
    return convertClinicLocalToUtc(localDate, clinicUtcOffsetHours);
}
