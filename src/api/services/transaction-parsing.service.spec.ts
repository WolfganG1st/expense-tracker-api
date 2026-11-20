import { transactionCoreSchema3 } from '../schemas/transaction.schema.js';
import { TransactionParsingService } from './transaction-parsing.service.js';
import type { LlmService } from './llm.service.js';
import { fromPartial } from '@total-typescript/shoehorn';

describe('TransactionParsingService', () => {
        let llm: jest.Mocked<LlmService>;
        let service: TransactionParsingService;

        beforeEach(() => {
                llm = fromPartial<jest.Mocked<LlmService>>({ extractWithFallback: jest.fn() });
                service = new TransactionParsingService(llm);
	});

	it('parses message using LLM', async () => {
		const expected = {
			amount: 100,
			currencyCode: 'BRL',
			merchant: 'Store',
			dateTime: new Date('2025-01-01T12:00:00Z'),
			transactionType: 'CREDIT',
			cardNumber: '1234',
			entryType: 'out',
		};
		llm.extractWithFallback.mockResolvedValue(expected);
		const result = await service.parseFromNotification('msg');
		expect(result).toEqual(expected);
		expect(llm.extractWithFallback).toHaveBeenCalledWith({
			schema: transactionCoreSchema3,
			promptConfig: expect.any(Object),
			toolChoice: expect.any(Object),
			temperature: 0,
			maxTokens: 80,
		});
		const prompt = llm.extractWithFallback.mock.calls[0][0].promptConfig.prompt;
		expect(prompt).toMatch(/entryType/);
	});
});
