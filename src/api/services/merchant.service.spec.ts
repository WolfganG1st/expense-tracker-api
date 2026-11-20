import type { PrismaClient } from '@prisma/client';
import type { FastifyBaseLogger } from 'fastify';
import { EntityAlreadyExistsError } from '../middleware/errors/errors.js';
import type { Merchant } from '../schemas/merchant.schema.js';
import { MerchantService } from './merchant.service.js';
import { fromPartial } from '@total-typescript/shoehorn';

describe('MerchantService', () => {
        let prisma: {
                merchant: {
                        findMany: jest.Mock;
                        create: jest.Mock;
                        findUnique: jest.Mock;
                        findFirst: jest.Mock;
                };
        };
        let logger: jest.Mocked<FastifyBaseLogger>;
        let service: MerchantService;

	const sampleMerchant: Merchant = {
		id: 'p1',
		name: 'Store',
		customName: 'My Store',
		category: {
			id: 'c1',
			name: 'Food',
			description: null,
			icon: 'food-icon',
			isDefault: true,
			createdAt: new Date('2024-12-31T00:00:00Z'),
		},
	};

        beforeEach(() => {
                prisma = {
                        merchant: {
                                findMany: jest.fn(),
                                create: jest.fn(),
                                findUnique: jest.fn(),
                                findFirst: jest.fn(),
                        },
                };
                logger = fromPartial<jest.Mocked<FastifyBaseLogger>>({ error: jest.fn() });
                service = new MerchantService(fromPartial<PrismaClient>(prisma), logger);
	});

	describe('getAllMerchants', () => {
		it('returns merchants from prisma', async () => {
			prisma.merchant.findMany.mockResolvedValue([sampleMerchant]);
                        const result = await service.getAllMerchants('user1');
                        expect(prisma.merchant.findMany).toHaveBeenCalledWith({
                                where: { userId: 'user1' },
                                include: { category: true },
                                orderBy: { name: 'asc' },
                        });
			expect(result).toEqual([sampleMerchant]);
		});

		it('logs and throws on error', async () => {
			prisma.merchant.findMany.mockRejectedValue(new Error('fail'));
			await expect(service.getAllMerchants('user1')).rejects.toThrow('Database error when fetching merchants');
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('addMerchant', () => {
		it('creates merchant and returns id', async () => {
			prisma.merchant.create.mockResolvedValue({ id: 'new' });
			const merchant = await service.addMerchant('user1', 'Shop', 'cat1', 'Alias');
			expect(prisma.merchant.create).toHaveBeenCalledWith({
				data: { name: 'Shop', userId: 'user1', categoryId: 'cat1', customName: 'Alias' },
				include: { category: true },
			});
			expect(merchant.id).toBe('new');
		});

		it('maps duplicate error to EntityAlreadyExistsError', async () => {
			prisma.merchant.create.mockRejectedValue({ name: 'PrismaClientKnownRequestError', code: 'P2002' });
			await expect(service.addMerchant('u', 'n', 'c')).rejects.toBeInstanceOf(EntityAlreadyExistsError);
		});

		it('logs and wraps unknown errors', async () => {
			prisma.merchant.create.mockRejectedValue(new Error('boom'));
			await expect(service.addMerchant('u', 'n', 'c')).rejects.toThrow('Database error when adding merchant');
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('getMerchantById', () => {
		it('returns merchant when found', async () => {
			prisma.merchant.findUnique.mockResolvedValue(sampleMerchant);
			const result = await service.getMerchantById('user1', 'p1');
			expect(prisma.merchant.findUnique).toHaveBeenCalledWith({
				where: { id: 'p1', userId: 'user1' },
				include: { category: true },
			});
			expect(result).toEqual(sampleMerchant);
		});

		it('returns null when not found', async () => {
			prisma.merchant.findUnique.mockResolvedValue(null);
			const result = await service.getMerchantById('user1', 'p1');
			expect(result).toBeNull();
		});

		it('logs and throws on error', async () => {
			prisma.merchant.findUnique.mockRejectedValue(new Error('fail'));
			await expect(service.getMerchantById('user1', 'p1')).rejects.toThrow(
				'Database error when getting merchant by id',
			);
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('getMerchantByName', () => {
		it('returns merchant when found', async () => {
			prisma.merchant.findFirst.mockResolvedValue(sampleMerchant);
			const result = await service.getMerchantByName('user1', 'Store');
			expect(prisma.merchant.findFirst).toHaveBeenCalledWith({
				where: { name: 'Store', userId: 'user1' },
				include: { category: true },
			});
			expect(result).toEqual(sampleMerchant);
		});

		it('logs and throws on error', async () => {
			prisma.merchant.findFirst.mockRejectedValue(new Error('fail'));
			await expect(service.getMerchantByName('u', 'Store')).rejects.toThrow(
				'Database error when getting merchant by name',
			);
			expect(logger.error).toHaveBeenCalled();
		});
	});
});
