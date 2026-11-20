import { type CsvRowFromInvoice, type TransactionCore, transactionCoreSchema3 } from '@schemas/transaction.schema.js';
import type { LlmService, PromptConfig, ToolChoice } from './llm.service.js';

/**
 * Service for parsing transaction data from text messages.
 *
 * This service uses an LLM to extract structured data from text messages
 * in pt-BR, and returns a parsed object with the following properties:
 *
 * - `amount`: number, value of the transaction
 * - `currencyCode`: string, currency of the transaction (e.g. "BRL")
 * - `merchant`: string, name of the establishment
 * - `dateTime`: string, date and time of the transaction (format: "dd/mm/yyyy HH:MM")
 * - `transactionType`: string, type of transaction (one of "CREDIT", "DEBIT", or "PIX") - if boleto, use "DEBIT" else default to "CREDIT"
 * - `cardNumber`: string, last 4 digits of the card
 * - `entryType`: "in" if it's an incoming transaction, "out" otherwise
 */
export class TransactionParsingService {
	constructor(private readonly llmService: LlmService) {}

	/**
	 * Parses a message to extract transaction data.
	 *
	 * @param message - The message to parse
	 * @returns A promise that resolves to the parsed transaction data
	 */
	private async parseGeneric(prompt: PromptConfig): Promise<TransactionCore> {
		const rawOutputFromLlm = await this.llmService.extractWithFallback({
			schema: transactionCoreSchema3,
			promptConfig: prompt,
			toolChoice: this.getToolChoice(),
			temperature: 0,
			maxTokens: 80,
		});

		const parsedAndValidatedOutput = transactionCoreSchema3.parse(rawOutputFromLlm);
		return parsedAndValidatedOutput;
	}

	async parseFromNotification(message: string): Promise<TransactionCore> {
		return await this.parseGeneric(this.getPromptFromNotification(message));
	}

	async parseFromInvoice(invoice: CsvRowFromInvoice): Promise<TransactionCore> {
		return await this.parseGeneric(this.getPromptFromInvoice(invoice));
	}

	/**
	 * Returns the prompt configuration for the transaction parsing service.
	 *
	 * @param message - The message to parse
	 * @returns The prompt configuration
	 */
	private getPromptFromNotification(message: string): PromptConfig {
		return {
			system: 'Você é um assistente especializado em extrair dados estruturados. Responda apenas em JSON válido.',
			prompt: `
			Extraia as seguintes informações desta notificação bancária e devolva apenas um objeto JSON com este formato exato:
				{
					"amount": (número, valor da transação),
					"currencyCode": "BRL" ou outra moeda aplicável,
					"merchant": (string, nome do estabelecimento),
					"dateTime": (string no formato ISO 8601, exemplo: "2023-10-13T14:22:00"),
					"transactionType": "CREDIT" ou "DEBIT" ou "PIX",
					"cardNumber": (últimos 4 dígitos do cartão),
					"entryType": "in" para entrada ou "out" para saída
				}
			NOTIFICAÇÃO: ${message}`,
		};
	}

	private getPromptFromInvoice(invoice: CsvRowFromInvoice): PromptConfig {
		return {
			system: `Você é um assistente especializado em extrair dados estruturados de faturas/planilhas.
				O formato das datas recebidas é dia/mês/ano. Responda apenas em JSON válido.`,
			prompt: `
			Extraia os dados financeiros deste item de fatura, devolvendo apenas um objeto JSON com este formato:
				{
					"amount": (número, valor da transação),
					"currencyCode": "BRL" ou outra moeda aplicável,
					"merchant": (string, nome do estabelecimento),
					"dateTime": (string no formato ISO 8601, exemplo: "2023-10-13T14:22:00"),
					"transactionType": "CREDIT" ou "DEBIT" ou "PIX",
					"cardNumber": (últimos 4 dígitos do cartão),
					"entryType": "in" para entrada ou "out" para saída
				}
			NOTIFICAÇÃO: ${JSON.stringify(invoice)}`,
		};
	}

	/**
	 * Returns the tool choice for the transaction parsing service.
	 *
	 * @returns The tool choice
	 */
	private getToolChoice(): ToolChoice<TransactionCore> {
		return {
			name: 'extract_transaction',
			description: 'Extraia as seguintes informações desta notificação bancária em pt-BR.',
			parameters: transactionCoreSchema3,
		};
	}
}
