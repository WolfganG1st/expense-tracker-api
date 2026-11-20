import { z } from 'zod';

export const envSchemaDefinition = z
	.object({
		PORT: z.coerce.number({ invalid_type_error: 'PORT must be a number.' }).optional().default(8123),
		HOST: z.string().optional().default('0.0.0.0'),
		NODE_ENV: z
			.enum(['development', 'production', 'test'], {
				errorMap: (_issue, ctx) => ({
					message: `NODE_ENV must be 'development', 'production', or 'test'. Received: '${ctx.data}'`,
				}),
			})
			.optional()
			.default('development'),
		X_TZ: z.string().optional().default('America/Sao_Paulo'),
		USER_ENCRYPTION_KEY: z.string().optional(),
		JWT_SECRET: z.string().optional(),
		GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
		GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
		GOOGLE_OAUTH_CALLBACK_URL: z.string().optional(),
		ANTHROPIC_API_KEY: z.string().optional(),
		ANTHROPIC_API_KEY_FOR_MODEL: z.string().optional(),
		PERPLEXITY_API_KEY: z.string().optional(),
		MODEL: z.string().optional().default('claude-3-7-sonnet-20250219'),
		PERPLEXITY_MODEL: z.string().optional().default('sonar-pro'),
		MAX_TOKENS: z.coerce
			.number({ invalid_type_error: 'MAX_TOKENS must be a number.' })
			.int('MAX_TOKENS must be an integer.')
			.min(1, 'MAX_TOKENS must be at least 1.')
			.optional()
			.default(64000),
		TEMPERATURE: z.coerce
			.number({ invalid_type_error: 'TEMPERATURE must be a number (e.g., 0.7).' })
			.min(0, 'TEMPERATURE must be >= 0.')
			.max(2, 'TEMPERATURE must be <= 2.')
			.optional()
			.default(0.7),
		DEBUG: z.coerce
			.boolean({ invalid_type_error: 'DEBUG must be a boolean (true or false).' })
			.optional()
			.default(false),
		LOG_LEVEL: z
			.enum(['debug', 'info', 'warn', 'error'], {
				errorMap: (_issue, ctx) => ({
					message: `LOG_LEVEL must be one of 'debug', 'info', 'warn', 'error'. Received: '${ctx.data}'`,
				}),
			})
			.optional()
			.default('info'),
		DEFAULT_SUBTASKS: z.coerce
			.number({ invalid_type_error: 'DEFAULT_SUBTASKS must be a number.' })
			.int('DEFAULT_SUBTASKS must be an integer.')
			.min(0, 'DEFAULT_SUBTASKS cannot be negative.')
			.optional()
			.default(5),
		DEFAULT_PRIORITY: z
			.enum(['high', 'medium', 'low'], {
				errorMap: (_issue, ctx) => ({
					message: `DEFAULT_PRIORITY must be one of 'high', 'medium', 'low'. Received: '${ctx.data}'`,
				}),
			})
			.optional()
			.default('medium'),
		PROJECT_NAME: z.string().optional().default('Credit Transactions App'),
		OPEN_ROUTER_API_KEY: z
			.string({ required_error: 'OPEN_ROUTER_API_KEY is required.' })
			.min(1, 'OPEN_ROUTER_API_KEY cannot be empty.'),
		OPEN_ROUTER_BASE_URL: z
			.string()
			.url({ message: 'OPEN_ROUTER_BASE_URL must be a valid URL.' })
			.optional()
			.default('https://openrouter.ai/api/v1'),
		ADMIN_EMAIL: z
			.string()
			.email({ message: 'ADMIN_EMAIL must be a valid email address.' })
			.optional()
			.default('admin@email.com'),
		ADMIN_PASSWORD: z.string().min(1, 'ADMIN_PASSWORD cannot be empty.').optional().default('adminhashedpassword'),
		TRUST_PROXY: z.coerce
			.boolean({ invalid_type_error: 'TRUST_PROXY must be a boolean (true or false).' })
			.optional()
			.default(false),
		BASE_URL: z.string().url({ message: 'BASE_URL must be a valid URL.' }).optional().default('http://localhost:8123'),
	})
	.transform((e) => ({
		port: e.PORT,
		host: e.HOST,
		nodeEnv: e.NODE_ENV,
		tz: e.X_TZ,
		userEncryptionKey: e.USER_ENCRYPTION_KEY,
		jwtSecret: e.JWT_SECRET,
		googleOauthClientId: e.GOOGLE_OAUTH_CLIENT_ID,
		googleOauthClientSecret: e.GOOGLE_OAUTH_CLIENT_SECRET,
		googleOauthCallbackUrl: e.GOOGLE_OAUTH_CALLBACK_URL,
		anthropicApiKey: e.ANTHROPIC_API_KEY,
		anthropicApiKeyForModel: e.ANTHROPIC_API_KEY_FOR_MODEL,
		perplexityApiKey: e.PERPLEXITY_API_KEY,
		model: e.MODEL,
		perplexityModel: e.PERPLEXITY_MODEL,
		maxTokens: e.MAX_TOKENS,
		temperature: e.TEMPERATURE,
		debug: e.DEBUG,
		logLevel: e.LOG_LEVEL,
		defaultSubtasks: e.DEFAULT_SUBTASKS,
		defaultPriority: e.DEFAULT_PRIORITY,
		projectName: e.PROJECT_NAME,
		openRouterApiKey: e.OPEN_ROUTER_API_KEY,
		openRouterBaseUrl: e.OPEN_ROUTER_BASE_URL,
		adminEmail: e.ADMIN_EMAIL,
		adminPassword: e.ADMIN_PASSWORD,
		trustProxy: e.TRUST_PROXY,
		baseUrl: e.BASE_URL,
	}));

export type Env = z.infer<typeof envSchemaDefinition>;
