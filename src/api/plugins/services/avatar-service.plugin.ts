import { env } from '@/env.js';
import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import { AvatarService } from '@services/avatar.service.js';
import type { FastifyPluginAsync } from 'fastify';

const avatarServicePluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	const avatarService = new AvatarService(fastify.uploadDir, env.baseUrl);
	fastify.decorate('avatarService', avatarService);
	await Promise.resolve('avatar service plugin initialized');
};

export const avatarServicePlugin = createPlugin(avatarServicePluginInternal, {
	name: pluginNames.avatarService,
	dependencies: [pluginNames.staticFiles],
});

declare module 'fastify' {
	interface FastifyInstance {
		avatarService: AvatarService;
	}
}
