import type { PrismaClient } from '@prisma/client';
import type { FastifyBaseLogger } from 'fastify';
import type { Transaction, FullTransaction } from '../schemas/transaction.schema.js';
import { TransactionService } from './transaction.service.js';
import { fromPartial } from '@total-typescript/shoehorn';

describe('TransactionService', () => {
        let prisma: {
                transaction: {
                        findMany: jest.Mock;
                        create: jest.Mock;
                        findFirst: jest.Mock;
                        aggregate: jest.Mock;
                        groupBy: jest.Mock;
                };
        };
        let logger: jest.Mocked<FastifyBaseLogger>;
        let service: TransactionService;

	const sampleTransaction: Transaction = {
		userId: 'user1',
		amount: 10,
		cardNumber: null,
		currencyCode: 'BRL',
		dateTime: new Date('2025-01-01T00:00:00Z'),
		institution: 'Bank',
		installment: '1-10',
		merchant: {
			id: 'merchant1',
			name: 'Store',
			category: {
				id: 'cat1',
				name: 'Food',
				description: null,
				icon: 'food-icon',
				isDefault: true,
				createdAt: new Date('2024-12-31T00:00:00Z'),
			},
		},
		entryType: 'out',
		transactionType: 'CREDIT',
		category: {
			id: 'cat1',
			name: 'Food',
			description: null,
			icon: 'food-icon',
			isDefault: true,
			createdAt: new Date('2024-12-31T00:00:00Z'),
		},
	};

	const sampleFullTransaction: FullTransaction = { id: 'exp1', ...sampleTransaction };

        beforeEach(() => {
                prisma = {
                        transaction: {
                                findMany: jest.fn(),
                                create: jest.fn(),
                                findFirst: jest.fn(),
                                aggregate: jest.fn(),
                                groupBy: jest.fn(),
                        },
                };
                logger = fromPartial<jest.Mocked<FastifyBaseLogger>>({ error: jest.fn() });
                service = new TransactionService(fromPartial<PrismaClient>(prisma), logger);
        });

	describe('getAllTransactions', () => {
		it('returns transactions from prisma', async () => {
			prisma.transaction.findMany.mockResolvedValue([sampleFullTransaction]);
			const result = await service.getAllTransactions('user1');
			expect(prisma.transaction.findMany).toHaveBeenCalledWith({
				where: { user: { id: 'user1' } },
				include: { category: true, merchant: { include: { category: true } } },
				skip: 0,
				take: 20,
                                orderBy: [{ dateTime: 'desc' }, { id: 'desc' }],
			});
			expect(result).toEqual([sampleFullTransaction]);
		});

		it('applies filters and pagination', async () => {
			prisma.transaction.findMany.mockResolvedValue([sampleFullTransaction]);
			const result = await service.getAllTransactions('user1', {
				period: 'month',
				page: 2,
				limit: 5,
				categoryId: 'cat1',
			});
			expect(prisma.transaction.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						user: { id: 'user1' },
						dateTime: expect.any(Object),
						categoryId: 'cat1',
					}),
					include: { category: true, merchant: { include: { category: true } } },
					skip: 5,
					take: 5,
				}),
			);
			expect(result).toEqual([sampleFullTransaction]);
		});

		it('throws error on failure', async () => {
			prisma.transaction.findMany.mockRejectedValue(new Error('fail'));
			await expect(service.getAllTransactions('user1')).rejects.toThrow('Failed to get transactions: fail');
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('addTransaction', () => {
		it('creates transaction and returns id', async () => {
			prisma.transaction.findFirst.mockResolvedValue(null);
			prisma.transaction.create.mockResolvedValue({ id: 'new' });
			const id = await service.addTransaction(sampleTransaction);
			expect(prisma.transaction.create).toHaveBeenCalledWith({
				data: {
					amount: 10,
					cardNumber: null,
					currencyCode: 'BRL',
					dateTime: sampleTransaction.dateTime,
					institution: 'Bank',
					installment: '1-10',
					merchant: { connect: { id: 'merchant1' } },
					entryType: 'out',
					transactionType: 'CREDIT',
					user: { connect: { id: 'user1' } },
					category: { connect: { id: 'cat1' } },
				},
			});
			expect(id).toBe('new');
		});

		it('throws when prisma.create fails', async () => {
			prisma.transaction.findFirst.mockResolvedValue(null);
			prisma.transaction.create.mockRejectedValue(new Error('boom'));
			await expect(service.addTransaction(sampleTransaction)).rejects.toThrow('Failed to add transaction: boom');
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('getTransactionSummary', () => {
		it('calculates summary', async () => {
			prisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 45 } });
			prisma.transaction.groupBy.mockResolvedValue([
				{ categoryId: 'cat1', _sum: { amount: 25 }, _count: { _all: 2 } },
				{ categoryId: 'cat2', _sum: { amount: 20 }, _count: { _all: 1 } },
			]);

			const summary = await service.getTransactionSummary('user1');

			expect(prisma.transaction.aggregate).toHaveBeenCalledWith({
				where: { userId: 'user1' },
				_sum: { amount: true },
			});
			expect(prisma.transaction.groupBy).toHaveBeenCalledWith({
				by: ['categoryId'],
				where: { userId: 'user1' },
				_sum: { amount: true },
				_count: { _all: true },
			});
			expect(summary.totalAmount).toBe(45);
			expect(summary.countByCategory).toEqual({ cat1: 2, cat2: 1 });
			expect(summary.amountByCategory).toEqual({ cat1: 25, cat2: 20 });
		});

		it('handles empty aggregates', async () => {
			prisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: null } });
			prisma.transaction.groupBy.mockResolvedValue([]);
			const summary = await service.getTransactionSummary('user1');
			expect(summary.totalAmount).toBe(0);
			expect(summary.countByCategory).toEqual({});
			expect(summary.amountByCategory).toEqual({});
		});
	});
});
