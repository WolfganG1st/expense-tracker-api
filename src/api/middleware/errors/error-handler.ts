import { env } from '@/env.js';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './errors.js';

type ErrorHandler = (error: unknown, reply: FastifyReply, isProduction: boolean) => boolean;

type ValidationIssue = {
	instancePath: string;
	message: string;
};

function formatZodIssues(issues: ValidationIssue[]) {
	const formattedErrors: Record<string, { _errors: string[] }> = {};
	for (const issue of issues) {
		const key = issue.instancePath.substring(1) || 'general';
		if (!formattedErrors[key]) {
			formattedErrors[key] = { _errors: [] };
		}
		formattedErrors[key]._errors.push(issue.message);
	}
	return formattedErrors;
}

const errorHandlers: ErrorHandler[] = [
	(error, reply, isProduction) => {
		if (!(error instanceof ZodError)) {
			return false;
		}

		reply.status(400).send({
			statusCode: 400,
			error: 'Bad Request',
			message: 'Validation error',
			validation: isProduction ? undefined : error.format(),
		});
		return true;
	},

	(error, reply) => {
		if (!(error instanceof AppError)) {
			return false;
		}

		reply.status(error.statusCode).send({
			statusCode: error.statusCode,
			error: error.name,
			message: error.message,
		});
		return true;
	},

	(error, reply, isProduction) => {
		if (!isFastifyError(error) || !error.validation) {
			return false;
		}

		const formattedValidation = formatZodIssues(error.validation as ValidationIssue[]);

		reply.status(400).send({
			statusCode: 400,
			error: 'Bad Request',
			message: 'Validation error',
			validation: isProduction ? undefined : formattedValidation,
		});
		return true;
	},

	(error, reply) => {
		if (!isFastifyError(error)) {
			return false;
		}

		const isJwtError = [
			'FST_JWT_NO_AUTHORIZATION_IN_HEADER',
			'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED',
			'FST_JWT_AUTHORIZATION_TOKEN_INVALID',
		].includes(error.code);

		if (!isJwtError) {
			return false;
		}

		reply.status(401).send({
			statusCode: 401,
			error: 'Unauthorized',
			message: 'Authentication required',
		});
		return true;
	},
];

export function globalErrorHandler(
	error: FastifyError | ZodError | Error,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	request.log.error(error);
	const isProduction = env.nodeEnv === 'production';

	const isHandled = errorHandlers.some((handler) => handler(error, reply, isProduction));

	if (!isHandled) {
		const statusCode = isFastifyError(error) ? (error.statusCode ?? 500) : 500;
		reply.status(statusCode).send({
			statusCode,
			error: error.name || 'Internal Server Error',
			message: statusCode === 500 && isProduction ? 'Unexpected error' : error.message,
		});
	}
}

function isFastifyError(error: unknown): error is FastifyError & { validation?: unknown } {
	return 'statusCode' in (error as FastifyError) && 'code' in (error as FastifyError);
}
