/**
 * Application-wide configuration types
 */

/**
 * Server configuration settings
 */
export type ServerConfig = {
	port: number;
	host: string;
	nodeEnv: string;
	logLevel: string;
};
