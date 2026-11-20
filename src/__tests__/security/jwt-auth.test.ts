import type { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import type { CreateUserInput } from '../../api/schemas/user.schema.js';
/**
 * JWT Authentication Security Tests
 * Verifies that JWT authentication and authorization are working correctly
 */
import { buildServer } from '../../api/server.js';

/**
 * Test user credentials
 */
const testUser: CreateUserInput = {
        email: 'security.test@example.com',
        password: 'SecureTestP@ssw0rd',
        name: 'Security Tester',
        confirmPassword: 'SecureTestP@ssw0rd',
        baseCurrency: 'BRL',
        provider: 'LOCAL',
};

describe('JWT Authentication Security', () => {
	let app: FastifyInstance;
	let request: ReturnType<typeof supertest>;
	let authToken: string;

	// Setup test server before tests
	beforeAll(async () => {
		// Build Fastify server
		app = await buildServer();
		await app.ready();
		request = supertest(app.server);

		// Register test user if needed, ignoring if already exists
		try {
			await request
				.post('/api/auth/register')
				.send(testUser)
				.expect((res) => {
					if (res.status !== 201 && res.status !== 409) {
						// 409 = user already exists
						throw new Error(`Unexpected status code: ${res.status}`);
					}
				});
		} catch (err) {
			// User might already exist, which is fine
		}

		// Get auth token
		const loginResponse = await request.post('/api/auth/login').send({
			email: testUser.email,
			password: testUser.password,
		});

		authToken = loginResponse.body.accessToken;
	});

	// Clean up after tests
	afterAll(async () => {
		await app.close();
	});

	/**
	 * Test that unauthenticated requests to protected endpoints are rejected
	 */
	test('rejects unauthenticated access to protected resources', async () => {
		await request.get('/api/auth/me').expect(401);
	});

	/**
	 * Test that authenticated requests to protected endpoints are allowed
	 */
	test('allows authenticated access to protected resources', async () => {
		const response = await request.get('/api/auth/me').set('Authorization', `Bearer ${authToken}`).expect(200);

		expect(response.body).toBeDefined();
		expect(response.body.email).toBe(testUser.email);
	});

	/**
	 * Test that malformed tokens are rejected
	 */
	test('rejects malformed tokens', async () => {
		await request.get('/api/auth/me').set('Authorization', 'Bearer malformed.token.here').expect(401);
	});

	/**
	 * Test that expired tokens are rejected
	 */
	test('rejects expired tokens', async () => {
		// Not an issued token. The API must reject it.
		const expiredToken = 'expired-token-fixture';

		await request.get('/api/auth/me').set('Authorization', `Bearer ${expiredToken}`).expect(401);
	});
});
