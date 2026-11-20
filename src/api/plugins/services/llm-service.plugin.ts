import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import { LlmService } from '@services/llm.service.js';
import type { FastifyPluginAsync } from 'fastify';

/**
 * Plugin that provides LLM service functionality
 * No dependencies
 */
const llmServicePluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	const llmService = new LlmService(fastify.log);
	fastify.decorate('llmService', llmService);
	await Promise.resolve('llm service plugin initialized');
	fastify.addHook('onClose', async () => {
		// Any cleanup code for llmService if necessary
	});
};

export const llmServicePlugin = createPlugin(llmServicePluginInternal, {
	name: pluginNames.llmService,
});

declare module 'fastify' {
	interface FastifyInstance {
		llmService: LlmService;
	}
}
