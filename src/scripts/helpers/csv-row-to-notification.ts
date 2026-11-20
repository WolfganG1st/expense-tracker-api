import type { CsvRowFromInvoice } from '@/api/schemas/transaction.schema.js';

export function csvRowToNotification(row: string[]): CsvRowFromInvoice | null {
	const [
		date,
		_nameOnCard,
		cardEnd,
		category,
		description,
		_installments,
		_valueInDollars,
		_exchangeRate,
		amountInReais,
	] = row;

	if (!amountInReais) {
		return null;
	}

	const amountNumber = Number.parseFloat(amountInReais.replace(',', '.'));
	const entryType = amountNumber > 0 ? 'out' : 'in';

	if (!amountNumber || amountNumber <= 0) {
		return null;
	}

	let dateTime = '';
	const hardCodedHour = '11:11';
	let installment: string | undefined;
	let monthsToAdd = 0;

	if (_installments) {
		const match = _installments.match(/^(\d+)\/(\d+)$/);
		if (match) {
			const index = Number(match[1]);
			const total = match[2];
			installment = `${index}-${total}`;
			if (index > 1) {
				monthsToAdd = index - 1;
			}
		}
	}

	if (date) {
		const [dayStr, monthStr, yearStr] = date.split('/');
		const baseDate = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
		if (monthsToAdd) {
			baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
		}
		const day = String(baseDate.getDate()).padStart(2, '0');
		const month = String(baseDate.getMonth() + 1).padStart(2, '0');
		const year = baseDate.getFullYear();
		dateTime = `${day}/${month}/${year} às ${hardCodedHour}`;
	}

	const amount = amountNumber.toLocaleString('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	});

	return {
		app: 'com.c6bank.app',
		dateTime,
		cardEnd,
		category,
		description,
		installment,
		amount,
		entryType,
		transactionType: 'CREDIT',
	};
}
