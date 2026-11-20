import { env } from '@/env.js';
import fastifyOauth2, { type OAuth2Namespace } from '@fastify/oauth2';
import { pluginNames } from '@plugins/plugin-constants.js';
import { createPlugin } from '@plugins/utils/plugin-manager.js';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const googleOAuthPluginInternal: FastifyPluginAsync = async (fastify): Promise<void> => {
	if (!env.googleOauthClientId || !env.googleOauthClientSecret || !env.googleOauthCallbackUrl) {
		fastify.log.warn('Google OAuth environment variables are not fully set');
		return;
	}

	await fastify.register(fastifyOauth2, {
		name: 'googleOAuth2',
		scope: ['openid', 'profile', 'email'],
		pkce: 'S256',
		credentials: {
			client: {
				id: env.googleOauthClientId,
				secret: env.googleOauthClientSecret,
			},
			auth: {
				authorizeHost: 'https://accounts.google.com',
				authorizePath: '/o/oauth2/v2/auth',
				tokenHost: 'https://oauth2.googleapis.com',
				tokenPath: '/token',
			},
		},
		startRedirectPath: '/api/auth/google',
		callbackUri: env.googleOauthCallbackUrl,
		cookie: {
			secure: false,
			httpOnly: true,
			path: '/',
			sameSite: 'lax',
		},
	});
};

export const googleOAuthPlugin = createPlugin(fp(googleOAuthPluginInternal), {
	name: pluginNames.googleOAuth,
	dependencies: [],
});

declare module 'fastify' {
	interface FastifyInstance {
		googleOAuth2: OAuth2Namespace;
	}
}
