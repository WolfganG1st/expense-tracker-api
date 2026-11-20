import { AppError, EntityAlreadyExistsError } from '@middleware/errors/errors.js';
import { isPrismaErrorCode } from '@middleware/errors/prisma-error.js';
import type { PrismaClient } from '@prisma/client';
import type { Merchant } from '@schemas/merchant.schema.js';
import type { SortOrder } from '@schemas/common.schema.js';
import type { FastifyBaseLogger } from 'fastify';

export class MerchantService {
	constructor(
		private readonly prisma: PrismaClient,
		private readonly logger: FastifyBaseLogger,
	) {}

        public async getAllMerchants(userId: string, order: SortOrder = 'asc'): Promise<Merchant[]> {
                try {
                        return await this.prisma.merchant.findMany({
                                where: { userId },
                                include: { category: true },
                                orderBy: { name: order },
                        });
		} catch (error) {
			this.logger.error({ error }, 'Error fetching merchants');
			throw new AppError('Database error when fetching merchants', 500, error);
		}
	}

	public async addMerchant(
		userId: string,
		name: string,
		categoryId: string,
		customName?: string | null,
	): Promise<Merchant> {
		try {
			const merchant = await this.prisma.merchant.create({
				data: {
					name,
					userId,
					categoryId,
					...(customName !== undefined ? { customName } : {}),
				},
				include: { category: true },
			});
			return merchant;
		} catch (error) {
			if (isPrismaErrorCode(error, 'PrismaClientKnownRequestError', 'P2002')) {
				throw new EntityAlreadyExistsError('Merchant', error);
			}
			this.logger.error({ error }, 'Error adding merchant');
			throw new AppError('Database error when adding merchant', 500, error);
		}
	}

	public async getMerchantById(userId: string, id: string): Promise<Merchant | null> {
		try {
			return await this.prisma.merchant.findUnique({
				where: { id, userId },
				include: { category: true },
			});
		} catch (error) {
			this.logger.error({ error }, 'Error getting merchant by id');
			throw new AppError('Database error when getting merchant by id', 500, error);
		}
	}

	public async getMerchantByName(userId: string, name: string): Promise<Merchant | null> {
		try {
			return await this.prisma.merchant.findFirst({
				where: { name, userId },
				include: { category: true },
			});
		} catch (error) {
			this.logger.error({ error }, 'Error getting merchant by name');
			throw new AppError('Database error when getting merchant by name', 500, error);
		}
	}
}
