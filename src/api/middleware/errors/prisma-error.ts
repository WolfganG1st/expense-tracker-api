/**
 * Checks if the provided error is a Prisma error of one or more specified types.
 *
 * Due to how Node.js and TypeScript handle module resolution, especially in monorepos
 * or environments with multiple dependencies, the Prisma error object might not be
 * recognized by `instanceof` checks. This function compares the error's `name`
 * property for robust, reliable detection.
 *
 * Usage:
 *   if (isPrismaError(error, 'PrismaClientKnownRequestError')) {
 *     // handle specific Prisma error
 *   }
 *
 * or
 *
 *   if (isPrismaError(error, ['PrismaClientKnownRequestError', 'PrismaClientValidationError'])) {
 *     // handle multiple Prisma errors
 *   }
 *
 * @param error The error object to check.
 * @param names A string or array of strings representing Prisma error names to check against.
 * @returns boolean indicating whether the error matches one of the provided Prisma error names.
 */
type PrismaErrorName = 'PrismaClientKnownRequestError' | string;

function isPrismaError(error: unknown, names: PrismaErrorName | PrismaErrorName[]): boolean {
	if (!error || typeof error !== 'object') {
		return false;
	}

	const errorNames = Array.isArray(names) ? names : [names];
	return errorNames.includes((error as { name: string }).name);
}

export function isPrismaErrorCode(error: unknown, name: string, code: string): boolean {
	return isPrismaError(error, name) && (error as { code: string }).code === code;
}
