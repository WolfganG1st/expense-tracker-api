import type { UsersListResponse, UserDeleteResponse } from '@schemas/user.schema.js';
import type { SortOrder } from '@schemas/common.schema.js';
import type { UserService } from '@services/user.service.js';
import { transformUser } from '@transformers/user.transformer.js';

/**
 * Controller for handling user management operations
 */
export class UserController {
	constructor(private readonly userService: UserService) {}

        public async getAllUsers(order?: SortOrder): Promise<UsersListResponse> {
                const users = await this.userService.getAllUsers(order);
		return {
			data: {
				users: users.map(transformUser),
			},
		};
	}

	public async deleteUser(id: string): Promise<UserDeleteResponse> {
		await this.userService.deleteUser(id);
		return { message: 'User deleted successfully' };
	}
}
