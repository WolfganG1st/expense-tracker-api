import {
        type MerchantCreateResponse,
        type MerchantResponse,
        type MerchantsListResponse,
        type MerchantsQuery,
        createMerchantSchema,
        merchantCreateResponseSchema,
        merchantIdParamSchema,
        merchantResponseSchema,
        merchantsListSchema,
        merchantsQuerySchema,
} from '@schemas/merchant.schema.js';
import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';

export const merchantsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance): Promise<void> => {
	const { merchantController } = fastify;
	await Promise.resolve('routes initialized');

        fastify.get('/', {
                preHandler: [fastify.authenticate],
                schema: {
                        querystring: merchantsQuerySchema,
                        response: {
                                200: merchantsListSchema,
                        },
                },
                handler: (request: FastifyRequest<{ Querystring: MerchantsQuery }>): Promise<MerchantsListResponse> => {
                        const userId = request.user.id;
                        const { order } = request.query;
                        return merchantController.getAllMerchants(userId, order);
                },
        });

	fastify.get('/:id', {
		preHandler: [fastify.authenticate],
		schema: {
			params: merchantIdParamSchema,
			response: { 200: merchantResponseSchema },
		},
		handler: (request: FastifyRequest<{ Params: { id: string } }>): Promise<MerchantResponse> => {
			const userId = request.user.id;
			const { id } = request.params;
			return merchantController.getMerchantById(userId, id);
		},
	});

	fastify.post('/', {
		preHandler: [fastify.authenticate],
		schema: {
			body: createMerchantSchema,
			response: { 201: merchantCreateResponseSchema },
		},
		handler: async (
			request: FastifyRequest<{ Body: { name: string; categoryId: string; customName?: string | null } }>,
			reply: FastifyReply,
		): Promise<MerchantCreateResponse> => {
			const userId = request.user.id;
			const { name, categoryId, customName } = request.body;
			const result = await merchantController.createMerchant(userId, name, categoryId, customName);
			reply.code(201);
			return result;
		},
	});
};
