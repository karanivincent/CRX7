import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fail, redirect } from '@sveltejs/kit';

// Mock SvelteKit helpers
vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status, data) => ({ status, data })),
	redirect: vi.fn((status, location) => { throw new Error(`Redirect to ${location}`) })
}));

// Mock the actions
const mockSupabase = {
	auth: {
		signInWithPassword: vi.fn(),
		signUp: vi.fn()
	}
};

// Import actions after mocking
const { actions } = await import('../../../src/routes/auth/login/+page.server.js');

describe('Authentication Actions', () => {
	let mockRequest: Request;
	let mockLocals: any;

	beforeEach(() => {
		vi.clearAllMocks();
		
		mockLocals = {
			supabase: mockSupabase
		};
	});

	const createFormData = (data: Record<string, string>) => {
		const formData = new FormData();
		Object.entries(data).forEach(([key, value]) => {
			formData.append(key, value);
		});
		return formData;
	};

	const createMockRequest = (formData: FormData) => {
		return {
			formData: vi.fn().mockResolvedValue(formData)
		} as any;
	};

	describe('Login Action', () => {
		describe('Validation', () => {
			it('should reject invalid email format', async () => {
				const formData = createFormData({
					email: 'invalid-email',
					password: 'password123'
				});
				mockRequest = createMockRequest(formData);

				const result = await actions.login({ 
					request: mockRequest, 
					locals: mockLocals 
				} as any);

				expect(fail).toHaveBeenCalledWith(400, {
					errors: {
						email: ['Please enter a valid email address']
					},
					email: 'invalid-email'
				});
			});

			it('should reject password shorter than 6 characters', async () => {
				const formData = createFormData({
					email: 'test@example.com',
					password: '12345'
				});
				mockRequest = createMockRequest(formData);

				const result = await actions.login({ 
					request: mockRequest, 
					locals: mockLocals 
				} as any);

				expect(fail).toHaveBeenCalledWith(400, {
					errors: {
						password: ['Password must be at least 6 characters']
					},
					email: 'test@example.com'
				});
			});

			it('should reject empty email', async () => {
				const formData = createFormData({
					email: '',
					password: 'password123'
				});
				mockRequest = createMockRequest(formData);

				const result = await actions.login({ 
					request: mockRequest, 
					locals: mockLocals 
				} as any);

				expect(fail).toHaveBeenCalledWith(400, 
					expect.objectContaining({
						errors: expect.objectContaining({
							email: expect.arrayContaining([expect.stringContaining('valid email')])
						})
					})
				);
			});

			it('should reject empty password', async () => {
				const formData = createFormData({
					email: 'test@example.com',
					password: ''
				});
				mockRequest = createMockRequest(formData);

				const result = await actions.login({ 
					request: mockRequest, 
					locals: mockLocals 
				} as any);

				expect(fail).toHaveBeenCalledWith(400, 
					expect.objectContaining({
						errors: expect.objectContaining({
							password: expect.arrayContaining([expect.stringContaining('6 characters')])
						})
					})
				);
			});
		});

		describe('Authentication', () => {
			it('should successfully login with valid credentials', async () => {
				const formData = createFormData({
					email: 'test@example.com',
					password: 'password123'
				});
				mockRequest = createMockRequest(formData);

				mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });

				await expect(async () => {
					await actions.login({ 
						request: mockRequest, 
						locals: mockLocals 
					} as any);
				}).rejects.toThrow('Redirect to /');

				expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
					email: 'test@example.com',
					password: 'password123'
				});
				expect(redirect).toHaveBeenCalledWith(303, '/');
			});

			it('should handle authentication errors', async () => {
				const formData = createFormData({
					email: 'test@example.com',
					password: 'wrongpassword'
				});
				mockRequest = createMockRequest(formData);

				mockSupabase.auth.signInWithPassword.mockResolvedValue({ 
					error: { message: 'Invalid login credentials' }
				});

				const result = await actions.login({ 
					request: mockRequest, 
					locals: mockLocals 
				} as any);

				expect(fail).toHaveBeenCalledWith(400, {
					errors: { form: ['Invalid login credentials'] },
					email: 'test@example.com'
				});
			});

			it('should handle network errors', async () => {
				const formData = createFormData({
					email: 'test@example.com',
					password: 'password123'
				});
				mockRequest = createMockRequest(formData);

				mockSupabase.auth.signInWithPassword.mockResolvedValue({ 
					error: { message: 'Network error' }
				});

				const result = await actions.login({ 
					request: mockRequest, 
					locals: mockLocals 
				} as any);

				expect(fail).toHaveBeenCalledWith(400, {
					errors: { form: ['Network error'] },
					email: 'test@example.com'
				});
			});
		});
	});

	describe('Signup Action', () => {
		describe('Validation', () => {
			it('should reject invalid email format', async () => {
				const formData = createFormData({
					email: 'invalid-email',
					password: 'password123',
					confirmPassword: 'password123'
				});
				mockRequest = createMockRequest(formData);

				const result = await actions.signup({ 
					request: mockRequest, 
					locals: mockLocals 
				} as any);

				expect(fail).toHaveBeenCalledWith(400, {
					errors: {
						email: ['Please enter a valid email address']
					},
					email: 'invalid-email'
				});
			});

			it('should reject password shorter than 6 characters', async () => {
				const formData = createFormData({
					email: 'test@example.com',
					password: '12345',
					confirmPassword: '12345'
				});
				mockRequest = createMockRequest(formData);

				const result = await actions.signup({ 
					request: mockRequest, 
					locals: mockLocals 
				} as any);

				expect(fail).toHaveBeenCalledWith(400, {
					errors: {
						password: ['Password must be at least 6 characters']
					},
					email: 'test@example.com'
				});
			});

			it('should reject mismatched passwords', async () => {
				const formData = createFormData({
					email: 'test@example.com',
					password: 'password123',
					confirmPassword: 'differentpassword'
				});
				mockRequest = createMockRequest(formData);

				const result = await actions.signup({ 
					request: mockRequest, 
					locals: mockLocals 
				} as any);

				expect(fail).toHaveBeenCalledWith(400, {
					errors: {
						confirmPassword: ["Passwords don't match"]
					},
					email: 'test@example.com'
				});
			});

			it('should require confirmPassword field', async () => {
				const formData = createFormData({
					email: 'test@example.com',
					password: 'password123'
					// confirmPassword missing
				});
				mockRequest = createMockRequest(formData);

				const result = await actions.signup({ 
					request: mockRequest, 
					locals: mockLocals 
				} as any);

				expect(fail).toHaveBeenCalledWith(400, 
					expect.objectContaining({
						errors: expect.objectContaining({
							confirmPassword: expect.arrayContaining([expect.stringContaining("string")])
						})
					})
				);
			});
		});

		describe('Registration', () => {
			it('should successfully signup with valid data', async () => {
				const formData = createFormData({
					email: 'newuser@example.com',
					password: 'password123',
					confirmPassword: 'password123'
				});
				mockRequest = createMockRequest(formData);

				mockSupabase.auth.signUp.mockResolvedValue({ error: null });

				const result = await actions.signup({ 
					request: mockRequest, 
					locals: mockLocals 
				} as any);

				expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
					email: 'newuser@example.com',
					password: 'password123'
				});

				expect(result).toEqual({
					message: 'Please check your email for a verification link.'
				});
			});

			it('should handle signup errors', async () => {
				const formData = createFormData({
					email: 'existing@example.com',
					password: 'password123',
					confirmPassword: 'password123'
				});
				mockRequest = createMockRequest(formData);

				mockSupabase.auth.signUp.mockResolvedValue({ 
					error: { message: 'User already registered' }
				});

				const result = await actions.signup({ 
					request: mockRequest, 
					locals: mockLocals 
				} as any);

				expect(fail).toHaveBeenCalledWith(400, {
					errors: { form: ['User already registered'] },
					email: 'existing@example.com'
				});
			});

			it('should handle weak password errors', async () => {
				const formData = createFormData({
					email: 'test@example.com',
					password: 'weak123',
					confirmPassword: 'weak123'
				});
				mockRequest = createMockRequest(formData);

				mockSupabase.auth.signUp.mockResolvedValue({ 
					error: { message: 'Password should be at least 8 characters' }
				});

				const result = await actions.signup({ 
					request: mockRequest, 
					locals: mockLocals 
				} as any);

				expect(fail).toHaveBeenCalledWith(400, {
					errors: { form: ['Password should be at least 8 characters'] },
					email: 'test@example.com'
				});
			});
		});

		describe('Email Format Validation', () => {
			const invalidEmails = [
				'plainaddress',
				'@missingdomain.com',
				'missing@.com',
				'missing.domain@.com',
				'spaces @domain.com',
				'multiple@@domain.com'
			];

			invalidEmails.forEach(email => {
				it(`should reject invalid email: ${email}`, async () => {
					const formData = createFormData({
						email,
						password: 'password123',
						confirmPassword: 'password123'
					});
					mockRequest = createMockRequest(formData);

					const result = await actions.signup({ 
						request: mockRequest, 
						locals: mockLocals 
					} as any);

					expect(fail).toHaveBeenCalledWith(400, 
						expect.objectContaining({
							errors: expect.objectContaining({
								email: expect.arrayContaining([expect.stringContaining('valid email')])
							})
						})
					);
				});
			});

			const validEmails = [
				'test@domain.com',
				'user.name@domain.com',
				'user+tag@domain.co.uk',
				'123@domain.org'
			];

			validEmails.forEach(email => {
				it(`should accept valid email: ${email}`, async () => {
					const formData = createFormData({
						email,
						password: 'password123',
						confirmPassword: 'password123'
					});
					mockRequest = createMockRequest(formData);

					mockSupabase.auth.signUp.mockResolvedValue({ error: null });

					const result = await actions.signup({ 
						request: mockRequest, 
						locals: mockLocals 
					} as any);

					expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
						email,
						password: 'password123'
					});
				});
			});
		});
	});

	describe('Security Considerations', () => {
		it('should not expose password in error responses', async () => {
			const formData = createFormData({
				email: 'test@example.com',
				password: 'password123'
			});
			mockRequest = createMockRequest(formData);

			mockSupabase.auth.signInWithPassword.mockResolvedValue({ 
				error: { message: 'Invalid credentials' }
			});

			const result = await actions.login({ 
				request: mockRequest, 
				locals: mockLocals 
			} as any);

			// Ensure password is not included in the response
			expect(JSON.stringify(result)).not.toContain('password123');
		});

		it('should preserve email in error responses for UX', async () => {
			const formData = createFormData({
				email: 'test@example.com',
				password: 'short'
			});
			mockRequest = createMockRequest(formData);

			const result = await actions.login({ 
				request: mockRequest, 
				locals: mockLocals 
			} as any);

			expect(result.data.email).toBe('test@example.com');
		});

		it('should handle null/undefined form data gracefully', async () => {
			const formData = new FormData();
			// Intentionally empty form data
			mockRequest = createMockRequest(formData);

			const result = await actions.login({ 
				request: mockRequest, 
				locals: mockLocals 
			} as any);

			expect(fail).toHaveBeenCalledWith(400, 
				expect.objectContaining({
					errors: expect.any(Object)
				})
			);
		});
	});
});