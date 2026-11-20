import { TransactionController } from '@controllers/index.js';
import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import type { FastifyPluginAsync } from 'fastify';

/**
 * Plugin that provides Transaction controller
 * Depends on transactionPlugin
 */
const transactionControllerPluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	// Create controller instance using the injected service
	const transactionController = new TransactionController(
		fastify.transactionService,
		fastify.transactionParsingService,
		fastify.categoryInferenceService,
		fastify.categoryService,
		fastify.merchantService,
		fastify.log,
	);

	// Decorate Fastify instance with the controller
	fastify.decorate('transactionController', transactionController);

	// Add an await expression to satisfy linter
	await Promise.resolve('controller plugin initialized');
};

// Export the plugin wrapped with our plugin utility
export const transactionControllerPlugin = createPlugin(transactionControllerPluginInternal, {
	name: pluginNames.transactionController,
	dependencies: [
		pluginNames.transactionService,
		pluginNames.categoryService,
		pluginNames.categoryInferenceService,
		pluginNames.merchantService,
		pluginNames.llmService,
	],
});

// Add type definitions for the decorated fastify instance
declare module 'fastify' {
	interface FastifyInstance {
		transactionController: TransactionController;
	}
}
