import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const mfaVerifySchema = z.object({
	code: z.string().min(6, 'Code must be 6 digits').max(6, 'Code must be 6 digits'),
	factorId: z.string().min(1, 'Factor ID is required')
});

export const actions = {
	'verify-mfa': async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const code = formData.get('code') as string;
		const factorId = formData.get('factorId') as string;

		const result = mfaVerifySchema.safeParse({ code, factorId });
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		try {
			// Create a challenge for the factor
			const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
				factorId: result.data.factorId
			});

			if (challengeError || !challenge) {
				return fail(400, {
					errors: { form: ['Failed to create MFA challenge.'] }
				});
			}

			// Verify the MFA code
			const { error: verifyError } = await supabase.auth.mfa.verify({
				factorId: result.data.factorId,
				challengeId: challenge.id,
				code: result.data.code
			});

			if (verifyError) {
				return fail(400, {
					errors: { form: ['Invalid verification code. Please try again.'] }
				});
			}

			// MFA setup successful - redirect to admin
			redirect(303, '/admin');

		} catch (error) {
			console.error('MFA setup error:', error);
			return fail(500, {
				errors: { form: ['An unexpected error occurred. Please try again.'] }
			});
		}
	}
};