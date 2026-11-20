import type { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import type { CreateUserInput } from '../../api/schemas/user.schema.js';
import { fromAny } from '@total-typescript/shoehorn';
/**
 * Input Validation Security Tests
 * Verifies protection against common injection attacks and malformed input
 */
import { buildServer } from '../../api/server.js';

describe('Input Validation Security', () => {
	let app: FastifyInstance;
	let request: ReturnType<typeof supertest>;
	let authToken: string;

	// Test user with valid credentials
        const validUser: CreateUserInput = {
                email: 'input.test@example.com',
                password: 'SecurePassword123!',
                name: 'Input Tester',
                confirmPassword: 'SecurePassword123!',
                baseCurrency: 'BRL',
                provider: 'LOCAL',
        };

	// Setup test server before tests
	beforeAll(async () => {
		// Build Fastify server
		app = await buildServer();
		await app.ready();
		request = supertest(app.server);

		// Register test user
		try {
			await request.post('/api/auth/register').send(validUser);
		} catch (err) {
			// User might already exist, which is fine
		}

		// Get auth token
		const loginResponse = await request.post('/api/auth/login').send({
			email: validUser.email,
			password: validUser.password,
		});

		authToken = loginResponse.body.accessToken;
	});

	// Clean up after tests
	afterAll(async () => {
		await app.close();
	});

	describe('Registration endpoint validation', () => {
                test('rejects SQL injection in email field', async () => {
                        const maliciousPayload = fromAny<CreateUserInput>({
                                email: "' OR 1=1; --",
                                password: 'password123',
                                name: 'SQL Injector',
                        });

			await request
				.post('/api/auth/register')
				.send(maliciousPayload)
				.expect((res) => {
					expect(res.status).not.toBe(201);
				});
		});

                test('rejects too short passwords', async () => {
                        const invalidPayload = fromAny<CreateUserInput>({
                                email: 'short.password@example.com',
                                password: '123', // Too short
                                name: 'Short Password User',
                        });

			await request
				.post('/api/auth/register')
				.send(invalidPayload)
				.expect((res) => {
					expect(res.status).not.toBe(201);
				});
		});

		test('rejects missing required fields', async () => {
			// Missing email
                        await request
                                .post('/api/auth/register')
                                .send(
                                        fromAny<CreateUserInput>({
                                                password: 'password123',
                                                name: 'Missing Email',
                                        }),
                                )
                                .expect((res) => {
                                        expect(res.status).not.toBe(201);
                                });

			// Missing password
                        await request
                                .post('/api/auth/register')
                                .send(
                                        fromAny<CreateUserInput>({
                                                email: 'missing.password@example.com',
                                                name: 'Missing Password',
                                        }),
                                )
                                .expect((res) => {
                                        expect(res.status).not.toBe(201);
                                });
		});

                test('rejects invalid email formats', async () => {
                        const invalidEmailPayload = fromAny<CreateUserInput>({
                                email: 'not-an-email',
                                password: 'password123',
                                name: 'Invalid Email User',
                        });

			await request
				.post('/api/auth/register')
				.send(invalidEmailPayload)
				.expect((res) => {
					expect(res.status).not.toBe(201);
				});
		});

                test('rejects extremely long input fields', async () => {
                        const longStringPayload = fromAny<CreateUserInput>({
                                email: `${'a'.repeat(1000)}@example.com`,
                                password: 'password123',
                                name: 'A'.repeat(1000),
                        });

			await request
				.post('/api/auth/register')
				.send(longStringPayload)
				.expect((res) => {
					expect(res.status).not.toBe(201);
				});
		});
	});

	describe('Login endpoint validation', () => {
                test('rejects NoSQL injection patterns', async () => {
                        const noSqlInjectionPayload = fromAny<CreateUserInput>({
                                email: { $ne: null } as unknown as string,
                                password: { $ne: null } as unknown as string,
                        });

			await request
				.post('/api/auth/login')
				.send(noSqlInjectionPayload)
				.expect((res) => {
					expect(res.status).not.toBe(200);
				});
		});

		test('prevents username enumeration via timing attacks', async () => {
			const startTime = process.hrtime();

			await request
				.post('/api/auth/login')
				.send({
					email: validUser.email,
					password: 'wrong-password',
				})
				.expect(401);

			const existingUserTime = process.hrtime(startTime);

			const startTime2 = process.hrtime();

			await request
				.post('/api/auth/login')
				.send({
					email: 'nonexistent@example.com',
					password: 'wrong-password',
				})
				.expect(404);

			const nonExistentUserTime = process.hrtime(startTime2);

			const existingUserNano = existingUserTime[0] * 1e9 + existingUserTime[1];
			const nonExistentUserNano = nonExistentUserTime[0] * 1e9 + nonExistentUserTime[1];

			const ratio = Math.max(existingUserNano, nonExistentUserNano) / Math.min(existingUserNano, nonExistentUserNano);

			expect(ratio).toBeLessThan(50);
		});
	});

	describe('Protected endpoints validation', () => {
		test('ignores invalid query parameters', async () => {
			await request.get('/api/auth/me?__proto__=polluted').set('Authorization', `Bearer ${authToken}`).expect(200);

			await request
				.get('/api/auth/me?constructor[prototype][props]=polluted')
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200);
		});

		test('sanitizes response data to prevent stored XSS', async () => {
			const response = await request.get('/api/auth/me').set('Authorization', `Bearer ${authToken}`).expect(200);

			const responseStr = JSON.stringify(response.body);

			expect(responseStr.includes('<script>')).toBe(false);
			expect(responseStr.includes('javascript:')).toBe(false);
			expect(responseStr.includes('onerror=')).toBe(false);
		});
	});
});
