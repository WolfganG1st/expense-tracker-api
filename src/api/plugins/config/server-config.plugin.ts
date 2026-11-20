import type { ServerConfig } from '@/api/types/app-config.types.js';
import { env } from '@/env.js';
import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import type { FastifyPluginAsync } from 'fastify';

/**
 * Plugin that provides server configuration
 */
const serverConfigPluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	// Load configuration from environment variables with sensible defaults
	const serverConfig: ServerConfig = {
		port: env.port,
		host: env.host,
		nodeEnv: env.nodeEnv,
		logLevel: env.logLevel,
	};

	// Decorate Fastify instance with the configuration
	fastify.decorate('serverConfig', serverConfig);

	// Add an await expression to satisfy linter
	await Promise.resolve('server config plugin initialized');
};

// Export the plugin wrapped with our plugin utility
export const serverConfigPlugin = createPlugin(serverConfigPluginInternal, {
	name: pluginNames.serverConfig,
	dependencies: [], // No dependencies for this plugin as it's one of the first to be registered
});

// Add type definitions for the decorated fastify instance
declare module 'fastify' {
	interface FastifyInstance {
		serverConfig: ServerConfig;
	}
}
