import { AppError, EntityAlreadyExistsError } from '@middleware/errors/errors.js';
import { isPrismaErrorCode } from '@middleware/errors/prisma-error.js';
import type { PrismaClient } from '@prisma/client';
import type { Category } from '@schemas/category.schema.js';
import type { SortOrder } from '@schemas/common.schema.js';
import type { FastifyBaseLogger } from 'fastify';

/**
 * Service for managing transaction categories
 */
export class CategoryService {
	private readonly prisma: PrismaClient;
	private readonly logger: FastifyBaseLogger;

	constructor(prisma: PrismaClient, logger: FastifyBaseLogger) {
		this.prisma = prisma;
		this.logger = logger;
	}

	/**
	 * @description Get all categories
	 * @returns Promise with an array of categories
	 */
        public async getAllCategories(userId: string, order: SortOrder = 'asc'): Promise<Category[]> {
                try {
                        const categories = await this.prisma.category.findMany({
                                where: {
                                        OR: [{ user: { id: userId } }, { isDefault: true }],
                                },
                                orderBy: { name: order },
                        });
                        return categories;
                } catch (error) {
			this.logger.error({ error, userId }, 'Error fetching categories');
			throw new AppError('Database error when fetching categories', 500, error);
		}
	}

	/**
	 * @description Add a new custom category
	 * @param name - Category name
	 * @param description - Category description
	 * @returns Promise with the added category ID
	 */
	public async addCategory(
		userId: string,
		name: string,
		description?: string | null,
		icon?: string | null,
	): Promise<string> {
		try {
			const category = await this.prisma.category.create({
				data: {
					name,
					description,
					icon,
					isDefault: false,
					createdAt: new Date().toISOString(),
					user: {
						connect: {
							id: userId,
						},
					},
				},
			});
			return category.id;
		} catch (error) {
			if (isPrismaErrorCode(error, 'PrismaClientKnownRequestError', 'P2002')) {
				throw new EntityAlreadyExistsError('Category', error);
			}
			this.logger.error({ error, userId, name, description }, 'Error adding category');
			throw new AppError('Database error when adding category', 500, error);
		}
	}

	/**
	 * @description Update a category
	 * @param id - Category ID
	 * @param name - New category name
	 * @param description - New category description
	 * @returns Promise that resolves when the update is complete
	 */
	public async updateCategory(
		userId: string,
		id: string,
		name: string,
		description?: string | null,
		icon?: string | null,
	): Promise<void> {
		try {
			await this.prisma.category.update({
				where: {
					id,
					user: {
						id: userId,
					},
				},
				data: {
					name,
					description,
					icon,
				},
			});
		} catch (error) {
			this.logger.error({ error, userId, id, name, description }, 'Error updating category');
			throw new AppError('Database error when updating category', 500, error);
		}
	}

	/**
	 * @description Delete a category
	 * @param id - Category ID
	 * @returns Promise that resolves when the deletion is complete
	 */
	public async deleteCategory(userId: string, id: string): Promise<void> {
		try {
			await this.prisma.category.delete({
				where: {
					id,
					user: {
						id: userId,
					},
				},
			});
		} catch (error) {
			this.logger.error({ error, userId, id }, 'Error deleting category');
			throw new AppError('Database error when deleting category', 500, error);
		}
	}

	/**
	 * @description Get category by ID
	 * @param id - Category ID
	 * @returns Promise with the category or null if not found
	 */
	public async getCategoryById(userId: string, id: string): Promise<Category | null> {
		try {
			const category = await this.prisma.category.findUnique({
				where: {
					id,
					user: {
						id: userId,
					},
				},
			});
			return category || null;
		} catch (error) {
			this.logger.error({ error, userId, id }, 'Error getting category by ID');
			throw new AppError('Database error when getting category by ID', 500, error);
		}
	}

	/**
	 * @description Get category by name
	 * @param name - Category name
	 * @returns Promise with the category or null if not found
	 */
	public async getCategoryByName(userId: string, name: string): Promise<Category | null> {
		try {
			const category = await this.prisma.category.findFirst({
				where: {
					OR: [
						{ name, user: { id: userId } },
						{ name, isDefault: true },
					],
				},
			});
			return category || null;
		} catch (error) {
			this.logger.error({ error, userId, name }, 'Error getting category by name');
			throw new AppError('Database error when getting category by name', 500, error);
		}
	}

	/**
	 * @description Determine category for a merchant name
	 * @param merchantName - Merchant name to categorize
	 * @returns The determined category
	 */
	// public determineCategoryForMerchant(merchantName: string): Category {
	// 	return findCategoryForMerchant(merchantName);
	// }
}
