import { z } from 'zod/v4';

/**
 * Standard API response schema shared across modules.
 */
export const BaseResponseSchema = z
	.object({
		message: z.string().optional().describe('A message providing details about the operation outcome'),
	})
	.describe('A basic response structure including an optional message.');

export const DataResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
        BaseResponseSchema.extend({
                data: dataSchema
                        .optional()
                        .describe('The payload of the response, if applicable. Its structure is defined by the provided dataSchema.'),
        }).describe('A generic response structure that extends BaseResponseSchema to include an optional data payload.');

/**
 * Enumeration for sorting order used across list endpoints
 */
export const sortOrderEnum = z.enum(['asc', 'desc']);
export type SortOrder = z.infer<typeof sortOrderEnum>;
