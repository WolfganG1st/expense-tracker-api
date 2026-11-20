import chalk from 'chalk';
import {
	type ZodInvalidEnumValueIssue,
	type ZodInvalidTypeIssue,
	type ZodIssue,
	ZodIssueCode,
	ZodParsedType,
} from 'zod';

export function getHintForIssue(issue: ZodIssue, pathString: string, variableName: string): string {
	const numericPaths = ['PORT', 'MAX_TOKENS', 'TEMPERATURE', 'DEFAULT_SUBTASKS'];

	if (numericPaths.includes(pathString) && issue.code === ZodIssueCode.invalid_type) {
		const invalidTypeIssue = issue as ZodInvalidTypeIssue;
		if (invalidTypeIssue.received === ZodParsedType.nan) {
			return chalk.gray(
				`\n     ${chalk.blueBright('Hint:')} '${variableName}' must be a number but was processed as NaN (Not a Number). This often happens if the value contains non-numeric characters (e.g., inline comments like '#...'). Please provide a clean numeric value.`,
			);
		}
		return chalk.gray(
			`\n     ${chalk.blueBright('Hint:')} '${variableName}' must be a number. Received a value that could not be coerced to a number (type found: ${invalidTypeIssue.received}, expected: ${invalidTypeIssue.expected}). Please provide a clean numeric value.`,
		);
	}

	if (issue.code === ZodIssueCode.invalid_enum_value) {
		const invalidEnumIssue = issue as ZodInvalidEnumValueIssue;
		return chalk.gray(
			`\n     ${chalk.blueBright('Hint:')} The value '${String(invalidEnumIssue.received)}' for '${variableName}' is not allowed. Expected one of: ${invalidEnumIssue.options.join(' | ')}.`,
		);
	}

	if (issue.code === ZodIssueCode.invalid_string && issue.validation === 'url') {
		return chalk.gray(
			`\n     ${chalk.blueBright('Hint:')} Ensure '${variableName}' is a complete and valid URL (e.g., "https://example.com"). The provided value was not a valid URL format.`,
		);
	}

	if (pathString === 'OPEN_ROUTER_API_KEY') {
		if (issue.code === ZodIssueCode.too_small && issue.minimum === 1) {
			return '';
		}
		if (issue.code === ZodIssueCode.invalid_type && issue.expected === 'string') {
			return chalk.gray(`\n     ${chalk.blueBright('Hint:')} '${variableName}' is required and must be a string.`);
		}
	}

	return '';
}
