import fs from 'node:fs';
import path from 'node:path';
import type { TransactionController } from '@/api/controllers/transaction.controller.js';
import type { CsvRowFromInvoice } from '@/api/schemas/transaction.schema.js';
import type { LlmService } from '@/api/services/llm.service.js';
import { logLlmUsage } from '@/scripts/helpers/log-llm-usage.js';
import { createLoggerConfig } from '@utils/logger.js';
import { parse } from 'csv-parse';
import type { FastifyBaseLogger } from 'fastify';
import { pino } from 'pino';
import { createTransactionController } from './helpers/create-transaction-controller.js';
import { csvRowToNotification } from './helpers/csv-row-to-notification.js';
import { type InvoiceImportOptions, resolveInvoiceImportOptions } from './helpers/invoice-import-options.js';

const logger = pino(createLoggerConfig('debug'));

export class InvoiceTransactionProcessor {
	private readonly transactionController: TransactionController;
	public readonly llmService: LlmService;
	private readonly userId: string;
	private readonly logger: FastifyBaseLogger;
	private failedRows: { row: string[]; error: string }[] = [];

	public getFailedRows() {
		return this.failedRows;
	}

	constructor(userId: string) {
		const { controller, llmService } = createTransactionController();
		this.transactionController = controller;
		this.llmService = llmService;
		this.userId = userId;
		this.logger = logger;
	}

	private csvRowToNotification(row: string[]): CsvRowFromInvoice | null {
		return csvRowToNotification(row);
	}

	async processCsvTransactions(filePath: string) {
		const parser = fs.createReadStream(filePath).pipe(parse({ delimiter: ';', from_line: 2 }));
		let processed = 0;
		let errors = 0;
		const initialFailed = this.failedRows.length;

		for await (const row of parser) {
			const invoiceItem = this.csvRowToNotification(row);

			if (!invoiceItem) {
				this.failedRows.push({ row, error: 'invalid_amount' });
				this.logger.error('Ignored line (invalid amount):', row);
				errors++;
				continue;
			}

			try {
				const result = await this.transactionController.addTransactionFromInvoice(this.userId, invoiceItem);
				if (result.data?.id) {
					this.logger.info(`Transaction inserted. ID: ${result.data.id}`);
					processed++;
				} else {
					const message = result.message ?? 'unknown_error';
					this.failedRows.push({ row, error: message });
					this.logger.error('Error inserting transaction:', message);
					errors++;
				}
			} catch (err) {
				const message = err instanceof Error ? err.message : 'unexpected_error';
				this.failedRows.push({ row, error: message });
				this.logger.error({ row, invoiceItem, err }, 'Detailed parse error');
				errors++;
			}
		}
		const newFailed = this.failedRows.length - initialFailed;
		this.logger.info(`Process completed. Success: ${processed}, Errors: ${errors}`);
		this.logger.info(`Failed rows queued for this file: ${newFailed}`);
	}

	/**
	 * Export queued failed rows to the specified path in CSV format
	 * @param outputPath Destination file path
	 */
	public exportFailedRows(outputPath: string) {
		const header =
			'Data de Compra;Nome no Cartão;Final do Cartão;Categoria;Descrição;Parcela;Valor (em US$);Cotação (em R$);Valor (em R$);Erro';
		const lines = this.failedRows.map((r) => `${r.row.join(';')};${r.error}`);
		const content = [header, ...lines].join('\n');

		const dir = path.dirname(outputPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		fs.writeFileSync(outputPath, content, {
			encoding: 'utf-8',
		});
	}
}

async function main() {
	const startTime = Date.now();
	let options: InvoiceImportOptions;
	try {
		options = resolveInvoiceImportOptions(process.argv.slice(2), process.env, process.cwd());
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Invalid arguments';
		logger.error(message);
		process.exitCode = 1;
		return;
	}

	const processor = new InvoiceTransactionProcessor(options.userId);

	logger.info(`Processing: ${options.filePath}`);
	await processor.processCsvTransactions(options.filePath);

	logLlmUsage(processor.llmService, logger);

	const failedCount = processor.getFailedRows().length;
	if (failedCount > 0) {
		logger.info(`Writing ${failedCount} failed rows to ${options.failedOutputPath}`);
		processor.exportFailedRows(options.failedOutputPath);
	}

	const elapsedMs = Date.now() - startTime;
	const minutes = Math.floor(elapsedMs / 60000);
	const seconds = Math.round((elapsedMs % 60000) / 1000);
	logger.info(`Processing completed in ${minutes} min and ${seconds} sec`);
}

if (process.env.NODE_ENV !== 'test') {
	main();
}
