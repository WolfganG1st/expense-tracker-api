import { UserService } from '@services/user.service.js';
/**
 * User service plugin for Fastify
 */
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Declares User Service in Fastify
 */
declare module 'fastify' {
	interface FastifyInstance {
		userService: UserService;
	}
}

/**
 * Plugin that registers UserService with the Fastify instance
 */
const userServicePluginFunction: FastifyPluginAsync = async (fastify): Promise<void> => {
	const userService = new UserService(fastify.prisma);
	fastify.decorate('userService', userService);
	fastify.log.info('User service registered');
	await Promise.resolve('user service plugin initialized');
};

/**
 * Export the user service plugin
 */
export const userServicePlugin = fp(userServicePluginFunction, {
	name: 'userServicePlugin',
	dependencies: [],
});
