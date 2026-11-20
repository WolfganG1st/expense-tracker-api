/**
 * Request sanitization middleware
 * Provides functions to clean and sanitize user input
 */
import type { FastifyRequest } from 'fastify';

/**
 * Sanitizes string input to prevent XSS attacks
 * @param input - String to sanitize
 * @returns Sanitized string
 */
function sanitizeString(input: string): string {
	if (!input) {
		return '';
	}

	// Replace potentially dangerous characters
	return input
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.replace(/\//g, '&#x2F;')
		.replace(/\\/g, '&#x5C;')
		.replace(/`/g, '&#96;');
}

/**
 * Recursively sanitizes all string values in an object
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
	// Create a new object with the same properties
	const result = { ...obj } as Record<string, unknown>;

	// Use for...of with Object.entries for better type safety and lint compliance
	for (const [key, value] of Object.entries(result)) {
		if (typeof value === 'string') {
			result[key] = sanitizeString(value);
		} else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
			result[key] = sanitizeObject(value as Record<string, unknown>);
		} else if (Array.isArray(value)) {
			result[key] = value.map((item) => {
				if (typeof item === 'object' && item !== null) {
					return sanitizeObject(item as Record<string, unknown>);
				}
				if (typeof item === 'string') {
					return sanitizeString(item);
				}
				return item;
			});
		}
	}

	return result as T;
}

/**
 * Request sanitization hook for Fastify
 * @param request - Fastify request
 */
export function sanitizeRequest(request: FastifyRequest): void {
	if (request.body && typeof request.body === 'object') {
		request.body = sanitizeObject(request.body as Record<string, unknown>);
	}

	if (request.query && typeof request.query === 'object') {
		request.query = sanitizeObject(request.query as Record<string, unknown>);
	}

	if (request.params && typeof request.params === 'object') {
		request.params = sanitizeObject(request.params as Record<string, unknown>);
	}
}
