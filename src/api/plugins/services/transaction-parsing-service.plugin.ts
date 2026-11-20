import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import { TransactionParsingService } from '@services/transaction-parsing.service.js';
import type { FastifyPluginAsync } from 'fastify';

/**
 * Plugin that provides TransactionParsing service functionality
 * No dependencies
 */
const transactionParsingServicePluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	const transactionParsingService = new TransactionParsingService(fastify.llmService);
	fastify.decorate('transactionParsingService', transactionParsingService);
	await Promise.resolve('transaction parsing service plugin initialized');
	fastify.addHook('onClose', async () => {
		// Any cleanup code for transactionParsingService if necessary
	});
};

export const transactionParsingServicePlugin = createPlugin(transactionParsingServicePluginInternal, {
	name: pluginNames.transactionParsingService,
});

declare module 'fastify' {
	interface FastifyInstance {
		transactionParsingService: TransactionParsingService;
	}
}
