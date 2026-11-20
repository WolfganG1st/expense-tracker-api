import chalk from 'chalk';
import { pino } from 'pino';
import { ZodError } from 'zod';
import { getHintForIssue } from './env-hints.js';
import { type Env, envSchemaDefinition } from './env-schema.js';

const preEnvLogger = pino({
	level: 'error',
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true,
			translateTime: 'SYS:standard',
			ignore: 'pid,hostname,level,remoteAddress,remotePort',
			messageKey: 'msg',
			levelFirst: true,
		},
	},
});

export function parseEnv(vars: NodeJS.ProcessEnv = process.env): Env {
	try {
		return envSchemaDefinition.parse(vars);
	} catch (error) {
		if (error instanceof ZodError) {
			preEnvLogger.error({
				msg: 'Invalid environment variables. Initialization failed. See details below.',
				errorDetails: {
					name: 'ZodValidationError',
					issueCount: error.issues.length,
				},
			});

			console.error(chalk.red.bold('\n❌ Detailed Validation Issues:\n'));
			for (const issue of error.issues) {
				const pathString = issue.path.join('.');
				const variableName = chalk.cyan(pathString || 'Configuration');
				const problemMessage = chalk.magenta(issue.message);
				const hint = getHintForIssue(issue, pathString, variableName);

				console.error(`  ➡️  ${chalk.yellow('Variable:')} ${variableName}`);
				console.error(`     ${chalk.yellow('Problem:')} ${problemMessage}${hint}\n`);
			}
			console.error(chalk.red.bold('Please correct the issues listed above and restart the application.'));
		} else {
			preEnvLogger.error({
				msg: 'An unexpected error occurred while loading environment variables.',
				errorName: (error as Error).name,
				errorMessage: (error as Error).message,
				stack: (error as Error).stack,
			});
			console.error(chalk.red.bold('\n❌ An unexpected error occurred while loading environment variables:'), error);
		}
		throw error;
	}
}
