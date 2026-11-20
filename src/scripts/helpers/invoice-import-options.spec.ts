import path from 'node:path';
import { InvoiceImportOptionsError, resolveInvoiceImportOptions } from './invoice-import-options.js';

const cwd = '/app';

describe('resolveInvoiceImportOptions', () => {
	it('reads the user id and csv path from flags', () => {
		const options = resolveInvoiceImportOptions(['--user-id', 'user-1', '--file', 'invoices/june.csv'], {}, cwd);

		expect(options.userId).toBe('user-1');
		expect(options.filePath).toBe(path.resolve(cwd, 'invoices/june.csv'));
		expect(options.failedOutputPath).toBe(path.resolve(cwd, 'data/failed/failed_rows.csv'));
	});

	it('accepts equals-form flags and an explicit failed-output path', () => {
		const options = resolveInvoiceImportOptions(
			['--user-id=user-2', '--file=/tmp/invoice.csv', '--failed-output=out/failed.csv'],
			{},
			cwd,
		);

		expect(options).toEqual({
			userId: 'user-2',
			filePath: '/tmp/invoice.csv',
			failedOutputPath: path.resolve(cwd, 'out/failed.csv'),
		});
	});

	it('uses environment variables when flags are omitted', () => {
		const options = resolveInvoiceImportOptions(
			[],
			{
				INVOICE_USER_ID: 'user-env',
				INVOICE_CSV_PATH: 'data/invoice.csv',
				INVOICE_FAILED_OUTPUT: 'data/failed/custom.csv',
			},
			cwd,
		);

		expect(options.userId).toBe('user-env');
		expect(options.filePath).toBe(path.resolve(cwd, 'data/invoice.csv'));
		expect(options.failedOutputPath).toBe(path.resolve(cwd, 'data/failed/custom.csv'));
	});

	it('lets flags override environment variables', () => {
		const options = resolveInvoiceImportOptions(
			['--user-id', 'from-flag', '--file', 'from-flag.csv'],
			{
				INVOICE_USER_ID: 'from-env',
				INVOICE_CSV_PATH: 'from-env.csv',
			},
			cwd,
		);

		expect(options.userId).toBe('from-flag');
		expect(options.filePath).toBe(path.resolve(cwd, 'from-flag.csv'));
	});

	it('requires a user id and a csv path', () => {
		expect(() => resolveInvoiceImportOptions(['--file', 'invoice.csv'], {}, cwd)).toThrow(InvoiceImportOptionsError);
		expect(() => resolveInvoiceImportOptions(['--user-id', 'user-1'], {}, cwd)).toThrow(InvoiceImportOptionsError);
	});

	it('rejects a flag that has no value', () => {
		expect(() => resolveInvoiceImportOptions(['--user-id', '--file', 'invoice.csv'], {}, cwd)).toThrow(
			'Missing value for --user-id',
		);
	});
});
