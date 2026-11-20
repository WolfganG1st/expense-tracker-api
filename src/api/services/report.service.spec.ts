import type { PrismaClient } from '@prisma/client';
import type { FastifyBaseLogger } from 'fastify';
import { ReportService } from './report.service.js';
import { fromPartial } from '@total-typescript/shoehorn';

describe('ReportService', () => {
        let prisma: {
                transaction: { findMany: jest.Mock };
        };
        let logger: jest.Mocked<FastifyBaseLogger>;
        let service: ReportService;

        beforeEach(() => {
                prisma = { transaction: { findMany: jest.fn() } };
                logger = fromPartial<jest.Mocked<FastifyBaseLogger>>({ error: jest.fn() });
                service = new ReportService(fromPartial<PrismaClient>(prisma), logger);
        });

	it('computes period spending for month', async () => {
		prisma.transaction.findMany.mockResolvedValue([
			{ userId: 'u1', amount: 10, dateTime: new Date('2024-01-05T00:00:00.000Z') },
			{ userId: 'u1', amount: 5, dateTime: new Date('2024-01-20T00:00:00.000Z') },
			{ userId: 'u1', amount: 3, dateTime: new Date('2024-02-01T00:00:00.000Z') },
		]);
		const result = await service.getPeriodSpending('u1', 'month', new Date('2024-01-01'), new Date('2024-03-01'));
		expect(result).toEqual([
			{ period: '2024-01', totalAmount: 15 },
			{ period: '2024-02', totalAmount: 3 },
		]);
	});

	it('logs and throws when period spending fails', async () => {
		prisma.transaction.findMany.mockRejectedValue(new Error('fail'));
		await expect(
			service.getPeriodSpending('u1', 'month', new Date('2024-01-01'), new Date('2024-03-01')),
		).rejects.toThrow('Failed to compute period spending');
		expect(logger.error).toHaveBeenCalled();
	});

	it('computes category breakdown', async () => {
		prisma.transaction.findMany.mockResolvedValue([
			{ userId: 'u1', amount: 10, dateTime: new Date('2024-01-05'), category: { name: 'Food' } },
			{ userId: 'u1', amount: 5, dateTime: new Date('2024-01-20'), category: { name: 'Food' } },
			{ userId: 'u1', amount: 3, dateTime: new Date('2024-02-01'), category: { name: 'Travel' } },
		]);
		const result = await service.getCategoryBreakdown('u1', new Date('2024-01-01'), new Date('2024-03-01'));
		expect(result).toEqual([
			{ category: 'Food', totalAmount: 15, count: 2 },
			{ category: 'Travel', totalAmount: 3, count: 1 },
		]);
	});

	it('logs and throws when category breakdown fails', async () => {
		prisma.transaction.findMany.mockRejectedValue(new Error('fail'));
		await expect(service.getCategoryBreakdown('u1', new Date('2024-01-01'), new Date('2024-03-01'))).rejects.toThrow(
			'Failed to compute category breakdown',
		);
		expect(logger.error).toHaveBeenCalled();
	});

	it('computes summary', async () => {
		prisma.transaction.findMany
			.mockResolvedValueOnce([
				{ amount: 10, dateTime: new Date('2024-01-01T00:00:00.000Z') },
				{ amount: 5, dateTime: new Date('2024-01-03T00:00:00.000Z') },
				{ amount: 15, dateTime: new Date('2024-01-05T00:00:00.000Z') },
			])
			.mockResolvedValueOnce([
				{ amount: 8, dateTime: new Date('2023-12-27T00:00:00.000Z') },
				{ amount: 12, dateTime: new Date('2023-12-29T00:00:00.000Z') },
			]);
		const result = await service.getSummary('u1', 'week', new Date('2024-01-01'), new Date('2024-01-07'));
		expect(result).toEqual({
			total: 30,
			differenceFromLastPeriod: 50,
			average: { timeFraction: 'daily', value: 30 / 7 },
			highestSpend: 15,
			count: 3,
			series: [
				{ date: '2024-01-01T00:00:00.000Z', value: 10 },
				{ date: '2024-01-02T00:00:00.000Z', value: 0 },
				{ date: '2024-01-03T00:00:00.000Z', value: 5 },
				{ date: '2024-01-04T00:00:00.000Z', value: 0 },
				{ date: '2024-01-05T00:00:00.000Z', value: 15 },
				{ date: '2024-01-06T00:00:00.000Z', value: 0 },
				{ date: '2024-01-07T00:00:00.000Z', value: 0 },
			],
		});
	});

	it('computes summary for all period', async () => {
		prisma.transaction.findMany.mockResolvedValueOnce([
			{ amount: 5, dateTime: new Date('2024-01-01') },
			{ amount: 5, dateTime: new Date('2024-01-03') },
		]);
		const result = await service.getSummary('u1', 'all');
		expect(result).toEqual({
			total: 10,
			differenceFromLastPeriod: 0,
			average: { timeFraction: 'daily', value: 10 / 3 },
			highestSpend: 5,
			count: 2,
			series: [
				{ date: '2024-01-01T00:00:00.000Z', value: 5 },
				{ date: '2024-01-02T00:00:00.000Z', value: 0 },
				{ date: '2024-01-03T00:00:00.000Z', value: 5 },
			],
		});
	});

	it('logs and throws when summary fails', async () => {
		prisma.transaction.findMany.mockRejectedValue(new Error('fail'));
		await expect(service.getSummary('u1', 'week', new Date('2024-01-01'), new Date('2024-01-07'))).rejects.toThrow(
			'Failed to compute summary report',
		);
		expect(logger.error).toHaveBeenCalled();
	});
});
