export interface ServiceDTO {
    id: string;
    name: string;
    durationMinutes: number;
    description?: string | undefined;
    price?: number | undefined;
}