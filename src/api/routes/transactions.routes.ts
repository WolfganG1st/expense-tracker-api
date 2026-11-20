import {
	type NotificationInputPayload,
	type TransactionCreateResponse,
	type TransactionSummaryResponse,
	type TransactionsListResponse,
	type TransactionsQuery,
	notificationInputSchema,
	transactionCreateResponseSchema,
	transactionSummarySchema,
	transactionsListSchema,
	transactionsQuerySchema,
} from '@/api/schemas/transaction.schema.js';
import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';

/**
 * Routes for handling transaction operations
 * @param fastify - Fastify instance
 * @returns void
 */
export const transactionsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance): Promise<void> => {
	// Access the injected controller from the Fastify instance
	const { transactionController } = fastify;

	// Add await operation to satisfy linter
	await Promise.resolve('routes initialized');

	// Get all transactions
	fastify.get('/', {
		preHandler: [fastify.authenticate],
		schema: {
			querystring: transactionsQuerySchema,
			response: {
				200: transactionsListSchema,
			},
		},
		handler: async (request: FastifyRequest<{ Querystring: TransactionsQuery }>): Promise<TransactionsListResponse> => {
			const userId = request.user.id;
                        const { period, page, limit, categoryId, order } = request.query;
			request.log.info('Getting all transactions');
			const result = await transactionController.getAllTransactions(userId, {
				period,
				page,
				limit,
                                categoryId,
                                order,
                        });
			request.log.info(`Retrieved ${result.data?.transactions.length ?? 0} transactions`);
			return result;
		},
	});

	// Add a new transaction
	fastify.post('/', {
		preHandler: [fastify.authenticate],
		schema: {
			body: notificationInputSchema,
			response: {
				200: transactionCreateResponseSchema,
			},
		},
		handler: async (
			request: FastifyRequest<{ Body: NotificationInputPayload }>,
		): Promise<TransactionCreateResponse> => {
			const notification = request.body;
			request.log.info(`Received notification from ${notification.app}: ${notification.title}`);
			const userId = request.user.id;

			const result = await transactionController.addTransactionFromNotification(userId, notification);
			if (result.data?.id) {
				request.log.info(`Added new transaction with ID: ${result.data.id}`);
			} else {
				request.log.error('Failed to add transaction');
			}
			return result;
		},
	});

	// Get transaction summary
	fastify.get('/summary', {
		preHandler: [fastify.authenticate],
		schema: {
			response: {
				200: transactionSummarySchema,
			},
		},
		handler: async (request: FastifyRequest): Promise<TransactionSummaryResponse> => {
			const userId = request.user.id;
			request.log.info('Getting transaction summary');
			const summary = await transactionController.getTransactionSummary(userId);

			if (summary.totalAmount > 0) {
				request.log.info(`Retrieved transaction summary with total amount: ${summary.totalAmount}`);
			} else {
				request.log.info('Retrieved empty transaction summary');
			}

			return summary;
		},
	});
};
