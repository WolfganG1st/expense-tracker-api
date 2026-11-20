import type { PrismaClient, User } from '@prisma/client';
import type { CreateUserInput } from '../schemas/user.schema.js';
import bcrypt from 'bcryptjs';
import {
	AppError,
	EntityAlreadyExistsError,
	InvalidCredentialsError,
	UserNotFoundError,
} from '../middleware/errors/errors.js';
import { UserService } from './user.service.js';
import { fromPartial } from '@total-typescript/shoehorn';

describe('UserService', () => {
        let prisma: {
                user: {
                        create: jest.Mock;
                        findUnique: jest.Mock;
                        update: jest.Mock;
                        findMany: jest.Mock;
                        delete: jest.Mock;
                };
        };
        let service: UserService;

	const sampleUser: User = {
		id: 'u1',
		providerId: 'p1',
		provider: 'LOCAL',
		email: 'test@example.com',
		password: 'hashed',
		name: 'Tester',
		avatarUrl: null,
		baseCurrency: 'BRL',
		role: 'USER',
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-01T00:00:00Z'),
	} as User;

        beforeEach(() => {
                prisma = {
                        user: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn(), delete: jest.fn() },
                };
                service = new UserService(fromPartial<PrismaClient>(prisma));
        });

	describe('createUser', () => {
                it('creates a user with hashed password', async () => {
                        const hashSpy = fromPartial<jest.Mock>(jest.spyOn(bcrypt, 'hash'));
			hashSpy.mockResolvedValue('hashedPwd');
			prisma.user.create.mockResolvedValue({ ...sampleUser, password: 'hashedPwd' });

                        const input: CreateUserInput = {
                                email: sampleUser.email,
                                password: 'secret',
                                name: 'Tester',
                                confirmPassword: 'secret',
                                provider: 'LOCAL',
                                baseCurrency: 'BRL',
                        };
                        const result = await service.createUser(input);

			expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
			expect(prisma.user.create).toHaveBeenCalledWith({
				data: {
					email: input.email,
					name: input.name,
					provider: 'LOCAL',
					providerId: undefined,
					password: 'hashedPwd',
					baseCurrency: 'BRL',
					avatarUrl: undefined,
				},
			});
			expect(result).toEqual({ ...sampleUser, password: 'hashedPwd' });
		});

                it('throws EntityAlreadyExistsError on duplicate', async () => {
                        const hashSpy = fromPartial<jest.Mock>(jest.spyOn(bcrypt, 'hash'));
			hashSpy.mockResolvedValue('hashedPwd');
			const err = { name: 'PrismaClientKnownRequestError', code: 'P2002' };
			prisma.user.create.mockRejectedValue(err);

                        await expect(
                                service.createUser(
                                        fromPartial<CreateUserInput>({
                                                email: 'a',
                                                password: 'b',
                                                name: 'c',
                                                confirmPassword: 'b',
                                                provider: 'LOCAL',
                                                baseCurrency: 'BRL',
                                        }),
                                ),
                        ).rejects.toBeInstanceOf(EntityAlreadyExistsError);
		});

                it('wraps other errors in AppError', async () => {
                        const hashSpy = fromPartial<jest.Mock>(jest.spyOn(bcrypt, 'hash'));
			hashSpy.mockResolvedValue('hashedPwd');
			prisma.user.create.mockRejectedValue(new Error('fail'));

                        await expect(
                                service.createUser(
                                        fromPartial<CreateUserInput>({
                                                email: 'a',
                                                password: 'b',
                                                name: 'c',
                                                confirmPassword: 'b',
                                                provider: 'LOCAL',
                                                baseCurrency: 'BRL',
                                        }),
                                ),
                        ).rejects.toBeInstanceOf(AppError);
		});
	});

	describe('findUserById', () => {
		it('returns user when found', async () => {
			prisma.user.findUnique.mockResolvedValue(sampleUser);
			const result = await service.findUserById('u1');
			expect(result).toBe(sampleUser);
		});

		it('throws UserNotFoundError when not found', async () => {
			prisma.user.findUnique.mockResolvedValue(null);
			await expect(service.findUserById('u1')).rejects.toBeInstanceOf(UserNotFoundError);
		});
	});

	describe('findUserByEmail', () => {
		it('returns user when found', async () => {
			prisma.user.findUnique.mockResolvedValue(sampleUser);
			const result = await service.findUserByEmail('test@example.com');
			expect(result).toBe(sampleUser);
		});

		it('throws UserNotFoundError when not found', async () => {
			prisma.user.findUnique.mockResolvedValue(null);
			await expect(service.findUserByEmail('x@example.com')).rejects.toBeInstanceOf(UserNotFoundError);
		});
	});

	describe('login', () => {
		it('returns user on valid credentials', async () => {
			jest.spyOn(service, 'findUserByEmail').mockResolvedValue(sampleUser);
                        const compareSpy = fromPartial<jest.Mock>(jest.spyOn(bcrypt, 'compare'));
			compareSpy.mockResolvedValue(true);

			const result = await service.login({ email: sampleUser.email, password: 'secret' });
			expect(service.findUserByEmail).toHaveBeenCalledWith(sampleUser.email);
			expect(bcrypt.compare).toHaveBeenCalledWith('secret', sampleUser.password);
			expect(result).toBe(sampleUser);
		});

		it('throws InvalidCredentialsError on password mismatch', async () => {
			jest.spyOn(service, 'findUserByEmail').mockResolvedValue(sampleUser);
                        const compareSpy = fromPartial<jest.Mock>(jest.spyOn(bcrypt, 'compare'));
			compareSpy.mockResolvedValue(false);

			await expect(service.login({ email: sampleUser.email, password: 'bad' })).rejects.toBeInstanceOf(
				InvalidCredentialsError,
			);
		});

		it('propagates error from findUserByEmail', async () => {
			jest.spyOn(service, 'findUserByEmail').mockRejectedValue(new UserNotFoundError());

			await expect(service.login({ email: 'missing', password: 'x' })).rejects.toBeInstanceOf(UserNotFoundError);
		});
	});

	describe('findOrCreateGoogleUser', () => {
		it('updates avatar for existing user', async () => {
			prisma.user.findUnique.mockResolvedValueOnce(sampleUser);
			prisma.user.update.mockResolvedValue({ ...sampleUser, avatarUrl: 'http://avatar.com/pic' });

			const result = await service.findOrCreateGoogleUser(
				sampleUser.providerId ?? '',
				sampleUser.email,
				sampleUser.name ?? '',
				'http://avatar.com/pic',
			);

			expect(prisma.user.update).toHaveBeenCalledWith({
				where: { id: sampleUser.id },
				data: { avatarUrl: 'http://avatar.com/pic' },
			});
			expect(result).toEqual({ ...sampleUser, avatarUrl: 'http://avatar.com/pic' });
		});

		it('creates user when not found', async () => {
			prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
			jest.spyOn(service, 'createUser').mockResolvedValue(sampleUser);

			const result = await service.findOrCreateGoogleUser(
				sampleUser.providerId ?? '',
				sampleUser.email,
				sampleUser.name ?? '',
				'http://avatar.com/pic',
			);

			expect(service.createUser).toHaveBeenCalledWith({
				email: sampleUser.email,
				name: sampleUser.name,
				providerId: sampleUser.providerId ?? '',
				provider: 'GOOGLE',
				baseCurrency: 'BRL',
				avatarUrl: 'http://avatar.com/pic',
			});
			expect(result).toBe(sampleUser);
		});
	});

	describe('updateAvatar', () => {
		it('updates avatar via prisma', async () => {
			prisma.user.update.mockResolvedValue({ ...sampleUser, avatarUrl: 'http://avatar.com/pic' });
			const result = await service.updateAvatar('u1', 'http://avatar.com/pic');
			expect(prisma.user.update).toHaveBeenCalledWith({
				where: { id: 'u1' },
				data: { avatarUrl: 'http://avatar.com/pic' },
			});
			expect(result).toEqual({ ...sampleUser, avatarUrl: 'http://avatar.com/pic' });
		});

		it('throws AppError on prisma failure', async () => {
			prisma.user.update.mockRejectedValue(new Error('fail'));
			await expect(service.updateAvatar('u1', 'a')).rejects.toThrow('Database error when updating avatar');
		});
	});

	describe('updateUser', () => {
		it('updates user via prisma', async () => {
			prisma.user.update.mockResolvedValue({ ...sampleUser, name: 'New', baseCurrency: 'USD' });
			const result = await service.updateUser('u1', { name: 'New', baseCurrency: 'USD' });
			expect(prisma.user.update).toHaveBeenCalledWith({
				where: { id: 'u1' },
				data: { name: 'New', baseCurrency: 'USD' },
			});
			expect(result).toEqual({ ...sampleUser, name: 'New', baseCurrency: 'USD' });
		});

		it('throws AppError on prisma failure', async () => {
			prisma.user.update.mockRejectedValue(new Error('fail'));
			await expect(service.updateUser('u1', { name: 'x', baseCurrency: 'BRL' })).rejects.toThrow(
				'Database error when updating user',
			);
		});
	});
	describe('hasRole', () => {
		it('returns true when user has required role', async () => {
			jest.spyOn(service, 'findUserById').mockResolvedValue({ ...sampleUser, role: 'ADMIN' });
			const result = await service.hasRole('u1', 'ADMIN');
			expect(result).toBe(true);
		});

		it('returns false when user lacks admin role', async () => {
			jest.spyOn(service, 'findUserById').mockResolvedValue({ ...sampleUser, role: 'USER' });
			const result = await service.hasRole('u1', 'ADMIN');
			expect(result).toBe(false);
		});

		it('throws UserNotFoundError when user not found', async () => {
			jest.spyOn(service, 'findUserById').mockRejectedValue(new UserNotFoundError());
			await expect(service.hasRole('u1', 'USER')).rejects.toBeInstanceOf(UserNotFoundError);
		});
	});

	describe('getAllUsers', () => {
		it('returns users from prisma', async () => {
                        prisma.user.findMany.mockResolvedValue([sampleUser]);
                        const result = await service.getAllUsers();
                        expect(prisma.user.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'asc' } });
                        expect(result).toEqual([sampleUser]);
		});

		it('throws AppError on failure', async () => {
			prisma.user.findMany.mockRejectedValue(new Error('fail'));
			await expect(service.getAllUsers()).rejects.toThrow('Database error when fetching users');
		});
	});

	describe('deleteUser', () => {
		it('deletes user via prisma', async () => {
			prisma.user.delete.mockResolvedValue(undefined);
			await service.deleteUser('u1');
			expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
		});

		it('throws AppError on failure', async () => {
			prisma.user.delete.mockRejectedValue(new Error('fail'));
			await expect(service.deleteUser('u1')).rejects.toThrow('Database error when deleting user');
		});
	});
});
