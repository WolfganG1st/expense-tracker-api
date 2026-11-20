import type { LlmService } from '@/api/services/llm.service.js';
import type { FastifyBaseLogger } from 'fastify';

export function logLlmUsage(llmService: LlmService, logger: FastifyBaseLogger) {
	const usage = llmService.getUsage();
	const cost = llmService.getEstimatedCost();
	logger.info(
		`LLM usage: ${usage.promptTokens} prompt tokens, ${usage.completionTokens} completion tokens. Estimated cost: $${cost.toFixed(4)}`,
	);
}
