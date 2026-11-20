import {
	AppError,
	EntityAlreadyExistsError,
	InvalidCredentialsError,
	UserNotFoundError,
} from '@middleware/errors/errors.js';
import { isPrismaErrorCode } from '@middleware/errors/prisma-error.js';
import type { PrismaClient, User } from '@prisma/client';
import prisma from '@prisma/client';
import type { CreateUserInput, LoginUserInput, UserRole } from '@schemas/user.schema.js';
import type { SortOrder } from '@schemas/common.schema.js';
import bcrypt from 'bcryptjs';
const { $Enums } = prisma;

/**
 * User service for handling authentication and user operations
 */
export class UserService {
	private readonly prisma: PrismaClient;

	/**
	 * @description Create a new UserService
	 * @param prisma - Prisma client instance
	 */
	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	/**
	 * @description Create a new user
	 * @param input - User creation data
	 * @returns Created user data
	 */
	async createUser(input: CreateUserInput): Promise<User> {
		const { password, confirmPassword: _c, email, name, provider, providerId, baseCurrency, avatarUrl } = input;

		try {
			const hashedPassword = await bcrypt.hash(password ?? '', 10);

			const user = await this.prisma.user.create({
				data: {
					email,
					name,
					provider: provider ?? $Enums.AuthProvider.LOCAL,
					providerId,
					password: hashedPassword,
					baseCurrency: baseCurrency ?? 'BRL',
					avatarUrl,
				},
			});

			return user;
		} catch (error) {
			if (isPrismaErrorCode(error, 'PrismaClientKnownRequestError', 'P2002')) {
				throw new EntityAlreadyExistsError('User', error);
			}

			throw new AppError('Database error when creating user', 500, error);
		}
	}

	/**
	 * @description Find a user by their ID
	 * @param id - User ID
	 * @returns User data or null if not found
	 */
	async findUserById(id: string): Promise<User> {
		const user = await this.prisma.user.findUnique({
			where: {
				id,
			},
		});

		if (!user) {
			throw new UserNotFoundError();
		}

		return user;
	}

	/**
	 * @description Find a user by their email
	 * @param email - User email
	 * @returns User data or null if not found
	 */
	async findUserByEmail(email: string): Promise<User> {
		const user = await this.prisma.user.findUnique({
			where: {
				email,
			},
		});

		if (!user) {
			throw new UserNotFoundError();
		}

		return user;
	}

	/**
	 * @description Authenticate a user by email and password
	 * @param input - Login credentials
	 * @returns User data if authentication succeeds
	 */
	async login(input: LoginUserInput): Promise<User> {
		const { email, password } = input;

		const user = await this.findUserByEmail(email);

		if (!user.password) {
			throw new InvalidCredentialsError();
		}
		const passwordMatch = await bcrypt.compare(password, user.password);

		if (!passwordMatch) {
			throw new InvalidCredentialsError();
		}

		return user;
	}

	/**
	 * Check if an email exists in the database
	 * @param email - email to check
	 * @returns true if exists
	 */
	async emailExists(email: string): Promise<boolean> {
		const user = await this.prisma.user.findUnique({
			where: { email },
			select: { id: true },
		});
		return user !== null;
	}

	async findOrCreateGoogleUser(googleId: string, email: string, name: string, avatarUrl?: string): Promise<User> {
		const userByGoogleId = await this.prisma.user.findUnique({ where: { providerId: googleId } });
		if (userByGoogleId) {
			if (avatarUrl && userByGoogleId.avatarUrl !== avatarUrl) {
				return await this.prisma.user.update({
					where: { id: userByGoogleId.id },
					data: { avatarUrl },
				});
			}

			return userByGoogleId;
		}

		const userByEmail = await this.prisma.user.findUnique({ where: { email } });
		if (userByEmail) {
			return await this.prisma.user.update({
				where: { id: userByEmail.id },
				data: { providerId: googleId, avatarUrl: avatarUrl ?? userByEmail.avatarUrl },
			});
		}

		return await this.createUser({
			email,
			name,
			providerId: googleId,
			provider: $Enums.AuthProvider.GOOGLE,
			baseCurrency: 'BRL',
			avatarUrl,
		});
	}

	async updateAvatar(userId: string, avatarUrl: string): Promise<User> {
		try {
			return await this.prisma.user.update({
				where: { id: userId },
				data: { avatarUrl },
			});
		} catch (error) {
			throw new AppError('Database error when updating avatar', 500, error);
		}
	}

	async updateUser(userId: string, data: { name?: string | null; baseCurrency?: string }): Promise<User> {
		try {
			return await this.prisma.user.update({
				where: { id: userId },
				data,
			});
		} catch (error) {
			throw new AppError('Database error when updating user', 500, error);
		}
	}

        async getAllUsers(order: SortOrder = 'asc'): Promise<User[]> {
                try {
                        return await this.prisma.user.findMany({ orderBy: { createdAt: order } });
                } catch (error) {
                        throw new AppError('Database error when fetching users', 500, error);
                }
        }

	async deleteUser(id: string): Promise<void> {
		try {
			await this.prisma.user.delete({ where: { id } });
		} catch (error) {
			throw new AppError('Database error when deleting user', 500, error);
		}
	}
	/**
	 * @description Check if user has the required role
	 * @param userId - User ID
	 * @param requiredRole - Required role
	 * @returns Boolean indicating if user has the required role
	 */
	async hasRole(userId: string, requiredRole: UserRole): Promise<boolean> {
		const user = await this.findUserById(userId);

		if (!user) {
			return false;
		}

		if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
			return false;
		}

		return true;
	}
}
