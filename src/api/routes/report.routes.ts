import {
	type CategoryBreakdownResponse,
	type PeriodQuery,
	type PeriodSpendingResponse,
	type SummaryQuery,
	type SummaryResponse,
	categoryBreakdownResponseSchema,
	periodSpendingResponseSchema,
	periodQuerySchema,
	summaryQuerySchema,
	summaryResponseSchema,
} from '@schemas/report.schema.js';
import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';

export const reportRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
	await Promise.resolve('routes initialized');
	const { reportController } = fastify;

	fastify.get('/period-spending', {
		preHandler: [fastify.authenticate],
		schema: {
			querystring: periodQuerySchema,
			response: { 200: periodSpendingResponseSchema },
		},
		handler: async (request: FastifyRequest<{ Querystring: PeriodQuery }>): Promise<PeriodSpendingResponse> => {
			const { period } = request.query;
			const now = new Date();
			let start: Date | undefined;
			let end: Date | undefined;
			switch (period) {
				case 'week':
					start = new Date(now);
					start.setDate(start.getDate() - start.getDay());
					end = new Date(start);
					end.setDate(start.getDate() + 6);
					break;
				case 'month':
					start = new Date(now.getFullYear(), now.getMonth(), 1);
					end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
					break;
				case 'quarter':
					start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
					end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
					break;
				case 'annual':
					start = new Date(now.getFullYear(), 0, 1);
					end = new Date(now.getFullYear(), 12, 0);
					break;
				default:
					start = undefined;
					end = undefined;
					break;
			}
			const result = await reportController.periodSpending(request.user.id, period, start, end);
			return { data: result.data };
		},
	});

	fastify.get('/category-breakdown', {
		preHandler: [fastify.authenticate],
		schema: {
			querystring: periodQuerySchema,
			response: { 200: categoryBreakdownResponseSchema },
		},
		handler: async (request: FastifyRequest<{ Querystring: PeriodQuery }>): Promise<CategoryBreakdownResponse> => {
			const { period } = request.query;
			const now = new Date();
			let start: Date | undefined;
			let end: Date | undefined;
			switch (period) {
				case 'week':
					start = new Date(now);
					start.setDate(start.getDate() - start.getDay());
					end = new Date(start);
					end.setDate(start.getDate() + 6);
					break;
				case 'month':
					start = new Date(now.getFullYear(), now.getMonth(), 1);
					end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
					break;
				case 'quarter':
					start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
					end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
					break;
				case 'annual':
					start = new Date(now.getFullYear(), 0, 1);
					end = new Date(now.getFullYear(), 12, 0);
					break;
				default:
					start = undefined;
					end = undefined;
					break;
			}
			const result = await reportController.categoryBreakdown(request.user.id, start, end);
			return { data: result.data };
		},
	});

	fastify.get('/summary', {
		preHandler: [fastify.authenticate],
		schema: {
			querystring: summaryQuerySchema,
			response: { 200: summaryResponseSchema },
		},
		handler: async (request: FastifyRequest<{ Querystring: SummaryQuery }>): Promise<SummaryResponse> => {
			const { period, categoryId, merchantId } = request.query;
			const now = new Date();
			let start: Date | undefined;
			let end: Date | undefined;
			switch (period) {
				case 'week':
					start = new Date(now);
					start.setDate(start.getDate() - start.getDay());
					end = new Date(start);
					end.setDate(start.getDate() + 6);
					break;
				case 'month':
					start = new Date(now.getFullYear(), now.getMonth(), 1);
					end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
					break;
				case 'quarter':
					start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
					end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
					break;
				case 'annual':
					start = new Date(now.getFullYear(), 0, 1);
					end = new Date(now.getFullYear(), 12, 0);
					break;
				default:
					start = undefined;
					end = undefined;
					break;
			}
			const result = await reportController.summary(request.user.id, period, start, end, categoryId, merchantId);
			return { data: result.data };
		},
	});
};
