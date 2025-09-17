import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const mfaSchema = z.object({
	code: z.string().min(6, 'Code must be 6 digits').max(6, 'Code must be 6 digits')
});

export const actions = {
	'verify-mfa-login': async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const code = formData.get('code') as string;

		const result = mfaSchema.safeParse({ code });
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		try {
			// Get the current user session
			const { data: { user } } = await supabase.auth.getUser();
			
			if (!user) {
				return fail(400, {
					errors: { form: ['No user session found. Please login again.'] }
				});
			}

			// List available factors for the user
			const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
			
			if (factorsError || !factors?.totp?.length) {
				return fail(400, {
					errors: { form: ['No MFA factors found for this user.'] }
				});
			}

			const factor = factors.totp[0];

			// Create MFA challenge
			const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
				factorId: factor.id
			});

			if (challengeError || !challenge) {
				return fail(400, {
					errors: { form: ['Failed to create MFA challenge.'] }
				});
			}

			// Verify the MFA code
			const { error: verifyError } = await supabase.auth.mfa.verify({
				factorId: factor.id,
				challengeId: challenge.id,
				code: result.data.code
			});

			if (verifyError) {
				return fail(400, {
					errors: { form: ['Invalid verification code. Please try again.'] }
				});
			}

			// MFA successful - redirect to dashboard
			redirect(303, '/admin');

		} catch (error) {
			console.error('MFA verification error:', error);
			return fail(500, {
				errors: { form: ['An unexpected error occurred. Please try again.'] }
			});
		}
	}
};