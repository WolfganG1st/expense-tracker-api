import { env } from '@/env.js';
import { AppError } from '@middleware/errors/errors.js';
import type { FastifyBaseLogger } from 'fastify';
import { jsonrepair } from 'jsonrepair';
import OpenAI from 'openai';
import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type ToolChoice<T> = { name: string; description: string; parameters: z.ZodType<T, any, any> };

export type PromptConfig = {
	system: string;
	prompt: string;
};

export type ExtractOptions<T> = {
	model: string;
	schema: z.ZodType<T>;
	promptConfig: PromptConfig;
	toolChoice: ToolChoice<T>;
	temperature?: number;
	maxTokens: number;
};

type ExtractWithFallbackOptions<T> = Omit<ExtractOptions<T>, 'model'> & {
	maxRetries?: number;
	temperature?: number;
};

/**
 * A service for interacting with the OpenRouter LLM.
 *
 * This service provides a wrapper around the OpenRouter LLM API, allowing for
 * easier extraction of structured data from text messages.
 *
 * @class
 * @example
 * const llm = new LlmService();
 * const result = await llm.extract({
 *   model: 'mistral',
 *   schema: z.object({ foo: z.string() }),
 *   promptConfig: {
 *     system: 'system',
 *     prompt: 'prompt',
 *   },
 *   toolChoice: {
 *     name: 'foo',
 *     description: 'desc',
 *     parameters: z.object({ foo: z.string() }),
 *   },
 *   temperature: 0.5,
 * });
 * console.log(result); // { foo: 'bar' }
 */
export class LlmService {
	private readonly logger: FastifyBaseLogger;
	private promptTokens = 0;
	private completionTokens = 0;

	constructor(logger: FastifyBaseLogger) {
		this.logger = logger;
	}

	private client = new OpenAI({
		baseURL: 'https://openrouter.ai/api/v1',
		apiKey: env.openRouterApiKey,
		defaultHeaders: {
			'HTTP-Referer': 'http://localhost:3000',
			'X-Title': 'Credit Transactions App',
		},
		timeout: 15000, // 15 second timeout
		maxRetries: 2, // Limit retries
	});

	private static AI_MODELS = {
		// llama3: { model: 'meta-llama/llama-3.3-8b-instruct:free', cost: { input: 0, output: 0 } },
		// llama4: { model: 'meta-llama/llama-4-maverick:free', cost: { input: 0, output: 0 } },
		// mistral: { model: 'mistralai/mistral-7b-instruct:free', cost: { input: 0, output: 0 } },
		openai: {
			model: 'openai/gpt-4.1-nano',
			cost: { input: 0.1, output: 0.4 },
		},
		// anthropic: { model: 'anthropic/claude-3-haiku', cost: { input: 0, output: 0 } },
	} as const;

	private async extractInternal<T>(options: ExtractOptions<T>): Promise<T> {
		const { model, schema, promptConfig, toolChoice, temperature = 0, maxTokens } = options;
		const toolFunction = {
			name: toolChoice.name,
			description: toolChoice.description,
			parameters: zodToJsonSchema(toolChoice.parameters),
		};

		const completion = await this.client.chat.completions.create({
			model,
			// response_format: { type: 'json_object' },
			tools: [{ type: 'function', function: toolFunction }],
			tool_choice: { type: 'function', function: { name: toolFunction.name } },
			temperature,
			messages: [
				{ role: 'system', content: promptConfig.system },
				{ role: 'user', content: promptConfig.prompt },
			],
			max_tokens: maxTokens,
		});

		this.promptTokens += completion.usage?.prompt_tokens ?? 0;
		this.completionTokens += completion.usage?.completion_tokens ?? 0;

		// const content = completion.choices[0].message.content ?? '{}';
		const content = completion.choices[0].message.tool_calls?.[0].function.arguments ?? '{}';
		let parsed: unknown;
		try {
			parsed = JSON.parse(content.trim());
		} catch (error) {
			parsed = JSON.parse(jsonrepair(content.trim()));
		}

		return schema.parse(parsed);
	}

	/**
	 * Implements an exponential backoff strategy with a cap.
	 * Delays the execution by a time calculated as 2 raised to the power of the attempt number,
	 * multiplied by 500 milliseconds, with a maximum wait time of 5 seconds.
	 * @param attempt - The number of the current retry attempt.
	 * @returns A promise that resolves after the calculated delay.
	 */
	private backoff(attempt: number) {
		const delay = Math.min(2 ** attempt * 500, 5_000);
		return new Promise((resolve) => setTimeout(resolve, delay));
	}

	public extract<T>(options: ExtractOptions<T>): Promise<T> {
		return this.extractInternal(options);
	}

	/**
	 * Attempts to extract structured data from a prompt using multiple models.
	 *
	 * The function will try to call the `extractInternal` method on each model in
	 * `AI_MODELS` and return the result from the first successful call. If all
	 * models fail, the function will throw an error.
	 *
	 * @param options - Options for the extraction.
	 * @param options.schema - The schema to use for parsing the response.
	 * @param options.promptConfig - The prompt configuration.
	 * @param options.toolChoice - The tool choice.
	 * @param options.maxRetries - The maximum number of retries. Defaults to 2.
	 * @param options.temperature - The temperature to use for the model. Defaults to 0.
	 * @param options.maxTokens - The maximum number of tokens to generate.
	 * @returns A promise that resolves to the extracted data.
	 */
	public async extractWithFallback<T>(options: ExtractWithFallbackOptions<T>): Promise<T> {
		const { schema, promptConfig, toolChoice, maxRetries = 5, temperature = 0, maxTokens } = options;
		let lastErr: unknown = null;
		let retries = 0;

		for (const { model } of Object.values(LlmService.AI_MODELS)) {
			try {
				this.logger.info(`▶️  trying ${model}`);
				return await this.extractInternal({
					model,
					schema,
					promptConfig,
					toolChoice,
					temperature,
					maxTokens,
				});
			} catch (err) {
				lastErr = err;
				this.logger.error(`⚠️  ${model} failed: ${err?.toString()}`);
				retries++;
				if (retries >= maxRetries) {
					throw new AppError(`All models failed\n${lastErr}`, 500, lastErr);
				}

				await this.backoff(retries);
			}
		}

		throw new AppError(`All models failed\n${lastErr}`, 500, lastErr);
	}

	public getUsage() {
		return {
			promptTokens: this.promptTokens,
			completionTokens: this.completionTokens,
		};
	}

	public getEstimatedCost() {
		const pricing = LlmService.AI_MODELS.openai.cost;
		return (this.promptTokens / 1_000_000) * pricing.input + (this.completionTokens / 1_000_000) * pricing.output;
	}
}
