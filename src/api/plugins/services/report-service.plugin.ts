import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import { ReportService } from '@services/report.service.js';
import type { FastifyPluginAsync } from 'fastify';

const reportServicePluginInternal: FastifyPluginAsync = async (fastify) => {
	const service = new ReportService(fastify.prisma, fastify.log);
	fastify.decorate('reportService', service);
	await Promise.resolve('report service init');
};

export const reportServicePlugin = createPlugin(reportServicePluginInternal, {
	name: pluginNames.reportService,
	dependencies: [pluginNames.prisma],
});

declare module 'fastify' {
	interface FastifyInstance {
		reportService: ReportService;
	}
}
