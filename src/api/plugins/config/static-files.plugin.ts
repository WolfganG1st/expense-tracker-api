import fastifyStatic from '@fastify/static';
import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import type { FastifyPluginAsync } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';

const staticFilesPluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	const uploadDir = path.join(process.cwd(), 'uploads');
	fs.mkdirSync(uploadDir, { recursive: true });
	await fastify.register(fastifyStatic, {
		root: uploadDir,
		prefix: '/static/',
	});
	fastify.decorate('uploadDir', uploadDir);
	await Promise.resolve('static files plugin initialized');
};

export const staticFilesPlugin = createPlugin(staticFilesPluginInternal, {
	name: pluginNames.staticFiles,
});

declare module 'fastify' {
	interface FastifyInstance {
		uploadDir: string;
	}
}
