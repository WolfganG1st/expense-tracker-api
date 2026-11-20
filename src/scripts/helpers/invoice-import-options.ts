import path from 'node:path';

export class InvoiceImportOptionsError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InvoiceImportOptionsError';
	}
}

export type InvoiceImportOptions = {
	userId: string;
	filePath: string;
	failedOutputPath: string;
};

const DEFAULT_FAILED_OUTPUT = 'data/failed/failed_rows.csv';

function readFlag(argv: string[], flag: string): string | undefined {
	for (let index = 0; index < argv.length; index++) {
		const arg = argv[index];
		if (arg === flag) {
			const value = argv[index + 1];
			if (!value || value.startsWith('-')) {
				throw new InvoiceImportOptionsError(`Missing value for ${flag}`);
			}
			return value;
		}

		const prefix = `${flag}=`;
		if (arg.startsWith(prefix)) {
			const value = arg.slice(prefix.length);
			if (!value) {
				throw new InvoiceImportOptionsError(`Missing value for ${flag}`);
			}
			return value;
		}
	}

	return undefined;
}

function nonEmpty(value: string | undefined): string | undefined {
	if (value === undefined) {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

export function invoiceImportUsage(): string {
	return [
		'Usage: pnpm process-account-statement -- --user-id <userId> --file <csvPath> [--failed-output <path>]',
		'Environment variables: INVOICE_USER_ID, INVOICE_CSV_PATH, INVOICE_FAILED_OUTPUT',
		'Flags override the matching environment variables. Relative paths are resolved from the current working directory.',
	].join('\n');
}

export function resolveInvoiceImportOptions(argv: string[], env: NodeJS.ProcessEnv, cwd: string): InvoiceImportOptions {
	const userId = nonEmpty(readFlag(argv, '--user-id')) ?? nonEmpty(env.INVOICE_USER_ID);
	const file = nonEmpty(readFlag(argv, '--file')) ?? nonEmpty(env.INVOICE_CSV_PATH);
	const failedOutput =
		nonEmpty(readFlag(argv, '--failed-output')) ?? nonEmpty(env.INVOICE_FAILED_OUTPUT) ?? DEFAULT_FAILED_OUTPUT;

	if (!userId || !file) {
		throw new InvoiceImportOptionsError(`User id and CSV path are required.\n${invoiceImportUsage()}`);
	}

	return {
		userId,
		filePath: path.resolve(cwd, file),
		failedOutputPath: path.resolve(cwd, failedOutput),
	};
}
