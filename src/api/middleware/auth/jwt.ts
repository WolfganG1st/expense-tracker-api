import type { UserRole } from '@schemas/user.schema.js';
import type { UserService } from '@services/user.service.js';
/**
 * JWT authentication middleware
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Type for extending FastifyInstance with authentication methods
 */
export interface AuthenticatedInstance extends FastifyInstance {
	authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
	requireRoles: (roles: readonly UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

/**
 * Type for JWT payload
 */
export type JwtPayload = {
	readonly id: string;
	readonly email: string;
	readonly role: UserRole;
	readonly iat?: number;
	readonly exp?: number;
};

/**
 * @description Registers JWT authentication decorators on a Fastify instance
 * @param fastify - Fastify instance to decorate
 * @param userService - User service for role verification
 */
export function registerJwtAuth(fastify: FastifyInstance, userService: UserService): void {
	fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			await request.jwtVerify();
		} catch (err) {
			// Don't throw, instead return a proper response
			reply.code(401).send({
				statusCode: 401,
				error: 'Unauthorized',
				message: 'Authentication required',
			});
			return reply;
		}
	});

	fastify.decorate(
		'requireRoles',
		(roles: readonly UserRole[]) => async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				await fastify.authenticate(request, reply);

				const { id, role } = request.user;

				if (role === 'ADMIN') {
					return;
				}

				// For non-admins, check if their role is in the allowed roles
				const hasRequiredRole = await userService.hasRole(id, role);
				if (!hasRequiredRole) {
					return reply.code(403).send({
						statusCode: 403,
						error: 'Forbidden',
						message: 'Insufficient permissions',
					});
				}
			} catch (err) {
				const statusCode = (err as { statusCode?: number }).statusCode || 403;
				return reply.code(statusCode).send({
					statusCode,
					error: statusCode === 401 ? 'Unauthorized' : 'Forbidden',
					message: (err as Error).message || 'Access denied',
				});
			}
		},
	);
}
