import type {
        CategoriesListResponse,
        CategoryCreateResponse,
        CategoryDeleteResponse,
        CategoryResponse,
        CategoryUpdateResponse,
} from '@schemas/category.schema.js';
import type { SortOrder } from '@schemas/common.schema.js';
import type { CategoryService } from '@services/category.service.js';

/**
 * @description Controller handling category operations
 */
export class CategoryController {
	/**
	 * @description Create a new Category controller
	 * @param categoryService - The Category service instance
	 */
	constructor(private readonly categoryService: CategoryService) {}

	/**
	 * @description Get all categories
	 * @returns Promise with list of categories
	 */
        public async getAllCategories(userId: string, order?: SortOrder): Promise<CategoriesListResponse> {
                const categories = await this.categoryService.getAllCategories(userId, order);
		return {
			data: {
				categories,
			},
		};
	}

	/**
	 * @description Get a category by ID
	 * @param id - Category ID to retrieve
	 * @returns Promise with category data
	 */
	public async getCategoryById(userId: string, id: string): Promise<CategoryResponse> {
		const category = await this.categoryService.getCategoryById(userId, id);

		if (!category) {
			return {
				message: `Category with ID ${id} not found`,
			};
		}

		return {
			data: {
				category,
			},
		};
	}

	/**
	 * @description Create a new category
	 * @param name - Category name
	 * @param description - Optional category description
	 * @returns Promise with creation result
	 */
	public async createCategory(
		userId: string,
		name: string,
		description?: string | null,
		icon?: string | null,
	): Promise<CategoryCreateResponse> {
		const categoryId = await this.categoryService.addCategory(userId, name, description, icon);

		return {
			data: {
				id: categoryId,
			},
			message: 'Category created successfully',
		};
	}

	/**
	 * @description Update an existing category
	 * @param id - Category ID to update
	 * @param name - New category name
	 * @param description - New category description
	 * @returns Promise with update result
	 */
	public async updateCategory(
		userId: string,
		id: string,
		name: string,
		description?: string | null,
		icon?: string | null,
	): Promise<CategoryUpdateResponse> {
		await this.categoryService.updateCategory(userId, id, name, description, icon);

		return {
			message: 'Category updated successfully',
		};
	}

	/**
	 * @description Delete a category
	 * @param id - Category ID to delete
	 * @returns Promise with deletion result
	 */
	public async deleteCategory(userId: string, id: string): Promise<CategoryDeleteResponse> {
		await this.categoryService.deleteCategory(userId, id);

		return {
			message: 'Category deleted successfully',
		};
	}
}
