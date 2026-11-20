/**
 * User and authentication schemas
 */
import { z } from 'zod/v4';
import { BaseResponseSchema, DataResponseSchema, sortOrderEnum } from './common.schema.js';

// Defines the possible roles a user can have within the system
const userRoleSchema = z
	.enum(['USER', 'ADMIN'])
	.describe('The role assigned to a user, determining their access level and permissions. Can be "user" or "admin".');
export type UserRole = z.infer<typeof userRoleSchema>;

// Core properties defining a user, used as a base for other user-related schemas
const userCore = {
	email: z
		.email('Invalid email format')
		.describe('The email address of the user. Must be a valid email format and is unique.'),
	name: z
		.string()
		.min(2, 'Name must be at least 2 characters long')
		.nullable()
		.optional()
		.describe('The full name of the user. Minimum length is 2 characters.'),
	avatarUrl: z.string('Avatar must be a valid URL').nullable().optional().describe("URL of the user's avatar image"),
	baseCurrency: z
		.string()
		.length(3)
		.default('BRL')
		.describe("The ISO 4217 currency code used as the user's base currency."),
};

// Schema for the data payload required to create a new user
export const createUserSchema = z
	.object({
		...userCore,
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters long')
			.nullable()
			.optional()
			.describe('The password for the new user account. If provided, it must be at least 8 characters long.'),
		confirmPassword: z
			.string()
			.min(8, 'Password must be at least 8 characters long')
			.nullable()
			.optional()
			.describe('Confirmation for the password, must match the password field.'),
		provider: z.enum(['LOCAL', 'GOOGLE']).default('LOCAL').describe('The authentication provider for the user.'),
		providerId: z
			.string()
			.optional()
			.nullable()
			.describe('The provider-specific ID for the user. Optional for LOCAL users.'),
	})
	.superRefine((data, ctx) => {
		if (data.password || data.confirmPassword) {
			if (!data.password || !data.confirmPassword || data.password !== data.confirmPassword) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Passwords must match',
					path: ['confirmPassword'],
				});
			}
		}
	})
	.describe('Defines the complete data structure, including password, for creating a new user.');

// Schema for the data payload required for a user to log in
export const loginUserSchema = z
	.object({
		email: z.email('Invalid email format').describe('The email address of the user attempting to log in.'),
		password: z.string().describe('The password for the user account.'),
	})
	.describe('Defines the credentials (email and password) required for a user to log in.');

// Schema representing a user object as stored in the system and typically returned in API responses (excluding sensitive data like password)
const userSchema = z
	.object({
		id: z.string().describe('The unique identifier for the user.'),
		...userCore,
		role: userRoleSchema.describe('The role assigned to the user.'),
		createdAt: z.string().describe('The ISO date-time string indicating when the user account was created.'),
		updatedAt: z.string().describe('The ISO date-time string indicating when the user account was last updated.'),
	})
	.describe('Defines the structure of a user object, including ID and timestamps, as stored and returned by the API.');

// Schema for the response payload after successfully creating a new user
export const createUserResponseSchema = z
	.object({
		id: z.string().describe('The unique identifier of the newly created user.'),
		email: z.string().describe('The email address of the newly created user.'),
		name: z.string().nullable().describe('The name of the newly created user.'),
		avatarUrl: z.string('Avatar must be a valid URL').nullable().describe("URL of the user's avatar image."),
		baseCurrency: z.string().length(3).describe("The user's default currency code."),
		role: userRoleSchema.describe('The role of the newly created user.'),
	})
	.describe('Response schema after successfully creating a user, returning key user information (excluding password).');

export const updateAvatarSchema = z
	.object({
		avatarUrl: z.string().describe("URL of the user's avatar image."),
	})
	.describe("Data required to update a user's avatar.");

// Schema for the query parameters received during Google OAuth2 callback
export const googleCallbackQuerySchema = z
	.object({
		code: z.string().describe('The authorization code provided by Google.'),
		state: z
			.string()
			.optional()
			.describe('An opaque value used to maintain state between the request and callback. Optional.'),
	})
	.describe('Defines the query parameters expected during the Google OAuth2 callback.');

export const googleLoginBodySchema = z
	.object({
		token: z.string().min(1, 'Token is required').describe('The ID token provided by Google.'),
	})
	.describe('Defines the body parameters expected during the Google OAuth2 callback.');

// Schema for the response payload after a successful user login
export const loginResponseSchema = z
	.object({
		accessToken: z
			.string()
			.describe('A JWT (JSON Web Token) that should be used for authenticating subsequent API requests.'),
		user: createUserResponseSchema.describe('Basic details of the logged-in user.'),
	})
	.describe('Response schema after successful login, providing an access token and basic user details.');

export const refreshResponseSchema = z
	.object({
		accessToken: z
			.string()
			.describe('A JWT (JSON Web Token) that should be used for authenticating subsequent API requests.'),
	})
	.describe('Response schema after successful refresh, providing an access token.');

export const updateUserSchema = z
	.object({
		name: z.string().min(2, 'Name must be at least 2 characters long').nullable().optional(),
		baseCurrency: z
			.string()
			.length(3)
			.nullable()
			.optional()
			.describe("The ISO 4217 currency code used as the user's base currency."),
	})
	.describe("Data required to update a user's profile.");

// Schema to check if an email exists
export const checkEmailSchema = z
	.object({
		email: z.email('Invalid email format'),
	})
	.describe('Schema for checking if an email already exists.');

export const checkEmailResponseSchema = z
	.object({
		exists: z.boolean().describe('Whether the email exists in the system'),
	})
	.describe('Response schema indicating if the email exists.');

const usersDataSchema = z.object({
	users: z.array(createUserResponseSchema),
});
export const usersListSchema = DataResponseSchema(usersDataSchema);

export const usersQuerySchema = z.object({
        order: sortOrderEnum.optional(),
});

export const userIdParamSchema = z.object({
	id: z.string(),
});

export const userDeleteResponseSchema = BaseResponseSchema;

// Authentication provider types
export const authProviderSchema = z.enum(['LOCAL', 'GOOGLE']).default('LOCAL');
export type AuthProvider = z.infer<typeof authProviderSchema>;

// Export types for use in routes and services
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type CreateUserResponse = z.infer<typeof createUserResponseSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type GoogleCallbackQuery = z.infer<typeof googleCallbackQuerySchema>;
export type GoogleLoginBody = z.infer<typeof googleLoginBodySchema>;
export type CheckEmailInput = z.infer<typeof checkEmailSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CheckEmailResponse = z.infer<typeof checkEmailResponseSchema>;
export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;
export type UpdateAvatarResponse = z.infer<typeof updateAvatarSchema>;
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
export type UsersListResponse = z.infer<typeof usersListSchema>;
export type UserDeleteResponse = z.infer<typeof userDeleteResponseSchema>;
export type UsersQuery = z.infer<typeof usersQuerySchema>;
