import { AppError } from '@middleware/errors/errors.js';
import type { PrismaClient } from '@prisma/client';
import type { FullTransaction, Transaction, TransactionsQuery } from '@schemas/transaction.schema.js';
import type { FastifyBaseLogger } from 'fastify';

/**
 * Service for managing transactions using Prisma ORM
 */
export class TransactionService {
	private readonly prisma: PrismaClient;
	private readonly logger: FastifyBaseLogger;

	constructor(prisma: PrismaClient, logger: FastifyBaseLogger) {
		this.prisma = prisma;
		this.logger = logger;
	}

	/**
	 * @description Get all transactions
	 * @returns Promise with an array of transactions
	 */
        public async getAllTransactions(userId: string, filters: TransactionsQuery = {}): Promise<FullTransaction[]> {
                const { period = 'all', page = 1, limit = 20, categoryId, order } = filters;
                const sortOrder = order ?? 'desc';
		try {
			const where: Record<string, unknown> = {
				user: { id: userId },
			};

			if (period && period !== 'all') {
				const now = new Date();
				let start: Date = now;
				switch (period) {
					case 'week':
						start = new Date(now);
						start.setDate(now.getDate() - now.getDay());
						break;
					case 'month':
						start = new Date(now.getFullYear(), now.getMonth(), 1);
						break;
					case 'quarter':
						start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
						break;
					case 'annual':
						start = new Date(now.getFullYear(), 0, 1);
						break;
				}
				where.dateTime = { gte: start };
			}

			if (categoryId) {
				where.categoryId = categoryId;
			}

			const transactions = await this.prisma.transaction.findMany({
				where,
				include: { category: true, merchant: { include: { category: true } } },
				skip: (page - 1) * limit,
				take: limit,
                                orderBy: [{ dateTime: sortOrder }, { id: sortOrder }],
			});
			return transactions;
		} catch (error) {
			this.logger.error({ error }, 'Error getting transactions');
			throw new AppError(`Failed to get transactions: ${(error as Error).message}`, 500, error);
		}
	}

	/**
	 * @description Add a new transaction
	 * @param transaction - The transaction to add
	 * @returns Promise with the added transaction ID
	 */
	public async addTransaction(transaction: Transaction): Promise<string> {
		const existing = await this.prisma.transaction.findFirst({
			where: {
				userId: transaction.userId,
				merchantId: transaction.merchant.id,
				amount: transaction.amount,
				dateTime: transaction.dateTime,
				cardNumber: transaction.cardNumber,
				currencyCode: transaction.currencyCode,
				...(transaction.installment ? { installment: transaction.installment } : { installment: null }),
			},
		});

		if (existing) {
			throw new AppError('Duplicate transaction', 409);
		}

		try {
			const {
				userId,
				category: { id: categoryId },
				merchant: { id: merchantId },
				...rest
			} = transaction;
			const newTransaction = await this.prisma.transaction.create({
				data: {
					...rest,
					user: {
						connect: {
							id: userId,
						},
					},
					category: {
						connect: {
							id: categoryId,
						},
					},
					merchant: {
						connect: {
							id: merchantId,
						},
					},
				},
			});
			return newTransaction.id;
		} catch (error) {
			this.logger.error({ error }, 'Error adding transaction');
			throw new AppError(`Failed to add transaction: ${(error as Error).message}`, 500, error);
		}
	}

	/**
	 * Get transaction summary statistics
	 * @returns Promise with transaction summary data
	 */
	public async getTransactionSummary(userId: string): Promise<{
		totalAmount: number;
		countByCategory: Record<string, number>;
		amountByCategory: Record<string, number>;
	}> {
		const totalAgg = await this.prisma.transaction.aggregate({
			where: { userId },
			_sum: { amount: true },
		});

		const categoryAgg = await this.prisma.transaction.groupBy({
			by: ['categoryId'],
			where: { userId },
			_sum: { amount: true },
			_count: { _all: true },
		});

		const totalAmount = totalAgg._sum.amount ?? 0;
		const countByCategory: Record<string, number> = {};
		const amountByCategory: Record<string, number> = {};

		for (const row of categoryAgg) {
			countByCategory[row.categoryId] = row._count._all;
			amountByCategory[row.categoryId] = row._sum.amount ?? 0;
		}

		return { totalAmount, countByCategory, amountByCategory };
	}
}
