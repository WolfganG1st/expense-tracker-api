import { z } from 'zod';
import { env } from '../../env.js';
import { type ExtractOptions, LlmService, type PromptConfig, type ToolChoice } from './llm.service.js';
import type { FastifyBaseLogger } from 'fastify';
import { fromPartial } from '@total-typescript/shoehorn';
jest.mock('../../env.js', () => ({
	env: {
		openRouterApiKey: 'test-key',
	},
}));

describe('LlmService', () => {
        let service: LlmService;
        let logger: jest.Mocked<FastifyBaseLogger>;

	beforeAll(() => {
		env.openRouterApiKey = 'test-key';
	});

        beforeEach(() => {
                logger = fromPartial<jest.Mocked<FastifyBaseLogger>>({ info: jest.fn(), error: jest.fn() });
                service = new LlmService(logger);
		(service as any).client = {
			chat: {
				completions: {
					create: jest.fn(),
				},
			},
		};
	});

	describe('extract', () => {
		it('should return parsed response', async () => {
			const schema = z.object({ foo: z.string() });
			const promptConfig: PromptConfig = { system: 'system', prompt: 'prompt' };
			const toolChoice: ToolChoice<{ foo: string }> = {
				name: 'test',
				description: 'desc',
				parameters: schema,
			};
			const options: ExtractOptions<{ foo: string }> = {
				model: 'test-model',
				schema,
				promptConfig,
				toolChoice,
				temperature: 0.5,
				maxTokens: 80,
			};

			(service as any).client.chat.completions.create.mockResolvedValue({
				choices: [
					{
						message: {
							tool_calls: [{ function: { arguments: JSON.stringify({ foo: 'bar' }) } }],
						},
					},
				],
			});

			const result = await service.extract(options);
			expect(result).toEqual({ foo: 'bar' });
			expect((service as any).client.chat.completions.create).toHaveBeenCalledWith(
				expect.objectContaining({
					model: options.model,
					tools: [
						expect.objectContaining({
							type: 'function',
							function: expect.objectContaining({ name: toolChoice.name, description: toolChoice.description }),
						}),
					],
					tool_choice: {
						type: 'function',
						function: expect.objectContaining({ name: toolChoice.name }),
					},
					temperature: 0.5,
					max_tokens: 80,
					messages: [
						{ role: 'system', content: 'system' },
						{ role: 'user', content: 'prompt' },
					],
				}),
			);
		});

		it('repairs invalid json responses', async () => {
			const schema = z.object({ foo: z.string() });
			const promptConfig: PromptConfig = { system: 's', prompt: 'p' };
			const toolChoice: ToolChoice<{ foo: string }> = { name: 't', description: 'd', parameters: schema };
			(service as any).client.chat.completions.create.mockResolvedValue({
				choices: [
					{
						message: {
							tool_calls: [{ function: { arguments: '{foo:"bar"}' } }],
						},
					},
				],
			});

			const result = await service.extract({ model: 'm', schema, promptConfig, toolChoice, maxTokens: 10 });
			expect(result).toEqual({ foo: 'bar' });
		});
	});

	describe('extractWithFallback', () => {
		it('should return result on first successful attempt', async () => {
			(service as any).extractInternal = jest.fn().mockResolvedValue({ foo: 'baz' });
			const schema = z.object({ foo: z.string() });
			const promptConfig: PromptConfig = { system: 'system', prompt: 'prompt' };
			const toolChoice: ToolChoice<{ foo: string }> = {
				name: 'test',
				description: 'desc',
				parameters: schema,
			};
			const options = { schema, promptConfig, toolChoice, maxRetries: 2, temperature: 0.1, maxTokens: 80 };

			const result = await service.extractWithFallback(options);
			expect(result).toEqual({ foo: 'baz' });
			expect((service as any).extractInternal).toHaveBeenCalledTimes(1);
		});

		it('should throw error when extraction fails', async () => {
			(service as any).extractInternal = jest.fn().mockRejectedValue(new Error('fail'));
			const schema = z.object({ foo: z.string() });
			const promptConfig: PromptConfig = { system: 'system', prompt: 'prompt' };
			const toolChoice: ToolChoice<{ foo: string }> = {
				name: 'test',
				description: 'desc',
				parameters: schema,
			};
			const options = { schema, promptConfig, toolChoice, maxRetries: 2, temperature: 0, maxTokens: 80 };

			await expect(service.extractWithFallback(options)).rejects.toThrow('All models failed');
			expect((service as any).extractInternal).toHaveBeenCalledTimes(1);
		});

		it('stops after maxRetries reached', async () => {
			(service as any).extractInternal = jest.fn().mockRejectedValue(new Error('fail'));
			const schema = z.object({ foo: z.string() });
			const promptConfig: PromptConfig = { system: 's', prompt: 'p' };
			const toolChoice: ToolChoice<{ foo: string }> = { name: 't', description: 'd', parameters: schema };
			const options = { schema, promptConfig, toolChoice, maxRetries: 1, maxTokens: 5 };
			await expect(service.extractWithFallback(options)).rejects.toThrow('All models failed');
			expect((service as any).extractInternal).toHaveBeenCalledTimes(1);
			expect(logger.error).toHaveBeenCalled();
		});
	});
});
