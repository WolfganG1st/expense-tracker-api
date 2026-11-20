import type { Category } from '@schemas/category.schema.js';
import type { TransactionCore } from '@schemas/transaction.schema.js';
import type { CategoryService } from '@services/category.service.js';
import { z } from 'zod';
import type { LlmService, PromptConfig, ToolChoice } from './llm.service.js';

export const categoryInferenceResult = z.object({
	category: z.object({ name: z.string().min(1, 'Name is required').describe('The name of the category') }),
	confidence: z.number().min(0).max(1),
});
export type CategoryInferenceResult = z.infer<typeof categoryInferenceResult>;

export class CategoryInferenceService {
	private readonly llmService: LlmService;
	private readonly categoryService: CategoryService;

	public constructor(llmService: LlmService, categoryService: CategoryService) {
		this.llmService = llmService;
		this.categoryService = categoryService;
	}

        public async inferCategory(transaction: TransactionCore, userId: string): Promise<CategoryInferenceResult> {
                const categories = await this.categoryService.getAllCategories(userId);
                const promptConfig: PromptConfig = this.getPrompt(transaction, categories);

                try {
                        const result = await this.llmService.extractWithFallback({
                                schema: categoryInferenceResult,
                                promptConfig,
                                toolChoice: this.getToolChoice(),
                                temperature: 0,
                                maxRetries: 0,
                                maxTokens: 60,
                        });
                        return result;
                } catch {
                        return { category: { name: 'unknown' }, confidence: 0 };
                }
        }

	private getPrompt(transaction: TransactionCore, categories: Category[]): PromptConfig {
		const categoryList = categories.map((c) => `- ${c.name}`).join('\n');
		return {
			system:
				'Você é um assistente especializado em classificar despesas em categorias. Use função para retornar um JSON válido.',
			prompt: `
Classifique a despesa a seguir:
${categoryList}

Despesa: valor ${transaction.amount} ${transaction.currencyCode}, estabelecimento ${transaction.merchant}

Retorne apenas um objeto JSON no formato:
{
  "category": { "name": (uma das categorias acima) },
  "confidence": (número entre 0 e 1 indicando o nível de certeza)
}
`,
		};
	}

	private getToolChoice(): ToolChoice<CategoryInferenceResult> {
		return {
			name: 'infer_category',
			description: 'Retorna categoria e nível de confiança (0-1).',
			parameters: categoryInferenceResult,
		};
	}
}
