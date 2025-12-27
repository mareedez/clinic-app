import {randomUUID} from "node:crypto";

export type EntityId = string;

export function generateId(): EntityId {
  return randomUUID();
}