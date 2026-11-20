import { z as z3 } from 'zod';
import { z } from 'zod/v4';
import { categorySchema } from './category.schema.js';
import { DataResponseSchema, sortOrderEnum } from './common.schema.js';

const merchantCoreFields = {
	name: z.string().min(1, 'Name is required').describe('The name of the merchant'),
	customName: z.string().describe('Custom name assigned by the user').nullable().optional(),
};

const merchantCoreFields3 = {
	name: z3.string().min(1, 'Name is required').describe('The name of the merchant'),
	customName: z3.string().describe('Custom name assigned by the user').nullable().optional(),
};

export const merchantSchema = z
	.object({
		id: z.string().describe('Unique identifier for the merchant'),
		...merchantCoreFields,
		category: categorySchema.describe('Category associated with this merchant'),
	})
	.describe('A merchant where an transaction can occur');

export const createMerchantSchema = z
	.object({
		...merchantCoreFields,
		categoryId: z.string().describe('The category id for this merchant'),
	})
	.describe('Data required to create a merchant');

const merchantsDataSchema = z.object({
	merchants: z.array(merchantSchema),
});
export const merchantsListSchema = DataResponseSchema(merchantsDataSchema);

export const merchantsQuerySchema = z.object({
        order: sortOrderEnum.optional(),
});

const merchantDataSchema = z.object({
	merchant: merchantSchema.optional(),
});
export const merchantResponseSchema = DataResponseSchema(merchantDataSchema);

const createMerchantDataSchema = z.object({
	id: z.string(),
});
export const merchantCreateResponseSchema = DataResponseSchema(createMerchantDataSchema);

export const merchantIdParamSchema = z.object({
	id: z.string(),
});

export type Merchant = z.infer<typeof merchantSchema>;
export type CreateMerchant = z.infer<typeof createMerchantSchema>;
export type MerchantsListResponse = z.infer<typeof merchantsListSchema>;
export type MerchantResponse = z.infer<typeof merchantResponseSchema>;
export type MerchantCreateResponse = z.infer<typeof merchantCreateResponseSchema>;
export type MerchantsQuery = z.infer<typeof merchantsQuerySchema>;
