import type { PrismaClient } from '@prisma/client';
import type { FastifyBaseLogger } from 'fastify';
import { EntityAlreadyExistsError } from '../middleware/errors/errors.js';
import type { Category } from '../schemas/category.schema.js';
import { CategoryService } from './category.service.js';
import { fromPartial } from '@total-typescript/shoehorn';

describe('CategoryService', () => {
        let prisma: {
                category: {
                        findMany: jest.Mock;
                        create: jest.Mock;
                        update: jest.Mock;
                        delete: jest.Mock;
                        findUnique: jest.Mock;
                        findFirst: jest.Mock;
                };
        };
        let logger: jest.Mocked<FastifyBaseLogger>;
        let service: CategoryService;

	const sampleCategory: Category = {
		id: 'cat1',
		name: 'Food',
		description: null,
		icon: 'food-icon',
		isDefault: true,
		createdAt: new Date('2024-12-31T00:00:00Z'),
	};

        beforeEach(() => {
                prisma = {
                        category: {
                                findMany: jest.fn(),
                                create: jest.fn(),
                                update: jest.fn(),
                                delete: jest.fn(),
                                findUnique: jest.fn(),
                                findFirst: jest.fn(),
                        },
                };
                logger = fromPartial<jest.Mocked<FastifyBaseLogger>>({ error: jest.fn() });
                service = new CategoryService(fromPartial<PrismaClient>(prisma), logger);
        });

	describe('getAllCategories', () => {
		it('returns categories from prisma', async () => {
			prisma.category.findMany.mockResolvedValue([sampleCategory]);
			const result = await service.getAllCategories('user1');
                        expect(prisma.category.findMany).toHaveBeenCalledWith({
                                where: { OR: [{ user: { id: 'user1' } }, { isDefault: true }] },
                                orderBy: { name: 'asc' },
                        });
			expect(result).toEqual([sampleCategory]);
		});

		it('logs and throws on error', async () => {
			prisma.category.findMany.mockRejectedValue(new Error('fail'));
			await expect(service.getAllCategories('user1')).rejects.toThrow('Database error when fetching categories');
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('addCategory', () => {
		it('creates category and returns id', async () => {
			prisma.category.create.mockResolvedValue({ id: 'new' });
			const id = await service.addCategory('user1', 'NewCat', 'desc', 'icon');
			expect(prisma.category.create).toHaveBeenCalledWith({
				data: {
					name: 'NewCat',
					description: 'desc',
					icon: 'icon',
					isDefault: false,
					createdAt: expect.any(String),
					user: { connect: { id: 'user1' } },
				},
			});
			expect(id).toBe('new');
		});

		it('maps duplicate error to EntityAlreadyExistsError', async () => {
			prisma.category.create.mockRejectedValue({ name: 'PrismaClientKnownRequestError', code: 'P2002' });
			await expect(service.addCategory('u', 'c')).rejects.toThrow(EntityAlreadyExistsError);
		});

		it('logs and wraps unknown errors', async () => {
			prisma.category.create.mockRejectedValue(new Error('boom'));
			await expect(service.addCategory('u', 'c')).rejects.toThrow('Database error when adding category');
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('updateCategory', () => {
		it('updates category via prisma', async () => {
			prisma.category.update.mockResolvedValue(undefined);
			await service.updateCategory('user1', 'cat1', 'Name', 'desc', 'icon');
			expect(prisma.category.update).toHaveBeenCalledWith({
				where: { id: 'cat1', user: { id: 'user1' } },
				data: { name: 'Name', description: 'desc', icon: 'icon' },
			});
		});

		it('logs and throws on update error', async () => {
			prisma.category.update.mockRejectedValue(new Error('fail'));
			await expect(service.updateCategory('user1', 'cat1', 'Name')).rejects.toThrow(
				'Database error when updating category',
			);
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('deleteCategory', () => {
		it('deletes category via prisma', async () => {
			prisma.category.delete.mockResolvedValue(undefined);
			await service.deleteCategory('user1', 'cat1');
			expect(prisma.category.delete).toHaveBeenCalledWith({
				where: { id: 'cat1', user: { id: 'user1' } },
			});
		});

		it('logs and throws on delete error', async () => {
			prisma.category.delete.mockRejectedValue(new Error('fail'));
			await expect(service.deleteCategory('user1', 'cat1')).rejects.toThrow('Database error when deleting category');
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('getCategoryById', () => {
		it('returns category when found', async () => {
			prisma.category.findUnique.mockResolvedValue(sampleCategory);
			const result = await service.getCategoryById('user1', 'cat1');
			expect(result).toEqual(sampleCategory);
		});

		it('returns null when not found', async () => {
			prisma.category.findUnique.mockResolvedValue(null);
			const result = await service.getCategoryById('user1', 'cat1');
			expect(result).toBeNull();
		});

		it('logs and throws on error', async () => {
			prisma.category.findUnique.mockRejectedValue(new Error('fail'));
			await expect(service.getCategoryById('user1', 'cat1')).rejects.toThrow(
				'Database error when getting category by ID',
			);
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('getCategoryByName', () => {
		it('returns category when found', async () => {
			prisma.category.findFirst.mockResolvedValue(sampleCategory);
			const result = await service.getCategoryByName('user1', 'Food');
			expect(prisma.category.findFirst).toHaveBeenCalledWith({
				where: {
					OR: [
						{ name: 'Food', user: { id: 'user1' } },
						{ name: 'Food', isDefault: true },
					],
				},
			});
			expect(result).toEqual(sampleCategory);
		});

		it('logs and throws on error', async () => {
			prisma.category.findFirst.mockRejectedValue(new Error('fail'));
			await expect(service.getCategoryByName('u1', 'Food')).rejects.toThrow(
				'Database error when getting category by name',
			);
			expect(logger.error).toHaveBeenCalled();
		});
	});
});
