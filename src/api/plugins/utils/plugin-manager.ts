import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Plugin registration options
 */
export type PluginRegistrationOptions = {
	name: string;
	dependencies?: string[];
};

/**
 * Creates a plugin with proper registration options
 *
 * @param plugin - The plugin implementation
 * @param options - Plugin registration options
 * @returns A properly configured Fastify plugin
 */
export function createPlugin(plugin: FastifyPluginAsync, options: PluginRegistrationOptions): FastifyPluginAsync {
	return fp(plugin, options);
}

/**
 * Registers plugins in dependency order
 *
 * @param server - Fastify instance
 * @param plugins - Array of plugins to register
 * @returns Promise that resolves when all plugins are registered
 */
export async function registerPlugins(
	server: FastifyInstance,
	plugins: Array<{ plugin: FastifyPluginAsync; order: number }>,
): Promise<void> {
	// Sort plugins by their order (lower numbers first)
	const sortedPlugins = [...plugins].sort((a, b) => a.order - b.order);

	// Register each plugin in order
	for (const { plugin } of sortedPlugins) {
		await server.register(plugin);
	}
}
