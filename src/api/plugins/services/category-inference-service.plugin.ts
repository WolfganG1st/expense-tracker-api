import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import { CategoryInferenceService } from '@services/category-inference.service.js';
import type { FastifyPluginAsync } from 'fastify';

/**
 * Plugin that provides CategoryInference service functionality
 */
const categoryInferencePluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	const categoryInferenceService = new CategoryInferenceService(fastify.llmService, fastify.categoryService);
	fastify.decorate('categoryInferenceService', categoryInferenceService);
	await Promise.resolve('category inference service plugin initialized');
	fastify.addHook('onClose', async () => {
		// Any cleanup code for categoryInferenceService if necessary
	});
};

export const categoryInferencePlugin = createPlugin(categoryInferencePluginInternal, {
	name: pluginNames.categoryInferenceService,
	dependencies: [pluginNames.llmService, pluginNames.categoryService],
});

declare module 'fastify' {
	interface FastifyInstance {
		categoryInferenceService: CategoryInferenceService;
	}
}
