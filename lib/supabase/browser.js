'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para o browser (uploads diretos ao Storage).
 * Singleton: reutilizado entre renders.
 */
let cliente = null

export function getSupabaseBrowserClient() {
  if (!cliente) {
    cliente = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return cliente
}
