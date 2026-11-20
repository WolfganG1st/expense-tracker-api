export class AppError extends Error {
	public readonly statusCode: number;
	public readonly cause?: unknown;

	constructor(message: string, statusCode = 500, cause?: unknown) {
		super(message);
		this.statusCode = statusCode;
		this.cause = cause;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class EntityNotFoundError extends AppError {
	constructor(entityName: string, cause?: unknown) {
		super(`${entityName} not found`, 404, cause);
	}
}

export class EntityAlreadyExistsError extends AppError {
	constructor(entityName: string, cause?: unknown) {
		super(`${entityName} already exists`, 409, cause);
	}
}

export class InvalidCredentialsError extends AppError {
	constructor(cause?: unknown) {
		super('Invalid credentials', 401, cause);
	}
}

export class UserNotFoundError extends AppError {
	constructor(cause?: unknown) {
		super('User not found', 404, cause);
	}
}
