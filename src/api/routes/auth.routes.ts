import type {
	CheckEmailInput,
	CheckEmailResponse,
	CreateUserInput,
	GoogleCallbackQuery,
	LoginResponse,
	LoginUserInput,
	RefreshResponse,
} from '@schemas/user.schema.js';
import {
	checkEmailResponseSchema,
	checkEmailSchema,
	createUserSchema,
	googleCallbackQuerySchema,
	googleLoginBodySchema,
	loginResponseSchema,
	loginUserSchema,
	refreshResponseSchema,
} from '@schemas/user.schema.js';
import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance): Promise<void> => {
	const { authController } = fastify;
	await Promise.resolve('routes initialized');

	fastify.post('/register', {
		schema: {
			body: createUserSchema,
			response: { 201: loginResponseSchema },
		},
		handler: async (
			request: FastifyRequest<{ Body: CreateUserInput }>,
			reply: FastifyReply,
		): Promise<LoginResponse> => {
			return await authController.registerUser(request, reply);
		},
	});

	fastify.post('/login', {
		schema: {
			body: loginUserSchema,
			response: { 200: loginResponseSchema },
		},
		handler: async (request: FastifyRequest<{ Body: LoginUserInput }>, reply: FastifyReply): Promise<LoginResponse> => {
			return await authController.loginUser(request, reply);
		},
	});

	fastify.get('/check-email', {
		schema: {
			querystring: checkEmailSchema,
			response: { 200: checkEmailResponseSchema },
		},
		handler: async (request: FastifyRequest<{ Querystring: CheckEmailInput }>): Promise<CheckEmailResponse> =>
			authController.checkEmail(request),
	});

	fastify.get('/google/callback', {
		schema: {
			querystring: googleCallbackQuerySchema,
			response: { 200: loginResponseSchema },
		},
		handler: async (
			request: FastifyRequest<{ Querystring: GoogleCallbackQuery }>,
			reply: FastifyReply,
		): Promise<LoginResponse> => {
			return await authController.handleGoogleCallback(request, reply);
		},
	});

	fastify.post('/google', {
		schema: {
			body: googleLoginBodySchema,
			response: { 200: loginResponseSchema },
		},
		handler: authController.loginWithGoogle.bind(authController),
	});

	fastify.post('/refresh', {
		schema: {
			response: { 200: refreshResponseSchema },
		},
		preHandler: fastify.authenticate,
		handler: async (request: FastifyRequest, reply: FastifyReply): Promise<RefreshResponse> => {
			const { id, email, role } = request.user;
			const token = await reply.jwtSign({ id, email, role }, { expiresIn: '1d' });
			return { accessToken: token };
		},
	});
};
