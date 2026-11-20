import { UserController } from '@controllers/user.controller.js';
import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
/**
 * User controller plugin for Fastify
 */
import type { FastifyPluginAsync } from 'fastify';

/**
 * Plugin that registers UserController with the Fastify instance
 */
const userControllerPluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	// Create controller instance with injected user service
	const userController = new UserController(fastify.userService);

	await Promise.resolve('controller plugin initialized');

	// Decorate Fastify instance with controller
	fastify.decorate('userController', userController);

	// Log successful registration
	fastify.log.info('User controller registered');
};

export const userControllerPlugin = createPlugin(userControllerPluginInternal, {
	name: pluginNames.userController,
	dependencies: [pluginNames.userService],
});

// Add type definitions for the decorated fastify instance
declare module 'fastify' {
	interface FastifyInstance {
		userController: UserController;
	}
}
