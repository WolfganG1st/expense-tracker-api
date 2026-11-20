import type { CreateUserResponse, UpdateAvatarResponse, UpdateUserInput } from '@schemas/user.schema.js';
import { createUserResponseSchema, updateAvatarSchema, updateUserSchema } from '@schemas/user.schema.js';
import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';

export const profileRoutes: FastifyPluginAsync = async (fastify: FastifyInstance): Promise<void> => {
	const { profileController } = fastify;
	await Promise.resolve('routes initialized');

	fastify.get('/me', {
		schema: {
			response: { 200: createUserResponseSchema },
		},
		preHandler: fastify.authenticate,
		handler: async (request: FastifyRequest): Promise<CreateUserResponse> => {
			return await profileController.getCurrentUser(request);
		},
	});

	fastify.patch('/me', {
		schema: {
			body: updateUserSchema,
			response: { 200: createUserResponseSchema },
		},
		preHandler: fastify.authenticate,
		handler: async (request: FastifyRequest<{ Body: UpdateUserInput }>): Promise<CreateUserResponse> => {
			return await profileController.updateCurrentUser(request);
		},
	});

	fastify.patch('/avatar', {
		schema: {
			consumes: ['multipart/form-data'],
			response: { 200: updateAvatarSchema },
		},
		preHandler: fastify.authenticate,
		handler: async (request: FastifyRequest, reply: FastifyReply): Promise<UpdateAvatarResponse> =>
			profileController.updateAvatar(request, reply),
	});
};
