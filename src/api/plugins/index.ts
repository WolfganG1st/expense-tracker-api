import { serverConfigPlugin, staticFilesPlugin } from './config/index.js';
import { transactionControllerPlugin } from './controllers/index.js';
import { merchantControllerPlugin } from './controllers/merchant-controller.plugin.js';
import { categoryInferencePlugin } from './services/category-inference-service.plugin.js';
import { transactionParsingServicePlugin } from './services/transaction-parsing-service.plugin.js';
import { transactionPlugin } from './services/transaction-service.plugin.js';
import { llmServicePlugin } from './services/llm-service.plugin.js';
import { merchantServicePlugin } from './services/merchant-service.plugin.js';
import { reportServicePlugin } from './services/report-service.plugin.js';
import { avatarServicePlugin } from './services/avatar-service.plugin.js';

import { googleOAuthPlugin } from './config/google-oauth.plugin.js';
// Authentication plugins
import jwtConfigPlugin from './config/jwt-config.plugin.js';
import { categoryControllerPlugin } from './controllers/category-controller.plugin.js';
import { reportControllerPlugin } from './controllers/report-controller.plugin.js';
import { authControllerPlugin } from './controllers/auth-controller.plugin.js';
import { profileControllerPlugin } from './controllers/profile-controller.plugin.js';
import { userControllerPlugin } from './controllers/user-controller.plugin.js';
import { categoryPlugin } from './services/category-service.plugin.js';
import { userServicePlugin } from './services/user-service.plugin.js';

/**
 * Export plugins for registration
 */
// Configuration plugins (should be registered first)
export { googleOAuthPlugin, jwtConfigPlugin, serverConfigPlugin, staticFilesPlugin };

// Service plugins (depend on configuration)
export {
	categoryInferencePlugin,
	transactionParsingServicePlugin,
	transactionPlugin,
	llmServicePlugin,
	merchantServicePlugin,
	avatarServicePlugin,
	reportServicePlugin,
	userServicePlugin,
};

// Controller plugins (depend on services)
export {
	categoryControllerPlugin,
	categoryPlugin,
	transactionControllerPlugin,
	merchantControllerPlugin,
	authControllerPlugin,
	profileControllerPlugin,
	reportControllerPlugin,
	userControllerPlugin,
};
