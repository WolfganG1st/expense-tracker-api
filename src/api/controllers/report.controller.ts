import type { Period } from '@schemas/transaction.schema.js';
import type { CategoryBreakdown, PeriodSpending, ReportService, SummaryReport } from '@services/report.service.js';
import type { FastifyBaseLogger } from 'fastify';

export class ReportController {
	constructor(
		private readonly reportService: ReportService,
		private readonly logger: FastifyBaseLogger,
	) {}

	async periodSpending(userId: string, period: Period, start?: Date, end?: Date): Promise<{ data: PeriodSpending[] }> {
		const data = await this.reportService.getPeriodSpending(userId, period, start, end);
		return { data };
	}

	async categoryBreakdown(userId: string, start?: Date, end?: Date): Promise<{ data: CategoryBreakdown[] }> {
		const data = await this.reportService.getCategoryBreakdown(userId, start, end);
		return { data };
	}

	async summary(
		userId: string,
		period: Period,
		start?: Date,
		end?: Date,
		categoryId?: string,
		merchantId?: string,
	): Promise<{ data: SummaryReport }> {
		const data = await this.reportService.getSummary(userId, period, start, end, categoryId, merchantId);
		return { data };
	}
}
