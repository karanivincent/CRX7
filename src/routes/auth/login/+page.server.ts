import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const loginSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters')
});

const signupSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ["confirmPassword"]
});

export const actions = {
	login: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const result = loginSchema.safeParse({ email, password });
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors,
				email
			});
		}

		const { error } = await supabase.auth.signInWithPassword({
			email: result.data.email,
			password: result.data.password
		});

		if (error) {
			return fail(400, {
				errors: { form: [error.message] },
				email: result.data.email
			});
		}

		redirect(303, '/');
	},

	signup: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		const result = signupSchema.safeParse({ email, password, confirmPassword });
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors,
				email
			});
		}

		const { error } = await supabase.auth.signUp({
			email: result.data.email,
			password: result.data.password
		});

		if (error) {
			return fail(400, {
				errors: { form: [error.message] },
				email: result.data.email
			});
		}

		return {
			message: 'Please check your email for a verification link.'
		};
	}
};