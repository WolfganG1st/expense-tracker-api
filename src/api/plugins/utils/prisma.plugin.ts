import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import { PrismaClient } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

// Use TypeScript module augmentation to declare the type of server.prisma to be PrismaClient
declare module 'fastify' {
	interface FastifyInstance {
		prisma: PrismaClient;
	}
}

const prismaPluginInternal: FastifyPluginAsync = fp(async (server, options) => {
	const prisma = new PrismaClient();

	await prisma.$connect();

	// Make Prisma Client available through the fastify server instance: server.prisma
	server.decorate('prisma', prisma);

	server.addHook('onClose', async (server) => {
		await server.prisma.$disconnect();
	});
});

export const prismaPlugin = createPlugin(prismaPluginInternal, {
	name: pluginNames.prisma,
	dependencies: [], // This is a configuration plugin with no dependencies
});
