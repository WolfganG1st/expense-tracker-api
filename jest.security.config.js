/**
 * Jest configuration for security tests
 */
/** @type {import('jest').Config} */
const config = {
	testEnvironment: 'node',
	preset: 'ts-jest/presets/default-esm', // Default ESM preset for ts-jest
	globals: { 'ts-jest': { tsconfig: 'tsconfig.test.json', useESM: true } },
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				useESM: true,
				isolatedModules: false,
			},
		],
	},
	extensionsToTreatAsEsm: ['.ts'],
	moduleNameMapper: {
		'^@/env\\.js$': '<rootDir>/src/env.ts',
		'^(.{1,2}/.*).js$': '$1',
		'^@/(.*)\\.js$': '<rootDir>/src/$1',
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@api/server\\.js$': '<rootDir>/src/api/server.ts',
		'^@api/(.*)\\.js$': '<rootDir>/src/api/$1',
		'^@api/(.*)$': '<rootDir>/src/api/$1',
		'^@controllers/(.*)\\.js$': '<rootDir>/src/api/controllers/$1',
		'^@controllers/(.*)$': '<rootDir>/src/api/controllers/$1',
		'^@data/(.*)$': '<rootDir>/src/api/data/$1',
		'^@helpers/(.*)$': '<rootDir>/src/api/helpers/$1',
		'^@middleware/(.*)\\.js$': '<rootDir>/src/api/middleware/$1',
		'^@middleware/(.*)$': '<rootDir>/src/api/middleware/$1',
		'^@plugins/(.*)\\.js$': '<rootDir>/src/api/plugins/$1',
		'^@plugins/(.*)$': '<rootDir>/src/api/plugins/$1',
		'^@routes/(.*)\\.js$': '<rootDir>/src/api/routes/$1',
		'^@routes/(.*)$': '<rootDir>/src/api/routes/$1',
		'^@schemas/(.*)\\.js$': '<rootDir>/src/api/schemas/$1',
		'^@schemas/(.*)$': '<rootDir>/src/api/schemas/$1',
		'^@services/(.*)\\.js$': '<rootDir>/src/api/services/$1',
		'^@services/(.*)$': '<rootDir>/src/api/services/$1',
		'^@transformers/(.*)\\.js$': '<rootDir>/src/api/transformers/$1',
		'^@transformers/(.*)$': '<rootDir>/src/api/transformers/$1',
		'^@types/(.*)$': '<rootDir>/src/api/types/$1',
		'^@utils/(.*)\\.js$': '<rootDir>/src/api/utils/$1',
		'^@utils/(.*)$': '<rootDir>/src/api/utils/$1',
	},
	transformIgnorePatterns: [
		'node_modules/(?!(tslib)/)', // Don't ignore tslib for transformation
	],
	testMatch: ['**/__tests__/security/**/*.test.ts'],
	reporters: ['default'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	setupFilesAfterEnv: [],
	testTimeout: 30000,
	maxWorkers: 1,
	verbose: true,
};

export default config;
