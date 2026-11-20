import type { CreateUserResponse, UpdateAvatarResponse, UpdateUserInput } from '@schemas/user.schema.js';
import type { UserService } from '@services/user.service.js';
import { transformUser } from '@transformers/user.transformer.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Controller for handling user profile operations
 */
export class ProfileController {
	constructor(private readonly userService: UserService) {}

	public async getCurrentUser(request: FastifyRequest): Promise<CreateUserResponse> {
		const { id } = request.user;
		const user = await this.userService.findUserById(id);
		return transformUser(user);
	}

	public async updateAvatar(request: FastifyRequest, _reply: FastifyReply): Promise<UpdateAvatarResponse> {
		const file = await request.file();
		if (!file) {
			return { avatarUrl: '' };
		}

		const buffer = await file.toBuffer();
		const { id } = request.user;

		const avatarUrl = await request.server.avatarService.saveAvatar(id, { buffer, mimetype: file.mimetype });
		await this.userService.updateAvatar(id, avatarUrl);

		return { avatarUrl };
	}

	public async updateCurrentUser(request: FastifyRequest<{ Body: UpdateUserInput }>): Promise<CreateUserResponse> {
		const { id } = request.user;
		const { name, baseCurrency } = request.body;
		const user = await this.userService.updateUser(id, { name, baseCurrency: baseCurrency ?? undefined });
		return transformUser(user);
	}
}
