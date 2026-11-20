import { CategoryController } from '@controllers/index.js';
import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import type { FastifyPluginAsync } from 'fastify';

/**
 * Plugin that provides Category controller
 * Depends on categoryPlugin
 */
const categoryControllerPluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	// Create controller instance using the injected service
	const categoryController = new CategoryController(fastify.categoryService);

	// Decorate Fastify instance with the controller
	fastify.decorate('categoryController', categoryController);

	// Add an await expression to satisfy linter
	await Promise.resolve('category controller plugin initialized');
};

// Export the plugin wrapped with our plugin utility
export const categoryControllerPlugin = createPlugin(categoryControllerPluginInternal, {
	name: pluginNames.categoryController,
	dependencies: [pluginNames.categoryService], // This plugin depends on categoryService
});

// Add type definitions for the decorated fastify instance
declare module 'fastify' {
	interface FastifyInstance {
		categoryController: CategoryController;
	}
}
