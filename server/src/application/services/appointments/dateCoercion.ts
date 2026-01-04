import { mustValidDate } from "../../../domain/common/validateHelper.js";

export function toDate(field: string, value: Date | string): Date {
    const d = value instanceof Date ? value : new Date(value);
    return mustValidDate(field, d);
}