import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// First, try to create the table if it doesn't exist
		const supabase = locals.supabase;
		
		// Create table using SQL query
		const createResult = await supabase.rpc('exec_sql', {
			sql: `
				CREATE TABLE IF NOT EXISTS "profile" (
					"id" uuid PRIMARY KEY NOT NULL,
					"first_name" text NOT NULL,
					"last_name" text NOT NULL,
					"email" text NOT NULL
				);
				ALTER TABLE "profile" ENABLE ROW LEVEL SECURITY;
			`
		});
		
		console.log('Create table result:', createResult);
		
		// Test basic Supabase connection (table name is 'profile' not 'profiles')
		const { data, error } = await supabase.from('profile').select('id').limit(1);
		
		if (error) {
			throw new Error(`Supabase error: ${error.message}`);
		}
		
		return json({
			success: true,
			message: 'Supabase connection successful',
			dataLength: data?.length || 0,
			tableCreated: createResult.error ? false : true
		});
		
	} catch (supabaseError) {
		console.log('Supabase failed, trying direct database connection...');
		
		try {
			// Fallback to direct database connection
			const { db } = await import('$lib/db');
			
			// Try a simple query using proper Drizzle syntax
			const result = await db.execute(sql`SELECT 1 as test`);
			
			return json({
				success: true,
				message: 'Direct database connection successful',
				testResult: result.rows[0],
				rowCount: result.rows.length
			});
			
		} catch (dbError) {
			console.error('All connection methods failed:', { supabaseError, dbError });
			return json(
				{
					success: false,
					supabaseError: supabaseError instanceof Error ? supabaseError.message : 'Unknown Supabase error',
					dbError: dbError instanceof Error ? dbError.message : 'Unknown database error'
				},
				{ status: 500 }
			);
		}
	}
};