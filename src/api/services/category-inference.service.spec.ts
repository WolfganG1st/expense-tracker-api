import type { Category } from '../schemas/category.schema';
import type { TransactionCore } from '../schemas/transaction.schema';
import { CategoryInferenceService, categoryInferenceResult } from './category-inference.service.js';
import type { CategoryService } from './category.service.js';
import type { LlmService } from './llm.service.js';
import { fromPartial } from '@total-typescript/shoehorn';

describe('CategoryInferenceService', () => {
        let llm: jest.Mocked<LlmService>;
        let categoryService: jest.Mocked<CategoryService>;
        let service: CategoryInferenceService;

	const transaction: TransactionCore = {
		amount: 50,
		currencyCode: 'BRL',
		merchant: 'Loja',
		dateTime: new Date('2025-01-01T00:00:00Z'),
		transactionType: 'DEBIT',
		cardNumber: '1234',
		entryType: 'out',
	};

	const categories: Category[] = [
		{ id: '1', name: 'Food', description: null, icon: 'food-icon', isDefault: true, createdAt: new Date() },
		{ id: '2', name: 'Travel', description: null, icon: 'travel-icon', isDefault: true, createdAt: new Date() },
	];

        beforeEach(() => {
                llm = fromPartial<jest.Mocked<LlmService>>({ extractWithFallback: jest.fn() });
                categoryService = fromPartial<jest.Mocked<CategoryService>>({
                        getAllCategories: jest.fn().mockResolvedValue(categories),
                });
                service = new CategoryInferenceService(llm, categoryService);
	});

        it('calls LLM with prompt and returns result', async () => {
                const result = { category: { name: 'Food' }, confidence: 0.9 };
                llm.extractWithFallback.mockResolvedValue(result);
                const res = await service.inferCategory(transaction, 'user1');
                expect(categoryService.getAllCategories).toHaveBeenCalledWith('user1');
		expect(llm.extractWithFallback).toHaveBeenCalledWith({
			schema: categoryInferenceResult,
			promptConfig: expect.any(Object),
			toolChoice: expect.any(Object),
			temperature: 0,
			maxRetries: 0,
			maxTokens: 60,
		});
                expect(res).toEqual(result);
        });

        it('returns unknown category on inference failure', async () => {
                llm.extractWithFallback.mockRejectedValue(new Error('fail'));
                const res = await service.inferCategory(transaction, 'user1');
                expect(res).toEqual({ category: { name: 'unknown' }, confidence: 0 });
        });
});
