export class UseCaseError extends Error {
    public readonly code: string;

    constructor(code: string, message: string) {
        super(message);
        this.code = code;
        this.name = "UseCaseError";
    }
}

export class NotFoundError extends UseCaseError {
    constructor(message = "Resource not found") {
        super("NOT_FOUND", message);
        this.name = "NotFoundError";
    }
}

export class ForbiddenError extends UseCaseError {
    constructor(message = "Forbidden") {
        super("FORBIDDEN", message);
        this.name = "ForbiddenError";
    }
}

export class ValidationError extends UseCaseError {
    constructor(message = "Validation error") {
        super("VALIDATION_ERROR", message);
        this.name = "ValidationError";
    }
}
