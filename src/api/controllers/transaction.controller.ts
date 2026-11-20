import type {
	CsvRowFromInvoice,
	NotificationInputPayload,
	Transaction,
	TransactionCreateResponse,
	TransactionSummaryResponse,
	TransactionsListResponse,
	TransactionsQuery,
} from '@schemas/transaction.schema.js';
import type { CategoryInferenceService } from '@services/category-inference.service.js';
import type { CategoryService } from '@services/category.service.js';
import type { MerchantService } from '@services/merchant.service.js';
import type { TransactionParsingService } from '@services/transaction-parsing.service.js';
import type { TransactionService } from '@services/transaction.service.js';
import type { FastifyBaseLogger } from 'fastify';

/**
 * Controller handling transaction operations
 */
export class TransactionController {
	/**
	 * Create a new Transaction controller
	 * @param transactionService - The Transaction service instance
	 * @param transactionParsingService - The Transaction parsing service instance
	 * @param categoryInferenceService - The Category inference service instance
	 * @param categoryService - The Category service instance
	 * @param logger - The logger instance
	 */
	constructor(
		private readonly transactionService: TransactionService,
		private readonly transactionParsingService: TransactionParsingService,
		private readonly categoryInferenceService: CategoryInferenceService,
		private readonly categoryService: CategoryService,
		private readonly merchantService: MerchantService,
		private readonly logger: FastifyBaseLogger,
	) {}

	/**
	 * Get all transactions
	 * @param filters - Optional filters such as period, pagination, and category
	 * @returns Promise with list of transactions
	 */
	public async getAllTransactions(userId: string, filters: TransactionsQuery = {}): Promise<TransactionsListResponse> {
		const transactions = await this.transactionService.getAllTransactions(userId, filters);
		return {
			data: {
				transactions,
			},
		};
	}

	/**
	 * Add a new transaction from notification data
	 * @param notification - The notification data containing transaction information
	 * @returns Promise with creation result
	 */
	public async addTransactionFromNotification(
		userId: string,
		notification: NotificationInputPayload,
	): Promise<TransactionCreateResponse> {
		const message = `${notification.title}\n${notification.message}`;
		const institution = notification.app;
		const parsedTransaction = await this.transactionParsingService.parseFromNotification(message);

		if (!parsedTransaction) {
			return { message: 'Failed to parse transaction' };
		}

		const { category: inferredCategory } = await this.categoryInferenceService.inferCategory(parsedTransaction, userId);
		const category = await this.categoryService.getCategoryByName(userId, inferredCategory.name);
		if (!category) {
			return { message: 'Failed to find category' };
		}

		let merchant = await this.merchantService.getMerchantByName(userId, parsedTransaction.merchant);
		if (!merchant) {
			merchant = await this.merchantService.addMerchant(userId, parsedTransaction.merchant, category.id);
		}

		const transaction: Transaction = {
			userId,
			category,
			dateTime: parsedTransaction.dateTime,
			amount: parsedTransaction.amount,
			currencyCode: parsedTransaction.currencyCode,
			merchant,
			entryType: parsedTransaction.entryType,
			transactionType: parsedTransaction.transactionType,
			cardNumber: parsedTransaction.cardNumber,
			installment: parsedTransaction.installment,
			institution,
		};

		const id = await this.transactionService.addTransaction(transaction);

		return { data: { id } };
	}

	public async addTransactionFromInvoice(
		userId: string,
		invoiceItem: CsvRowFromInvoice,
	): Promise<TransactionCreateResponse> {
		const parsedTransaction = await this.transactionParsingService.parseFromInvoice(invoiceItem);

		if (!parsedTransaction) {
			return { message: 'Failed to parse transaction' };
		}

		const { category: inferredCategory } = await this.categoryInferenceService.inferCategory(parsedTransaction, userId);
		const category = await this.categoryService.getCategoryByName(userId, inferredCategory.name);
		if (!category) {
			return { message: 'Failed to find category' };
		}

		let merchant = await this.merchantService.getMerchantByName(userId, parsedTransaction.merchant);
		if (!merchant) {
			merchant = await this.merchantService.addMerchant(userId, parsedTransaction.merchant, category.id);
		}

		const transaction: Transaction = {
			userId,
			category,
			dateTime: parsedTransaction.dateTime,
			amount: parsedTransaction.amount,
			currencyCode: parsedTransaction.currencyCode,
			merchant,
			entryType: parsedTransaction.entryType,
			transactionType: parsedTransaction.transactionType,
			cardNumber: parsedTransaction.cardNumber,
			installment: invoiceItem.installment,
			institution: invoiceItem.app,
		};

		const id = await this.transactionService.addTransaction(transaction);

		return { data: { id } };
	}

	/**
	 * Get transaction summary
	 * @returns Promise with transaction summary statistics
	 */
	public async getTransactionSummary(userId: string): Promise<TransactionSummaryResponse> {
		const summary = await this.transactionService.getTransactionSummary(userId);
		return summary;
	}
}
