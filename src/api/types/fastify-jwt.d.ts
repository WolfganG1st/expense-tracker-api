/**
 * Type declarations for Fastify JWT and authentication
 */
import 'fastify';
import type { JwtPayload } from '@middleware/auth/jwt';
import type { UserRole } from '@schemas/user.schema';

/**
 * Extend FastifyInstance to include auth methods
 */
declare module 'fastify' {
	interface FastifyInstance {
		/**
		 * Authenticates a request by verifying the JWT token
		 */
		authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

		/**
		 * Requires specific roles for a route
		 */
		requireRoles: (roles: readonly UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
	}
}

declare module '@fastify/jwt' {
	interface FastifyJWT {
		payload: JwtPayload;
		user: JwtPayload;
	}
}
