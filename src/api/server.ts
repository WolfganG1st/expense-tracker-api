import { env } from '@/env.js';
import fastifyCookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { globalErrorHandler } from '@middleware/errors/error-handler.js';
import { sanitizeRequest } from '@middleware/security/index.js';
import {
	authControllerPlugin,
	avatarServicePlugin,
	categoryControllerPlugin,
	categoryInferencePlugin,
	categoryPlugin,
	googleOAuthPlugin,
	jwtConfigPlugin,
	llmServicePlugin,
	merchantControllerPlugin,
	merchantServicePlugin,
	profileControllerPlugin,
	reportControllerPlugin,
	reportServicePlugin,
	serverConfigPlugin,
	staticFilesPlugin,
	transactionControllerPlugin,
	transactionParsingServicePlugin,
	transactionPlugin,
	userControllerPlugin,
	userServicePlugin,
} from '@plugins/index.js';
import { registrationOrder } from '@plugins/plugin-constants.js';
import { registerPlugins } from '@plugins/utils/plugin-manager.js';
import { prismaPlugin } from '@plugins/utils/prisma.plugin.js';
import { prismockPlugin } from '@plugins/utils/prismock.plugin.js';
import { registerRoutes } from '@routes/index.js';
import { createLoggerConfig } from '@utils/logger.js';
import fastify, { type FastifyInstance, type FastifyPluginAsync, type FastifyRequest } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

/**
 * Creates and configures the Fastify server instance
 * @returns Configured Fastify server
 */
export async function buildServer(): Promise<FastifyInstance> {
	const logLevel = env.logLevel || (env.nodeEnv === 'production' ? 'info' : 'debug');

	const server = fastify({
		logger: createLoggerConfig(logLevel),
		trustProxy: env.trustProxy,
		ajv: {
			customOptions: {
				strict: false,
				allowUnionTypes: true,
			},
		},
		allowErrorHandlerOverride: true,
	});

	await server.register(fastifyCookie);
	await server.register(multipart);

	await server.register(helmet, {
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				scriptSrc: ["'self'"],
				// Needed for Swagger UI
				imgSrc: ["'self'", 'data:'],
				connectSrc: ["'self'"],
			},
		},
		xssFilter: true,
		noSniff: true,
		hidePoweredBy: true,
		frameguard: {
			action: 'deny',
		},
	});

	await server.register(cors, {
		origin: env.nodeEnv === 'production' ? env.baseUrl : true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
		maxAge: 86400, // 24 hours in seconds
		exposedHeaders: ['X-Rate-Limit'],
	});

	// Register Swagger documentation only in non-production environments
	if (env.nodeEnv !== 'production') {
		await server.register(swagger, {
			mode: 'dynamic',
			openapi: {
				info: {
					title: 'Credit Transactions API',
					description: 'API for managing credit card transactions',
					version: '1.0.0',
				},
				externalDocs: {
					url: 'https://swagger.io',
					description: 'Find more info here',
				},
				servers: [
					{
						url: `http://localhost:${env.port || '3100'}`,
					},
				],
				components: {
					securitySchemes: {
						bearerAuth: {
							type: 'http',
							scheme: 'bearer',
							bearerFormat: 'JWT',
							description: 'Enter JWT token to authenticate',
						},
					},
				},
				security: [
					{
						bearerAuth: [],
					},
				],
			},
		});

		await server.register(swaggerUi, {
			routePrefix: '/documentation',
		});
	}

	const usePrismock = process.env.JEST_WORKER_ID !== undefined;

	const pluginsToRegister: Array<{ plugin: FastifyPluginAsync; order: number }> = [];

	// Layer 0: Core utilities (registrationOrder.core)
	if (usePrismock) {
		pluginsToRegister.push({ plugin: prismockPlugin, order: registrationOrder.core });
	} else {
		pluginsToRegister.push({ plugin: prismaPlugin, order: registrationOrder.core });
	}
	pluginsToRegister.push({ plugin: serverConfigPlugin, order: registrationOrder.core });
	pluginsToRegister.push({ plugin: staticFilesPlugin, order: registrationOrder.core });
	pluginsToRegister.push({ plugin: googleOAuthPlugin, order: registrationOrder.core });

	// Layer 2: Service plugins (registrationOrder.services)
	pluginsToRegister.push({ plugin: categoryPlugin, order: registrationOrder.services });
	pluginsToRegister.push({ plugin: merchantServicePlugin, order: registrationOrder.services });
	pluginsToRegister.push({ plugin: llmServicePlugin, order: registrationOrder.services });
	pluginsToRegister.push({ plugin: categoryInferencePlugin, order: registrationOrder.services });
	pluginsToRegister.push({ plugin: transactionPlugin, order: registrationOrder.services });
	pluginsToRegister.push({ plugin: transactionParsingServicePlugin, order: registrationOrder.services });
	pluginsToRegister.push({ plugin: avatarServicePlugin, order: registrationOrder.services });
	pluginsToRegister.push({ plugin: userServicePlugin, order: registrationOrder.services });
	pluginsToRegister.push({ plugin: reportServicePlugin, order: registrationOrder.services });

	// Layer 3: Controller plugins
	pluginsToRegister.push({ plugin: transactionControllerPlugin, order: registrationOrder.controllers });
	pluginsToRegister.push({ plugin: categoryControllerPlugin, order: registrationOrder.controllers });
	pluginsToRegister.push({ plugin: merchantControllerPlugin, order: registrationOrder.controllers });
	pluginsToRegister.push({ plugin: authControllerPlugin, order: registrationOrder.controllers });
	pluginsToRegister.push({ plugin: profileControllerPlugin, order: registrationOrder.controllers });
	pluginsToRegister.push({ plugin: userControllerPlugin, order: registrationOrder.controllers });
	pluginsToRegister.push({ plugin: reportControllerPlugin, order: registrationOrder.controllers });

	// JWT plugin always registered last
	pluginsToRegister.push({ plugin: jwtConfigPlugin, order: registrationOrder.controllers + 1 });

	// Register all selected plugins
	await registerPlugins(server, pluginsToRegister);

	registerRoutes(server);

	// Global validation error handler
	server.setValidatorCompiler(validatorCompiler);
	server.setSerializerCompiler(serializerCompiler);

	server.setErrorHandler(globalErrorHandler);

	const isTestEnvironment = env.nodeEnv === 'test' || process.env.JEST_WORKER_ID !== undefined;

	await server.register(rateLimit, {
		max: isTestEnvironment ? 1000 : 100,
		timeWindow: '1 minute',
		errorResponseBuilder: (_request, context) => ({
			statusCode: 429,
			error: 'Too Many Requests',
			message: `Rate limit exceeded, retry in ${context.after}`,
		}),
		addHeaders: {
			'x-ratelimit-limit': true,
			'x-ratelimit-remaining': true,
			'x-ratelimit-reset': true,
			'retry-after': true,
		},
		hook: 'onRequest',
		skipOnError: false,
		keyGenerator: (request: FastifyRequest): string => {
			return request.ip || (request.headers['x-forwarded-for'] as string | undefined) || '';
		},
		allowList: (request: FastifyRequest): boolean => {
			// Skip health checks and docs (when docs are available)
			if (
				request.url.startsWith('/health') ||
				(env.nodeEnv !== 'production' && request.url.startsWith('/documentation'))
			) {
				return true;
			}
			// Skip auth routes in test environment
			if (isTestEnvironment && request.url.includes('/api/auth')) {
				return true;
			}
			return false;
		},
	});

	server.addHook('preValidation', (request, reply, done) => {
		if (request.url.startsWith('/api/auth/google/callback')) {
			return done();
		}
		sanitizeRequest(request);
		done();
	});

	server.addHook('onResponse', (request, reply, done) => {
		if (reply.statusCode >= 400 && env.nodeEnv === 'production') {
			request.log.info(
				{
					method: request.method,
					url: request.url,
					statusCode: reply.statusCode,
					// Don't log sensitive data
					query: request.query ? '(redacted)' : undefined,
					body: request.body ? '(redacted)' : undefined,
				},
				'Request processed with error',
			);
		}
		done();
	});

	return server;
}
