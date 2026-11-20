import { csvRowToNotification } from './helpers/csv-row-to-notification.js';
import { fromPartial } from '@total-typescript/shoehorn';

describe('csvRowToNotification', () => {
	it('adjusts date based on installment index', () => {
		const row = ['05/01/2025', 'Name', '1234', 'Food', 'Test purchase', '2/10', '', '', '10,00'];

		const result = csvRowToNotification(row)!;

		expect(result.dateTime).toBe('05/02/2025 às 11:11');
		expect(result.installment).toBe('2-10');
	});

	it('adjusts date for later installments', () => {
		const row = ['15/12/2024', 'Name', '1234', 'Food', 'Another purchase', '5/10', '', '', '10,00'];

		const result = csvRowToNotification(row)!;

		expect(result.dateTime).toBe('15/04/2025 às 11:11');
		expect(result.installment).toBe('5-10');
	});
});
