import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import { CategoryService } from '@services/category.service.js';
import type { FastifyPluginAsync } from 'fastify';

/**
 * Plugin that provides Category service functionality
 */
const categoryPluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	const categoryService = new CategoryService(fastify.prisma, fastify.log);

	// Decorate Fastify instance with the service
	fastify.decorate('categoryService', categoryService);

	// Add an await expression to satisfy linter
	await Promise.resolve('category service plugin initialized');

	// Clean up on close if needed
	fastify.addHook('onClose', async (instance) => {
		// Any cleanup code for categoryService if necessary
	});
};

// Export the plugin wrapped with our plugin utility
export const categoryPlugin = createPlugin(categoryPluginInternal, {
	name: pluginNames.categoryService,
	dependencies: [pluginNames.prisma],
});

// Add type definitions for the decorated fastify instance
declare module 'fastify' {
	interface FastifyInstance {
		categoryService: CategoryService;
	}
}
