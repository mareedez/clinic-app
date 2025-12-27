export function mustNonEmpty(label: string, value: string): string {
    const v = value.trim();
    if (!v) throw new Error(`${label} is required.`);
    return v;
}

export function normalizeOptional(value?: string): string | undefined {
    const v = value?.trim();
    return v ? v : undefined;
}
