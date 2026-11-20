import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import { MerchantService } from '@services/merchant.service.js';
import type { FastifyPluginAsync } from 'fastify';

const merchantServicePluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	const merchantService = new MerchantService(fastify.prisma, fastify.log);
	fastify.decorate('merchantService', merchantService);
	await Promise.resolve('merchant service plugin initialized');
};

export const merchantServicePlugin = createPlugin(merchantServicePluginInternal, {
	name: pluginNames.merchantService,
	dependencies: [pluginNames.prisma],
});

declare module 'fastify' {
	interface FastifyInstance {
		merchantService: MerchantService;
	}
}
