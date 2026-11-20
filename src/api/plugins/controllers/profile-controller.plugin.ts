import { ProfileController } from '@controllers/profile.controller.js';
import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import type { FastifyPluginAsync } from 'fastify';

const profileControllerPluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	const profileController = new ProfileController(fastify.userService);
	await Promise.resolve('controller plugin initialized');
	fastify.decorate('profileController', profileController);
	fastify.log.info('Profile controller registered');
};

export const profileControllerPlugin = createPlugin(profileControllerPluginInternal, {
	name: pluginNames.profileController,
	dependencies: [pluginNames.userService],
});

declare module 'fastify' {
	interface FastifyInstance {
		profileController: ProfileController;
	}
}
