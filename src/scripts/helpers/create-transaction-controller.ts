import { TransactionController } from '@/api/controllers/transaction.controller.js';
import { CategoryInferenceService } from '@/api/services/category-inference.service.js';
import { CategoryService } from '@/api/services/category.service.js';
import { LlmService } from '@/api/services/llm.service.js';
import { MerchantService } from '@/api/services/merchant.service.js';
import { TransactionParsingService } from '@/api/services/transaction-parsing.service.js';
import { TransactionService } from '@/api/services/transaction.service.js';
import { env } from '@/env.js';
import { PrismaClient } from '@prisma/client';
import { createLoggerConfig } from '@utils/logger.js';
import { pino } from 'pino';

export function createTransactionController(): { controller: TransactionController; llmService: LlmService } {
	const prisma = new PrismaClient();
	const logLevel = env.logLevel || (env.nodeEnv === 'production' ? 'info' : 'debug');
	const logger = pino(createLoggerConfig(logLevel));

	const transactionService = new TransactionService(prisma, logger);

	const llmService = new LlmService(logger);
	const transactionParsingService = new TransactionParsingService(llmService);
	const categoryService = new CategoryService(prisma, logger);
	const categoryInferenceService = new CategoryInferenceService(llmService, categoryService);
	const merchantService = new MerchantService(prisma, logger);

	const controller = new TransactionController(
		transactionService,
		transactionParsingService,
		categoryInferenceService,
		categoryService,
		merchantService,
		logger,
	);

	return { controller, llmService };
}
