import { generateId, type EntityId } from "./id.js";

export interface EntityProps {
    readonly id?: EntityId;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}

export abstract class Entity {
    public readonly id: EntityId;
    public readonly createdAt: Date;
    public updatedAt: Date;

    protected constructor(props: EntityProps = {}) {
        const now = new Date();

        this.id = props.id ?? generateId();
        this.createdAt = props.createdAt ?? now;

        const proposedUpdatedAt = props.updatedAt ?? this.createdAt;
        this.updatedAt = proposedUpdatedAt < this.createdAt ? this.createdAt : proposedUpdatedAt;
    }

    protected touch(now: Date = new Date()): void {
        this.updatedAt = now;
    }
}
