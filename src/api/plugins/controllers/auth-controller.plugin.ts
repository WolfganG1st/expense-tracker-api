import { AuthController } from '@controllers/auth.controller.js';
import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import type { FastifyPluginAsync } from 'fastify';

const authControllerPluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	const authController = new AuthController(fastify.userService);
	await Promise.resolve('controller plugin initialized');
	fastify.decorate('authController', authController);
	fastify.log.info('Auth controller registered');
};

export const authControllerPlugin = createPlugin(authControllerPluginInternal, {
	name: pluginNames.authController,
	dependencies: [pluginNames.userService],
});

declare module 'fastify' {
	interface FastifyInstance {
		authController: AuthController;
	}
}
