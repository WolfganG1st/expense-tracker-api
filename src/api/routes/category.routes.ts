import {
        type CategoriesListResponse,
        type CategoryCreateResponse,
        type CategoryDeleteResponse,
        type CategoryResponse,
        type CategoryUpdateResponse,
        type CreateCategory,
        type CategoriesQuery,
        categoriesListSchema,
        categoryCreateResponseSchema,
        categoryDeleteResponseSchema,
        categoryIdParamSchema,
        categoriesQuerySchema,
        categoryResponseSchema,
        categoryUpdateResponseSchema,
        createCategorySchema,
} from '@schemas/category.schema.js';
import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';

/**
 * Routes for handling category operations
 * @param fastify - Fastify instance
 * @returns void
 */
export const categoryRoutes: FastifyPluginAsync = async (fastify: FastifyInstance): Promise<void> => {
	const { categoryController } = fastify;

	// Add await operation to satisfy linter
	await Promise.resolve('routes initialized');

	fastify.get('/', {
		preHandler: [fastify.authenticate],
                schema: {
                        querystring: categoriesQuerySchema,
                        response: {
                                200: categoriesListSchema,
                        },
                },
                handler: async (request: FastifyRequest<{ Querystring: CategoriesQuery }>): Promise<CategoriesListResponse> => {
                        request.log.info('Getting all categories');
                        const userId = request.user.id;
                        const { order } = request.query;
                        const result = await categoryController.getAllCategories(userId, order);
			request.log.info(`Retrieved ${result.data?.categories.length ?? 0} categories`);
			return result;
		},
	});

	fastify.get('/:id', {
		preHandler: [fastify.authenticate],
		schema: {
			params: categoryIdParamSchema,
			response: {
				200: categoryResponseSchema,
			},
		},
		handler: async (request: FastifyRequest<{ Params: { id: string } }>): Promise<CategoryResponse> => {
			const { id } = request.params;
			request.log.info(`Getting category with ID: ${id}`);
			const userId = request.user.id;

			const result = await categoryController.getCategoryById(userId, id);
			if (result.data?.category) {
				request.log.info(`Retrieved category: ${result.data.category.id}`);
			} else {
				request.log.info(`Category not found or error: ${result.message}`);
			}
			return result;
		},
	});

	fastify.post('/', {
		preHandler: [fastify.authenticate],
		schema: {
			body: createCategorySchema,
			response: {
				201: categoryCreateResponseSchema,
			},
		},
		handler: async (request: FastifyRequest<{ Body: CreateCategory }>): Promise<CategoryCreateResponse> => {
			const userId = request.user.id;

			const { name, description, icon } = request.body;
			request.log.info(`Creating new category: ${name}`);

			const result = await categoryController.createCategory(userId, name, description, icon);
			if (result.data?.id) {
				request.log.info(`Created new category with ID: ${result.data.id}`);
			} else {
				request.log.error(`Failed to create category: ${result.message}`);
			}
			return result;
		},
	});

	fastify.put('/:id', {
		preHandler: [fastify.authenticate],
		schema: {
			params: categoryIdParamSchema,
			body: createCategorySchema,
			response: {
				200: categoryUpdateResponseSchema,
			},
		},
		handler: async (
			request: FastifyRequest<{ Params: { id: string }; Body: CreateCategory }>,
		): Promise<CategoryUpdateResponse> => {
			const { id } = request.params;
			const { name, description, icon } = request.body;
			request.log.info(`Updating category with ID: ${id}`);
			const userId = request.user.id;

			const result = await categoryController.updateCategory(userId, id, name, description, icon);
			request.log.info(result.message ?? `Updated category: ${id}`);
			return result;
		},
	});

	fastify.delete('/:id', {
		preHandler: [fastify.authenticate],
		schema: {
			params: categoryIdParamSchema,
			response: {
				200: categoryDeleteResponseSchema,
			},
		},
		handler: async (request: FastifyRequest<{ Params: { id: string } }>): Promise<CategoryDeleteResponse> => {
			const { id } = request.params;
			request.log.info(`Deleting category with ID: ${id}`);
			const userId = request.user.id;

			const result = await categoryController.deleteCategory(userId, id);
			request.log.info(result.message ?? `Deleted category: ${id}`);
			return result;
		},
	});
};
