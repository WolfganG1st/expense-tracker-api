import type { LoggerOptions } from 'pino';
import { env } from '../../env.js';
import { createLoggerConfig, formatTimestamp, getLogLevel } from './logger.js';
import { fromPartial } from '@total-typescript/shoehorn';
jest.mock('../../env.js', () => ({
	env: {
		debug: undefined,
		logLevel: undefined,
		nodeEnv: 'development',
	},
}));

describe('Logger Utility', () => {
	// Reset environment variables before each test
	beforeEach(() => {
		jest.resetModules();
		env.debug = false;
		env.logLevel = 'info';
		env.nodeEnv = 'development';
	});

	// Restore original environment after tests
	afterAll(() => {
		env.debug = false;
		env.logLevel = 'info';
		env.nodeEnv = 'development';
	});

	describe('getLogLevel', () => {
		it('should return "debug" when DEBUG is set to true', () => {
			env.debug = true;
			env.logLevel = 'error'; // Should be ignored when DEBUG is true

			const level = getLogLevel();

			expect(level).toBe('debug');
		});

		it('should return "debug" when DEBUG is set to true (numeric)', () => {
			env.debug = true;
			env.logLevel = 'error'; // Should be ignored when DEBUG is true

			const level = getLogLevel();

			expect(level).toBe('debug');
		});

		it('should return the configured level when provided', () => {
			const level = getLogLevel('warn');
			expect(level).toBe('warn');
		});

		it('should return logLevel env var when set', () => {
			env.logLevel = 'error';

			const level = getLogLevel();

			expect(level).toBe('error');
		});

		it('should default to "info" in production environment', () => {
			env.nodeEnv = 'production';

			const level = getLogLevel();

			expect(level).toBe('info');
		});

		it('should default to "debug" in development environment', () => {
			env.nodeEnv = 'development';
			env.logLevel = 'debug';

			const level = getLogLevel();

			expect(level).toBe('debug');
		});
	});

	describe('formatTimestamp', () => {
		it('should format a timestamp string to ISO format', () => {
			// Using a valid timestamp string in milliseconds since epoch
			const testTime = new Date().getTime().toString();
			const formatted = formatTimestamp(testTime);

			expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
		});

		it('should format a timestamp number to ISO format', () => {
			const testTime = 1617282964000;
			const formatted = formatTimestamp(testTime);

			expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
		});

		it('should handle Date objects', () => {
			const testDate = new Date('2023-01-15T12:00:00Z');
			const formatted = formatTimestamp(testDate);

			expect(formatted).toBe('2023-01-15T12:00:00.000Z');
		});

		it('returns current time for invalid input', () => {
			const now = Date.now();
			const formatted = formatTimestamp('invalid-date');
			// date should be after now and valid ISO string
			expect(Date.parse(formatted)).not.toBeNaN();
			expect(Date.parse(formatted)).toBeGreaterThanOrEqual(now);
		});
	});

	describe('createLoggerConfig', () => {
		it('should create a config with the right log level', () => {
			const config = createLoggerConfig('warn') as LoggerOptions;

			expect(config.level).toBe('warn');
		});

		it('should create a config with transport in development', () => {
			env.nodeEnv = 'development';
			const config = createLoggerConfig() as LoggerOptions;

			expect(config.transport).toBeDefined();
		});

		it('should not create a transport config in production', () => {
			env.nodeEnv = 'production';
			const config = createLoggerConfig() as LoggerOptions;

			expect(config.transport).toBeUndefined();
		});

		it('exposes timestamp and log hooks', () => {
			env.nodeEnv = 'development';
			const config = createLoggerConfig() as LoggerOptions;
			const ts = (config.timestamp as () => string)();
			expect(ts).toMatch(/"time":"\d{4}-\d{2}-\d{2}T/);
                        const spy = jest.fn();
                        fromPartial<{ hooks: { logMethod: (args: unknown[], method: (...args: unknown[]) => void) => void } }>(config).hooks.logMethod([
                                'msg',
                        ], spy);
			expect(spy).toHaveBeenCalledWith('msg');
		});

		it('serializes request objects', () => {
			env.nodeEnv = 'development';
			const config = createLoggerConfig() as LoggerOptions;
                        const serializer = fromPartial<{ serializers: { req: (v: unknown) => unknown } }>(config).serializers.req;
			expect(serializer({ method: 'GET', url: '/x' })).toEqual({ method: 'GET', url: '/x' });
			expect(serializer({})).toEqual({});
		});
	});
});
