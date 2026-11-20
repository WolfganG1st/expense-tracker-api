import { env } from '@/env.js';
import type { FastifyLoggerOptions } from 'fastify';
import type { LoggerOptions } from 'pino';

/**
 * Fields to exclude from log output
 */
const DEFAULT_EXCLUDE_FIELDS = ['pid', 'hostname', 'level', 'remoteAddress', 'remotePort'];

/**
 * Format a timestamp in ISO 8601 format
 * @param timestamp Unix timestamp (number) or string representation
 * @returns ISO 8601 formatted date string
 */
export function formatTimestamp(timestamp: number | string | Date): string {
	try {
		const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

		// Check if date is valid
		if (Number.isNaN(date.getTime())) {
			// Return current date if invalid
			return new Date().toISOString();
		}

		return date.toISOString();
	} catch (err) {
		// Return current date on error
		return new Date().toISOString();
	}
}

/**
 * Get the serializers to customize log output
 */
function getSerializers(): Record<string, (value: unknown) => Record<string, unknown>> {
	return {
		req: (req: unknown) => {
			// Return only necessary request information
			if (req && typeof req === 'object' && 'method' in req && 'url' in req) {
				return {
					method: req.method,
					url: req.url,
				};
			}
			return {};
		},
	};
}

/**
 * Custom log formatter to handle field filtering and timestamp formatting
 */
type LogObject = Record<string, unknown>;

/**
 * Create a clean log object by removing excluded fields
 * @param obj The original log object
 * @returns Cleaned log object without excluded fields
 */
function cleanLogObject(obj: LogObject): LogObject {
	// Create a cleaned object without excluded fields
	const cleanedObj = { ...obj };

	// Remove excluded fields
	for (const field of DEFAULT_EXCLUDE_FIELDS) {
		delete cleanedObj[field];
	}

	// If there's a req object, ensure we exclude remoteAddress and remotePort
	if (cleanedObj.req && typeof cleanedObj.req === 'object') {
		const reqObj = cleanedObj.req as Record<string, unknown>;
		const { remoteAddress, remotePort, ...rest } = reqObj as {
			remoteAddress?: string;
			remotePort?: number;
			[key: string]: unknown;
		};
		cleanedObj.req = rest;
	}

	// Convert Unix timestamp to ISO string if present
	if (cleanedObj.time && (typeof cleanedObj.time === 'number' || typeof cleanedObj.time === 'string')) {
		cleanedObj.time = formatTimestamp(cleanedObj.time as number | string);
	}

	return cleanedObj;
}

/**
 * Get the current log level based on environment variables and settings
 * @param configuredLevel Optional log level explicitly set in configuration
 * @returns The appropriate log level to use
 */
export function getLogLevel(configuredLevel?: string): string {
	// Get values of environment variables for logging
	const debugEnvValue = env.debug;
	const logLevelEnvValue = env.logLevel;
	// Check for DEBUG environment variable
	const debugMode = !!debugEnvValue;

	// If debug mode is enabled, use debug level regardless of other settings
	if (debugMode) {
		return 'debug';
	}

	// If a specific log level is configured, use it
	if (configuredLevel) {
		return configuredLevel;
	}

	// Get LOG_LEVEL from environment, or use default based on NODE_ENV
	return logLevelEnvValue || (env.nodeEnv === 'production' ? 'info' : 'debug');
}

/**
 * Log details about logging configuration
 * This function is useful for debugging the logger configuration
 * @param level Current log level
 */
function logConfigInfo(level: string): void {
	// Only log using console here since this happens during logger initialization
	console.info('===== Logger Configuration =====');
	console.info(`Log Level: ${level}`);
	console.info(`DEBUG env: ${env.debug || 'not set'}`);
	console.info(`LOG_LEVEL env: ${env.logLevel || 'not set'}`);
	console.info(`NODE_ENV: ${env.nodeEnv || 'development'}`);
	console.info('================================');
}

/**
 * Create logger configuration options based on environment
 * @param logLevel Optional log level to use, defaults based on environment
 * @returns Fastify logger configuration
 */
export function createLoggerConfig(logLevel?: string): FastifyLoggerOptions {
	// Get the appropriate log level using our log level resolver
	const level = getLogLevel(logLevel);

	// Log configuration details for debugging purposes
	if (env.nodeEnv !== 'production') {
		logConfigInfo(level);
	}

	// Create a standard Pino configuration
	const pinoConfig: LoggerOptions = {
		level,
		serializers: getSerializers(),
		// Format timestamp and redact sensitive information
		timestamp: () => `,"time":"${formatTimestamp(new Date())}"`,
		// Define custom mixin to modify log output
		mixin: () => ({}), // Empty mixin to avoid adding pid/hostname
		// Configure Pino transport for pretty printing
		transport:
			env.nodeEnv !== 'production'
				? {
						target: 'pino-pretty',
						options: {
							// Format timestamps in local timezone with ISO-8601 format
							translateTime: 'SYS:standard',
							// Ignore fields we've chosen to exclude
							ignore: DEFAULT_EXCLUDE_FIELDS.join(','),
							// Message formatting for better output
							messageFormat: true,
							// Add helpful colorization for better readability
							colorize: true,
							// Use a standardized 2-space indentation for nested objects
							singleLine: false,
							// Ensure proper indentation for nested JSON
							levelFirst: false,
							// Include request ID if available (useful for tracing requests)
							messageKey: 'msg',
							// Better visual separation of log entries
							minimumLevel: 'debug',
						},
					}
				: undefined,
		// This hooks into Pino's standard serialization process
		hooks: {
			logMethod(inputArgs, method) {
				// This runs for each log method call (info, error, etc.)
				return method.apply(this, inputArgs);
			},
		},
	};

	return pinoConfig;
}
