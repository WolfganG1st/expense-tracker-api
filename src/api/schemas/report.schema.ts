import { z } from 'zod/v4';
import { DataResponseSchema } from './common.schema.js';
import { periodEnum } from './transaction.schema.js';

const periodSpendingItemSchema = z.object({
	period: z.string().describe('Period identifier'),
	totalAmount: z.number().describe('Total amount spent in the period'),
});

const categoryBreakdownItemSchema = z.object({
	category: z.string().describe('Category name'),
	totalAmount: z.number().describe('Total amount spent in this category'),
	count: z.number().describe('Number of transactions in this category'),
});

export const dateRangeQuerySchema = z.object({
	startDate: z.string().optional().describe('ISO start date'),
	endDate: z.string().optional().describe('ISO end date'),
});

export const periodQuerySchema = z.object({
	period: periodEnum.default('month'),
});

export const summaryQuerySchema = z.object({
	period: periodEnum.default('month'),
	categoryId: z.string().optional(),
	merchantId: z.string().optional(),
});

const summaryItemSchema = z.object({
	total: z.number(),
	differenceFromLastPeriod: z.number(),
	average: z.object({
		timeFraction: z.enum(['daily', 'weekly', 'monthly']),
		value: z.number(),
	}),
	highestSpend: z.number(),
	count: z.number(),
	series: z
		.array(
			z.object({
				date: z.string(),
				value: z.number(),
			}),
		)
		.describe('Spending aggregated by the selected time fraction, ordered by date'),
});

export const periodSpendingResponseSchema = DataResponseSchema(z.array(periodSpendingItemSchema));
export const categoryBreakdownResponseSchema = DataResponseSchema(z.array(categoryBreakdownItemSchema));
export const summaryResponseSchema = DataResponseSchema(summaryItemSchema);

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
export type PeriodQuery = z.infer<typeof periodQuerySchema>;
export type PeriodSpendingResponse = z.infer<typeof periodSpendingResponseSchema>;
export type CategoryBreakdownResponse = z.infer<typeof categoryBreakdownResponseSchema>;
export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
export type SummaryResponse = z.infer<typeof summaryResponseSchema>;
