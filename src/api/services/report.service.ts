import { AppError } from '@middleware/errors/errors.js';
import type { PrismaClient } from '@prisma/client';
import type { Period } from '@schemas/transaction.schema.js';
import type { FastifyBaseLogger } from 'fastify';

export interface PeriodSpending {
	period: string;
	totalAmount: number;
}

export interface CategoryBreakdown {
	category: string;
	totalAmount: number;
	count: number;
}

export interface SummaryReport {
	total: number;
	differenceFromLastPeriod: number;
	average: {
		timeFraction: 'daily' | 'weekly' | 'monthly';
		value: number;
	};
	highestSpend: number;
	count: number;
	series: { date: string; value: number }[];
}

export class ReportService {
	constructor(
		private prisma: PrismaClient,
		private logger: FastifyBaseLogger,
	) {}

	async getPeriodSpending(userId: string, period: Period, start?: Date, end?: Date): Promise<PeriodSpending[]> {
		try {
			const where = { userId, ...(start && end ? { dateTime: { gte: start, lte: end } } : {}) } as const;
			const transactions = await this.prisma.transaction.findMany({ where });
			const map = new Map<string, number>();
			for (const e of transactions) {
				const key = this.formatPeriod(period, e.dateTime);
				map.set(key, (map.get(key) || 0) + e.amount);
			}
			return Array.from(map.entries()).map(([period, totalAmount]) => ({ period, totalAmount }));
		} catch (error) {
			this.logger.error({ error }, 'Failed to compute period spending');
			throw new AppError('Failed to compute period spending', 500, error);
		}
	}

	async getCategoryBreakdown(userId: string, start?: Date, end?: Date): Promise<CategoryBreakdown[]> {
		try {
			const where = {
				userId,
				...(start && end ? { dateTime: { gte: start, lte: end } } : {}),
			} as const;
			const transactions = await this.prisma.transaction.findMany({
				where,
				include: { category: true },
			});
			const map = new Map<string, { total: number; count: number }>();
			for (const e of transactions) {
				const key = e.category.name;
				const entry = map.get(key) || { total: 0, count: 0 };
				entry.total += e.amount;
				entry.count += 1;
				map.set(key, entry);
			}
			return Array.from(map.entries()).map(([category, { total, count }]) => ({
				category,
				totalAmount: total,
				count,
			}));
		} catch (error) {
			this.logger.error({ error }, 'Failed to compute category breakdown');
			throw new AppError('Failed to compute category breakdown', 500, error);
		}
	}

	async getSummary(
		userId: string,
		period: Period,
		start?: Date,
		end?: Date,
		categoryId?: string,
		merchantId?: string,
	): Promise<SummaryReport> {
		try {
			const where = this.buildWhere(userId, start, end, categoryId, merchantId);
			const transactions = await this.prisma.transaction.findMany({ where });

			const total = this.sumAmounts(transactions);
			const highestSpend = this.getHighest(transactions);
			const count = transactions.length;

			const differenceFromLastPeriod =
				start && end ? await this.calculateDifference(userId, start, end, categoryId, merchantId, total) : 0;

			const { timeFraction, divisor } = this.determineTimeFraction(period, start, end, transactions);
			const average = { timeFraction, value: divisor ? total / divisor : 0 } as const;

			const series = this.buildSeries(transactions, timeFraction, start, end);

			return { total, differenceFromLastPeriod, average, highestSpend, count, series };
		} catch (error) {
			this.logger.error({ error }, 'Failed to compute summary report');
			throw new AppError('Failed to compute summary report', 500, error);
		}
	}

	private buildWhere(userId: string, start?: Date, end?: Date, categoryId?: string, merchantId?: string) {
		return {
			userId,
			...(start && end ? { dateTime: { gte: start, lte: end } } : {}),
			...(categoryId ? { categoryId } : {}),
			...(merchantId ? { merchantId } : {}),
		} as const;
	}

	private sumAmounts(transactions: { amount: number }[]): number {
		return transactions.reduce((sum, e) => sum + e.amount, 0);
	}

	private getHighest(transactions: { amount: number }[]): number {
		return transactions.reduce((max, e) => Math.max(max, e.amount), 0);
	}

	private async calculateDifference(
		userId: string,
		start: Date,
		end: Date,
		categoryId: string | undefined,
		merchantId: string | undefined,
		total: number,
	): Promise<number> {
		const prevEnd = new Date(start.getTime() - 1);
		const prevStart = new Date(prevEnd.getTime() - (end.getTime() - start.getTime()));

		const prevTransactions = await this.prisma.transaction.findMany({
			where: {
				userId,
				dateTime: { gte: prevStart, lte: prevEnd },
				...(categoryId ? { categoryId } : {}),
				...(merchantId ? { merchantId } : {}),
			},
		});

		const prevTotal = this.sumAmounts(prevTransactions);
		return prevTotal === 0 ? 0 : ((total - prevTotal) / prevTotal) * 100;
	}

	private determineTimeFraction(
		period: Period,
		start: Date | undefined,
		end: Date | undefined,
		transactions: { dateTime: Date }[],
	): { timeFraction: 'daily' | 'weekly' | 'monthly'; divisor: number } {
		switch (period) {
			case 'week':
			case 'month':
				return {
					timeFraction: 'daily',
					divisor: start && end ? (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1 : 1,
				};
			case 'quarter':
				return {
					timeFraction: 'weekly',
					divisor: start && end ? ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1) / 7 : 1,
				};
			case 'annual':
				return { timeFraction: 'monthly', divisor: 12 };
			case 'all': {
				let divisor = 1;
				if (transactions.length > 0) {
					const min = transactions.reduce((acc, e) => (e.dateTime < acc ? e.dateTime : acc), transactions[0].dateTime);
					const max = transactions.reduce((acc, e) => (e.dateTime > acc ? e.dateTime : acc), transactions[0].dateTime);
					divisor = (max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24) + 1;
				}
				return { timeFraction: 'daily', divisor };
			}
			default:
				return { timeFraction: 'monthly', divisor: 12 };
		}
	}

	private formatPeriod(period: Period, d: Date): string {
		const date = new Date(d);
		date.setUTCHours(0, 0, 0, 0);
		switch (period) {
			case 'week': {
				const startWeek = new Date(date);
				startWeek.setUTCDate(startWeek.getUTCDate() - startWeek.getUTCDay());
				return startWeek.toISOString().split('T')[0];
			}
			case 'month':
				return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
			case 'quarter':
				return `${date.getUTCFullYear()}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
			case 'annual':
				return `${date.getUTCFullYear()}`;
			default:
				return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
		}
	}

	private formatKey(timeFraction: 'daily' | 'weekly' | 'monthly', d: Date): string {
		const date = new Date(d);
		date.setUTCHours(0, 0, 0, 0);
		switch (timeFraction) {
			case 'daily':
				return date.toISOString();
			case 'weekly': {
				const startWeek = new Date(date);
				startWeek.setUTCDate(startWeek.getUTCDate() - startWeek.getUTCDay());
				return startWeek.toISOString();
			}
			case 'monthly':
				return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
		}
	}

	private buildSeries(
		transactions: { amount: number; dateTime: Date }[],
		timeFraction: 'daily' | 'weekly' | 'monthly',
		start?: Date,
		end?: Date,
	): { date: string; value: number }[] {
		const map = new Map<string, number>();
		for (const e of transactions) {
			const key = this.formatKey(timeFraction, e.dateTime);
			map.set(key, (map.get(key) || 0) + e.amount);
		}
		const { start: rangeStart, end: rangeEnd } = this.getRange(start, end, transactions);

		const series: { date: string; value: number }[] = [];
		if (rangeStart && rangeEnd) {
			const d = new Date(rangeStart);
			d.setUTCHours(0, 0, 0, 0);
			const endDate = new Date(rangeEnd);
			endDate.setUTCHours(0, 0, 0, 0);
			while (d <= endDate) {
				const key = this.formatKey(timeFraction, d);
				series.push({ date: key, value: map.get(key) || 0 });
				this.advanceDate(d, timeFraction);
			}
		} else {
			for (const [date, value] of Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
				series.push({ date, value });
			}
		}
		return series;
	}

	private getRange(
		start: Date | undefined,
		end: Date | undefined,
		transactions: { dateTime: Date }[],
	): { start?: Date; end?: Date } {
		let rangeStart = start;
		let rangeEnd = end;
		if (!rangeStart || !rangeEnd) {
			if (transactions.length > 0) {
				rangeStart = transactions.reduce((acc, e) => (e.dateTime < acc ? e.dateTime : acc), transactions[0].dateTime);
				rangeEnd = transactions.reduce((acc, e) => (e.dateTime > acc ? e.dateTime : acc), transactions[0].dateTime);
			}
		}
		return { start: rangeStart, end: rangeEnd };
	}

	private advanceDate(d: Date, timeFraction: 'daily' | 'weekly' | 'monthly'): void {
		switch (timeFraction) {
			case 'daily':
				d.setUTCDate(d.getUTCDate() + 1);
				break;
			case 'weekly':
				d.setUTCDate(d.getUTCDate() + 7);
				break;
			case 'monthly':
				d.setUTCMonth(d.getUTCMonth() + 1);
				break;
		}
	}
}
