import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import { TransactionService } from '@services/transaction.service.js';
import type { FastifyPluginAsync } from 'fastify';

/**
 * Plugin that provides Transaction service functionality
 */
const transactionPluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	const transactionService = new TransactionService(fastify.prisma, fastify.log);

	// Decorate Fastify instance with the service
	fastify.decorate('transactionService', transactionService);

	// Add an await expression to satisfy linter
	await Promise.resolve('plugin initialized');

	// Clean up on close if needed
	fastify.addHook('onClose', async (instance) => {
		// Any cleanup code for transactionService if necessary
	});
};

// Export the plugin wrapped with our plugin utility
export const transactionPlugin = createPlugin(transactionPluginInternal, {
	name: pluginNames.transactionService,
	dependencies: [pluginNames.prisma],
});

// Add type definitions for the decorated fastify instance
declare module 'fastify' {
	interface FastifyInstance {
		transactionService: TransactionService;
	}
}
