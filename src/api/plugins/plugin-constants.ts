/**
 * Defines the registration order and dependencies for plugins
 * Lower numbers are registered first
 */

// Plugin names (for dependency declarations)
export const pluginNames = {
	// Configuration plugins
	serverConfig: 'serverConfigPlugin',
	prisma: 'prismaPlugin',
	googleOAuth: 'googleOAuthPlugin',
	staticFiles: 'staticFilesPlugin',

	// Service plugins
	transactionService: 'transactionPlugin',
	categoryService: 'categoryPlugin',
	merchantService: 'merchantServicePlugin',
	categoryInferenceService: 'categoryInferenceServicePlugin',
	llmService: 'llmServicePlugin',
	avatarService: 'avatarServicePlugin',
	transactionParsingService: 'transactionParsingServicePlugin',
	userService: 'userServicePlugin',
	reportService: 'reportServicePlugin',

	// Controller plugins
	transactionController: 'transactionControllerPlugin',
	categoryController: 'categoryControllerPlugin',
	merchantController: 'merchantControllerPlugin',
	authController: 'authControllerPlugin',
	profileController: 'profileControllerPlugin',
	userController: 'userControllerPlugin',
	reportController: 'reportControllerPlugin',
} as const;

// Registration order (lower numbers first)
export const registrationOrder = {
	// Core utilities
	core: 0,

	// Configuration layer (first)
	config: 1,

	// Service layer (depends on config)
	services: 2,

	// Controller layer (depends on services)
	controllers: 3,
} as const;
