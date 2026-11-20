import { env } from '@/env.js';
import type {
	CheckEmailInput,
	CheckEmailResponse,
	CreateUserInput,
	GoogleLoginBody,
	LoginResponse,
	LoginUserInput,
} from '@schemas/user.schema.js';
import type { UserService } from '@services/user.service.js';
import { transformUser } from '@transformers/user.transformer.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { OAuth2Client } from 'google-auth-library';

/**
 * Controller for handling user authentication and registration
 */
export class AuthController {
	private readonly userService: UserService;
	private readonly client: OAuth2Client;

	/**
	 * Create a new AuthController
	 * @param userService - User service dependency
	 */
	constructor(userService: UserService) {
		this.userService = userService;
		this.client = new OAuth2Client(env.googleOauthClientId);
	}

	/**
	 * Register a new user
	 * @param request - Fastify request with user data
	 * @returns Created user data
	 */
	async registerUser(request: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply): Promise<LoginResponse> {
		const input = request.body;
		const user = await this.userService.createUser(input);

		const token = await reply.jwtSign(
			{
				id: user.id,
				email: user.email,
				role: user.role,
			},
			{
				expiresIn: '1d',
			},
		);

		const transformedUser = transformUser(user);
		return {
			accessToken: token,
			user: transformedUser,
		};
	}

	/**
	 * Log in a user
	 * @param request - Fastify request with login credentials
	 * @param reply - Fastify reply
	 * @returns Login response with JWT token
	 */
	async loginUser(request: FastifyRequest<{ Body: LoginUserInput }>, reply: FastifyReply): Promise<LoginResponse> {
		const input = request.body;
		const user = await this.userService.login(input);

		const token = await reply.jwtSign(
			{
				id: user.id,
				email: user.email,
				role: user.role,
			},
			{
				expiresIn: '1d',
			},
		);

		const transformedUser = transformUser(user);

		return {
			accessToken: token,
			user: transformedUser,
		};
	}

	/**
	 * Check if an email already exists
	 * @param request - Fastify request with email query
	 * @returns Object with boolean exists property
	 */
	async checkEmail(request: FastifyRequest<{ Querystring: CheckEmailInput }>): Promise<CheckEmailResponse> {
		const input = request.query;
		const exists = await this.userService.emailExists(input.email);
		return { exists };
	}

	/**
	 * Handle Google OAuth callback (web)
	 */
	async handleGoogleCallback(request: FastifyRequest, reply: FastifyReply): Promise<LoginResponse> {
		const { token } = await reply.server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

		const ticket = await this.client.verifyIdToken({
			idToken: token.id_token ?? '',
			audience: env.googleOauthClientId,
		});
		const { sub: googleId, email, name, picture } = ticket.getPayload() ?? {};
		if (!email || !name || !googleId) {
			throw new Error('Invalid token');
		}

		const user = await this.userService.findOrCreateGoogleUser(googleId, email, name, picture ?? undefined);
		const jwtToken = await reply.jwtSign({ id: user.id, email: user.email, role: user.role }, { expiresIn: '1d' });

		return { accessToken: jwtToken, user: transformUser(user) };
	}

	/**
	 * Login with Google (mobile)
	 */
	async loginWithGoogle(
		request: FastifyRequest<{ Body: GoogleLoginBody }>,
		reply: FastifyReply,
	): Promise<LoginResponse> {
		const { token } = request.body;

		const ticket = await this.client.verifyIdToken({
			idToken: token,
			audience: env.googleOauthClientId,
		});
		const payload = ticket.getPayload();

		if (!payload?.sub || !payload.email || !payload.name) {
			throw new Error('Invalid Google token');
		}

		const user = await this.userService.findOrCreateGoogleUser(
			payload.sub,
			payload.email,
			payload.name,
			payload.picture ?? undefined,
		);

		const accessToken = await reply.jwtSign({ id: user.id, email: user.email, role: user.role }, { expiresIn: '1d' });

		return { accessToken, user: transformUser(user) };
	}
}
