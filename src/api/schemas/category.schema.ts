import { z as z3 } from 'zod';
import { z } from 'zod/v4';
import { BaseResponseSchema, DataResponseSchema, sortOrderEnum } from './common.schema.js';

// Shared fields for a category
const baseCategoryFields = {
	name: z.string().min(1, 'Name is required').describe('The name of the category'),
	description: z.string().nullable().describe('An optional description for the category'),
	icon: z.string().describe('Icon identifier for this category').nullable().optional(),
};

const baseCategoryFields3 = {
	name: z3.string().min(1, 'Name is required').describe('The name of the category'),
	description: z3.string().nullable().describe('An optional description for the category'),
	icon: z3.string().describe('Icon identifier for this category').nullable().optional(),
};
// Internal fields not exposed when creating a category
const internalCategoryFields = {
	isDefault: z
		.boolean()
		.nullable()
		.describe('Indicates if this is a default category, automatically available to users')
		.default(false),
	createdAt: z.date().default(() => new Date()),
};

const internalCategoryFields3 = {
	isDefault: z3
		.boolean()
		.nullable()
		.describe('Indicates if this is a default category, automatically available to users')
		.default(false),
	createdAt: z3.date().default(() => new Date()),
};

// Schema representing a category, including its unique identifier
export const categorySchema = z
	.object({
		id: z.string().describe('The unique identifier for the category'),
		...baseCategoryFields,
		...internalCategoryFields,
	})
	.describe('Defines the structure and properties of a category');

// Schema representing a category, including its unique identifier
export const categorySchema3 = z3
	.object({
		id: z3.string().describe('The unique identifier for the category'),
		...baseCategoryFields3,
		...internalCategoryFields3,
	})
	.describe('Defines the structure and properties of a category');

// Schema for the data required to create a new category
export const createCategorySchema = z.object(baseCategoryFields).describe('Data required to create a new category');

// Schema for the response when listing multiple categories
const categoriesDataSchema = z.object({
	categories: z.array(categorySchema).describe('An array containing the list of categories'),
});
export const categoriesListSchema = DataResponseSchema(categoriesDataSchema).describe(
        'Response schema for a list of categories with an optional message',
);

// Query params for listing categories
export const categoriesQuerySchema = z.object({
        order: sortOrderEnum.optional(),
});

// Schema for the response when retrieving a single category
const categoryDataSchema = z.object({
	category: categorySchema.optional().describe('The category object, if found'),
});
export const categoryResponseSchema = DataResponseSchema(categoryDataSchema).describe(
	'Response schema for a single category with optional category data and message',
);

// Schema for the response after successfully creating a category
const createCategoryDataSchema = z.object({
	id: z.string().describe('The unique identifier of the newly created category'),
});
export const categoryCreateResponseSchema = DataResponseSchema(createCategoryDataSchema).describe(
	'Response schema after creating a category, including the new category ID and message',
);

// Schema for the response after updating a category
export const categoryUpdateResponseSchema = BaseResponseSchema.describe(
	'Response schema after attempting to update a category, including an optional message',
);

// Schema for the response after deleting a category
export const categoryDeleteResponseSchema = BaseResponseSchema.describe(
	'Response schema after attempting to delete a category, including an optional message',
);

// Schema for validating a category ID provided as a route parameter
export const categoryIdParamSchema = z
	.object({
		id: z.string().describe('The unique identifier of the category to be targeted by the route operation'),
	})
	.describe('Schema for validating the category ID path parameter in API routes');

// Export types for use in routes and services
export type Category = z.infer<typeof categorySchema>;
export type CreateCategory = z.infer<typeof createCategorySchema>;
export type CategoriesListResponse = z.infer<typeof categoriesListSchema>;
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
export type CategoryCreateResponse = z.infer<typeof categoryCreateResponseSchema>;
export type CategoryUpdateResponse = z.infer<typeof categoryUpdateResponseSchema>;
export type CategoryDeleteResponse = z.infer<typeof categoryDeleteResponseSchema>;
export type CategoriesQuery = z.infer<typeof categoriesQuerySchema>;
