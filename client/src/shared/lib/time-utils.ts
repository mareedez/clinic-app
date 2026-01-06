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
