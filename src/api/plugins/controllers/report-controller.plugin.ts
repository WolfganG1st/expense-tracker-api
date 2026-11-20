import { ReportController } from '@controllers/report.controller.js';
import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import type { FastifyPluginAsync } from 'fastify';

const reportControllerPluginInternal: FastifyPluginAsync = async (fastify) => {
	const controller = new ReportController(fastify.reportService, fastify.log);
	fastify.decorate('reportController', controller);
	await Promise.resolve('report controller init');
};

export const reportControllerPlugin = createPlugin(reportControllerPluginInternal, {
	name: pluginNames.reportController,
	dependencies: [pluginNames.reportService],
});

declare module 'fastify' {
	interface FastifyInstance {
		reportController: ReportController;
	}
}
