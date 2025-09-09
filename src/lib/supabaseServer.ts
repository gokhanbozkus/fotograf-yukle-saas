import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null = null
export function getSupabaseAdmin() {
	if (cached) return cached
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!supabaseUrl || !serviceRole) {
		throw new Error('Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
	}
	cached = createClient(supabaseUrl, serviceRole)
	return cached
}
