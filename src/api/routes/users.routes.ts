import type { UserDeleteResponse, UsersListResponse, UsersQuery } from '@schemas/user.schema.js';
import { userDeleteResponseSchema, userIdParamSchema, usersListSchema, usersQuerySchema } from '@schemas/user.schema.js';
import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';

export const usersRoutes: FastifyPluginAsync = async (fastify: FastifyInstance): Promise<void> => {
	const { userController } = fastify;
	await Promise.resolve('routes initialized');

        fastify.get('/', {
                preHandler: [fastify.authenticate],
                schema: {
                        querystring: usersQuerySchema,
                        response: { 200: usersListSchema },
                },
                handler: async (request: FastifyRequest<{ Querystring: UsersQuery }>): Promise<UsersListResponse> => {
                        if (request.user.role !== 'ADMIN') {
                                throw new Error('Unauthorized access');
                        }
                        const { order } = request.query;
                        const result = await userController.getAllUsers(order);
                        return result;
                },
        });

	fastify.delete('/:id', {
		preHandler: [fastify.authenticate],
		schema: {
			params: userIdParamSchema,
			response: { 200: userDeleteResponseSchema },
		},
		handler: async (request: FastifyRequest<{ Params: { id: string } }>): Promise<UserDeleteResponse> => {
			if (request.user.role !== 'ADMIN') {
				throw new Error('Unauthorized access');
			}
			const { id } = request.params;
			return await userController.deleteUser(id);
		},
	});
};
