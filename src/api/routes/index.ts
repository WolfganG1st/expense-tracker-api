import { env } from '@/env.js';
import type { FastifyInstance } from 'fastify';
import { categoryRoutes } from './category.routes.js';
import { transactionsRoutes } from './transactions.routes.js';
import { merchantsRoutes } from './merchants.routes.js';
import { reportRoutes } from './report.routes.js';
import { authRoutes } from './auth.routes.js';
import { profileRoutes } from './profile.routes.js';
import { usersRoutes } from './users.routes.js';

/**
 * Registers all application routes with the Fastify instance
 * @param server - Fastify server instance
 * @returns void
 */
export function registerRoutes(server: FastifyInstance): void {
	// Auth routes
	server.register(authRoutes, { prefix: '/api/auth' });
	server.register(profileRoutes, { prefix: '/api/profile' });
	server.register(usersRoutes, { prefix: '/api/users' });

	// Feature routes
	server.register(transactionsRoutes, { prefix: '/api/transactions' });
	server.register(merchantsRoutes, { prefix: '/api/merchants' });
	server.register(categoryRoutes, { prefix: '/api/categories' });
	server.register(reportRoutes, { prefix: '/api/reports' });

	// Health check route
	server.get('/health', () => {
		return { status: 'ok', environment: env.nodeEnv, version: '1.0.0' };
	});
}
