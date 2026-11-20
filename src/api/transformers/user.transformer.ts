import type { User } from '@prisma/client';
import type { CreateUserResponse } from '@schemas/user.schema.js';

export function transformUser(user: User): CreateUserResponse {
	return {
		id: user.id,
		email: user.email,
		name: user.name,
		avatarUrl: user.avatarUrl ?? null,
		baseCurrency: user.baseCurrency,
		role: user.role,
	};
}
