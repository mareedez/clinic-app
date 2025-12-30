export function mustNonEmpty(label: string, value: string): string {
    const v = value.trim();
    if (!v) throw new Error(`${label} is required.`);
    return v;
}

export function normalizeOptional(value?: string): string | undefined {
    const v = value?.trim();
    return v ? v : undefined;
}

export function mustPositiveInt(label: string, value: number): number {
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${label} must be a positive integer.`);
    }
    return value;
}

export function mustValidDate(label: string, value: Date): Date {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
        throw new Error(`${label} must be a valid Date.`);
    }
    return value;
}

export function addMinutes(start: Date, minutes: number): Date {
    return new Date(start.getTime() + minutes * 60_000);
}

export function assertDateOrder(
    earlier: Date | undefined,
    later: Date | undefined,
    onFailure: (message: string) => never,
    message: string
): void {
    if (earlier && later && later < earlier) {
        onFailure(message);
    }
}

