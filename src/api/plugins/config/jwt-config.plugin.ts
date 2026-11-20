import { env } from '@/env.js';
/**
 * JWT configuration plugin for Fastify
 */
import jwt from '@fastify/jwt';
import { registerJwtAuth } from '@middleware/auth/jwt.js';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Plugin that configures JWT authentication for the Fastify instance
 */
const jwtConfigPlugin: FastifyPluginAsync = async (fastify): Promise<void> => {
	// Register JWT plugin
	if (!env.jwtSecret) {
		fastify.log.error('JWT_SECRET environment variable is not set. Exiting...');
		process.exit(1);
	}

	await fastify.register(jwt, {
		secret: env.jwtSecret,
		sign: {
			// Default options for token signing
			expiresIn: '1d',
		},
	});

	// Register JWT auth decorators
	registerJwtAuth(fastify, fastify.userService);

	// Add custom error handling for JWT verification failures
	fastify.setErrorHandler((error, request, reply) => {
		// Handle JWT verification errors
		if (
			error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' ||
			error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED' ||
			error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID'
		) {
			// Log the error
			request.log.error(error);

			// Return standardized error response
			reply.status(401).send({
				statusCode: 401,
				error: 'Unauthorized',
				message: 'Authentication required',
			});
			return;
		}

		// For other errors, pass to the default handler
		reply.send(error);
	});

	// Log successful configuration
	fastify.log.info('JWT authentication configured');
};

export default fp(jwtConfigPlugin, {
	name: 'jwtConfigPlugin',
	dependencies: ['userServicePlugin'],
});
