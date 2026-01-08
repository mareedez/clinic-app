export type EntityId = string;
export const generateId = (): EntityId => crypto.randomUUID();