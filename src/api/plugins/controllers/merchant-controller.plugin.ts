import { MerchantController } from '@controllers/merchant.controller.js';
import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import type { FastifyPluginAsync } from 'fastify';

const merchantControllerPluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	const merchantController = new MerchantController(fastify.merchantService);
	fastify.decorate('merchantController', merchantController);
	await Promise.resolve('merchant controller plugin initialized');
};

export const merchantControllerPlugin = createPlugin(merchantControllerPluginInternal, {
	name: pluginNames.merchantController,
	dependencies: [pluginNames.merchantService],
});

declare module 'fastify' {
	interface FastifyInstance {
		merchantController: MerchantController;
	}
}
