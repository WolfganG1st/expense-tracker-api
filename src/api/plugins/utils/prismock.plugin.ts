import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import type { PrismaClient } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { PrismockClient } from 'prismock';

declare module 'fastify' {
	interface FastifyInstance {
		prisma: PrismaClient;
	}
}

const prismockPluginInternal: FastifyPluginAsync = fp(async (server) => {
	const prisma = new PrismockClient();
	await prisma.$connect();
	server.decorate('prisma', prisma);
	server.addHook('onClose', async (srv) => {
		await srv.prisma.$disconnect();
	});
});

export const prismockPlugin = createPlugin(prismockPluginInternal, {
	name: pluginNames.prisma,
	dependencies: [],
});
