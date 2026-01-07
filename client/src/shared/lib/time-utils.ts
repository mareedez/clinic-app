/**
 * Convert UTC timestamp to clinic local time
 */
export function convertUtcToClinicLocal(utcDate: Date, clinicUtcOffsetHours: number): Date {
    const offsetMs = clinicUtcOffsetHours * 60 * 60 * 1000;
    return new Date(utcDate.getTime() + offsetMs);
}

/**
 * Format a UTC time to clinic local HH:mm format
 */
export function formatClinicTime24Hour(date: Date | number, clinicUtcOffsetHours: number): string {
    const d = typeof date === "number" ? new Date(date) : new Date(date);
    const clinicDate = convertUtcToClinicLocal(d, clinicUtcOffsetHours);
    const hours = String(clinicDate.getUTCHours()).padStart(2, "0");
    const minutes = String(clinicDate.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

export function formatTime24Hour(date: Date | number): string {
    const d = typeof date === "number" ? new Date(date) : new Date(date);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

export function formatDateFull(date: Date | number): string {
    const d = typeof date === "number" ? new Date(date) : new Date(date);
    return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
