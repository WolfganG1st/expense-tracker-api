import { categorySchema, categorySchema3 } from '@schemas/category.schema.js';
import { merchantSchema } from '@schemas/merchant.schema.js';
import { z as z3 } from 'zod';
import { z } from 'zod/v4';
import { DataResponseSchema, sortOrderEnum } from './common.schema.js';

// Query filters
export const periodEnum = z.enum(['week', 'month', 'quarter', 'annual', 'all']).default('all');

export const transactionsQuerySchema = z.object({
        period: periodEnum.optional(),
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
        categoryId: z.string().optional(),
        order: sortOrderEnum.optional(),
});

// Defines the type of financial transaction
const transactionTypeSchema = z
	.enum(['CREDIT', 'DEBIT', 'PIX'])
	.default('CREDIT')
	.describe('The type of transaction (e.g., CREDIT, DEBIT, PIX)');

const transactionTypeSchema3 = z3
	.enum(['CREDIT', 'DEBIT', 'PIX'])
	.default('CREDIT')
	.describe('The type of transaction (e.g., CREDIT, DEBIT, PIX)');

const entryTypeSchema = z
	.enum(['in', 'out'])
	.default('out')
	.describe('Indicates whether the transaction is an income (in) or an transaction (out)');

const entryTypeSchema3 = z3
	.enum(['in', 'out'])
	.default('out')
	.describe('Indicates whether the transaction is an income (in) or an transaction (out)');

// Fields common to all transaction representations
const baseTransactionFields = {
	userId: z.string().describe('The unique identifier of the user who created this transaction'),
	amount: z.number().min(0.01, 'Amount must be greater than 0').describe('The monetary value of the transaction'),
	cardNumber: z.string().length(4).nullable().describe('The last four digits of the card used, if applicable'),
	currencyCode: z.string().length(3).default('BRL').describe('The ISO 4217 currency code (e.g., BRL, USD)'),
	dateTime: z.coerce.date().describe('The ISO 8601 date and time when the transaction occurred'),
	institution: z
		.string()
		.min(1, 'Institution is required')
		.describe('The name of the institution or bank associated with the transaction'),
	installment: z
		.string()
		.regex(/^\d+-\d+$/)
		.optional()
		.nullable()
		.describe('Installment index and total, e.g., "1-10"'),
	transactionType: transactionTypeSchema,
	entryType: entryTypeSchema,
};

const baseTransactionFields3 = {
	userId: z3.string().describe('The unique identifier of the user who created this transaction'),
	amount: z3.number().min(0.01, 'Amount must be greater than 0').describe('The monetary value of the transaction'),
	cardNumber: z3.string().length(4).nullable().describe('The last four digits of the card used, if applicable'),
	currencyCode: z3.string().length(3).default('BRL').describe('The ISO 4217 currency code (e.g., BRL, USD)'),
	dateTime: z3.coerce.date().describe('The ISO 8601 date and time when the transaction occurred'),
	institution: z3
		.string()
		.min(1, 'Institution is required')
		.describe('The name of the institution or bank associated with the transaction'),
	merchant: z3
		.string()
		.min(1, 'Merchant is required')
		.describe('The location or vendor where the transaction was made'),
	installment: z3
		.string()
		.regex(/^\d+-\d+$/)
		.optional()
		.nullable()
		.describe('Installment index and total, e.g., "1-10"'),
	transactionType: transactionTypeSchema3,
	entryType: entryTypeSchema3,
};

// Schema for the raw payload received from a notification service (e.g., bank app notification)
export const notificationInputSchema = z
	.object({
		title: z.string().describe('The title of the notification'),
		message: z.string().describe('The main content/message of the notification'),
		app: z.string().describe('The application that generated the notification (e.g., bank app name)'),
	})
	.describe('Defines the structure of a raw notification payload, which will be processed to create an transaction');

// Schema representing a fully processed and structured transaction, including nested category details.
// This is typically used for internal representation or when returning detailed transaction data.
const transactionSchema = z
	.object({
		...baseTransactionFields,
		merchant: merchantSchema.describe('Merchant associated with this transaction'),
		category: categorySchema.describe('The full category object associated with this transaction'),
	})
	.describe(
		'Defines the structure of a complete transaction object, including all its properties and related category data',
	);

// Schema for an transaction when returned by the API, including its unique identifier and all other properties.
const fullTransactionSchema = z
	.object({
		id: z.string().describe('The unique identifier of the transaction'),
		...transactionSchema.shape, // Includes all fields from transactionSchema (base fields + category)
	})
	.describe('Defines the structure of an transaction as it is returned by the API, including its ID');

// Schema for the response when listing multiple transactions
export const transactionsListSchema = DataResponseSchema(
	z.object({ transactions: z.array(fullTransactionSchema) }),
).describe('Response schema for a list of transactions with an optional message');

// Schema for the response after successfully creating an transaction
const createTransactionDataSchema = z.object({
	id: z.string().describe('The unique identifier of the newly created transaction'),
});
export const transactionCreateResponseSchema = DataResponseSchema(createTransactionDataSchema).describe(
	'Response schema after creating an transaction, including the new transaction ID and optional message',
);

// Schema for summarizing transaction data, typically for reporting or dashboard views
export const transactionSummarySchema = z
	.object({
		totalAmount: z.number().describe('The total sum of amounts for all transactions included in the summary'),
		countByCategory: z
			.record(z.string(), z.number())
			.describe(
				'A record where keys are category names (or IDs) and values are the count of transactions in that category',
			),
		amountByCategory: z
			.record(z.string(), z.number())
			.describe(
				'A record where keys are category names (or IDs) and values are the total amount of transactions in that category',
			),
	})
	.describe('Defines the structure for a summary of transaction data, including totals and breakdowns by category');

export const transactionCoreSchema = transactionSchema
	.omit({ category: true, userId: true, institution: true, merchant: true })
	.extend({
		merchant: z.string().describe('The location or vendor where the transaction was made'),
	});

const transactionSchema3 = z3
	.object({
		...baseTransactionFields3,
		category: categorySchema3.describe('The full category object associated with this transaction'),
	})
	.describe(
		'Defines the structure of a complete transaction object, including all its properties and related category data',
	);

export const transactionCoreSchema3 = transactionSchema3.omit({
	category: true,
	userId: true,
	institution: true,
});

// Export types for use in routes and services
export type NotificationInputPayload = z.infer<typeof notificationInputSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionCore = z.infer<typeof transactionCoreSchema>;
export type FullTransaction = z.infer<typeof fullTransactionSchema>;
export type TransactionsListResponse = z.infer<typeof transactionsListSchema>;
export type TransactionCreateResponse = z.infer<typeof transactionCreateResponseSchema>;
export type TransactionSummaryResponse = z.infer<typeof transactionSummarySchema>;
export type TransactionsQuery = z.infer<typeof transactionsQuerySchema>;
export type Period = z.infer<typeof periodEnum>;
export type CsvRowFromInvoice = {
	app: string;
	dateTime: string;
	cardEnd: string;
	category: string;
	description: string;
	installment?: string;
	amount: string;
	entryType: string;
	transactionType: string;
};
